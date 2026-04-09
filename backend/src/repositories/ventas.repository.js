import {pool} from "../config/db.js";

const ESTADOS = {
    PENDIENTE: "pendiente",
    CONFIRMADA: "confirmada",
    CANCELADA: "cancelada",
    ANULADA: "anulada",
};

async function getEstadoByDescripcion(client, descripcion) {
    const { rows } = await client.query(
        `SELECT estado_id, descripcion FROM estados_venta WHERE LOWER(descripcion) = LOWER($1) LIMIT 1`,
        [descripcion]
    );
    return rows[0] || null;
}

async function getVentaByIdWithClient(client, ventaId) {
    const query = `
        SELECT
            v.*,
            c.nombre AS cliente_nombre,
            c.email AS cliente_email,
            c.telefono AS cliente_telefono,
            e.descripcion AS estado_nombre,
            COALESCE(
                json_agg(
                    json_build_object(
                        'detalle_id', dv.detalle_id,
                        'variante_id', dv.variante_id,
                        'cantidad', dv.cantidad,
                        'precio_unitario', dv.precio_unitario,
                        'subtotal', dv.cantidad * dv.precio_unitario,
                        'producto_id', p.producto_id,
                        'producto_nombre', p.nombre,
                        'size_valor', s.valor,
                        'tela_nombre', t.nombre,
                        'color', vp.color,
                        'relleno', vp.relleno
                    )
                    ORDER BY dv.detalle_id ASC
                ) FILTER (WHERE dv.detalle_id IS NOT NULL),
                '[]'::json
            ) AS detalle_items
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.cliente_id
        JOIN estados_venta e ON v.estado_id = e.estado_id
        LEFT JOIN detalle_ventas dv ON dv.venta_id = v.venta_id
        LEFT JOIN variantes_producto vp ON vp.variante_id = dv.variante_id
        LEFT JOIN productos p ON p.producto_id = vp.producto_id
        LEFT JOIN sizes s ON s.size_id = vp.size_id
        LEFT JOIN tela t ON t.tela_id = vp.tela_id
        WHERE v.venta_id = $1
        GROUP BY v.venta_id, c.cliente_id, e.estado_id
    `;
    const { rows } = await client.query(query, [ventaId]);
    return rows[0] || null;
}

async function descontarStockPorVenta(client, ventaId) {
    const detalles = await client.query(
        `SELECT variante_id, cantidad FROM detalle_ventas WHERE venta_id = $1`,
        [ventaId]
    );

    if (detalles.rowCount === 0) {
        throw new Error("La venta no tiene items para actualizar stock");
    }

    for (const item of detalles.rows) {
        const updateStockQuery = `
            UPDATE variantes_producto
            SET stock = stock - $1
            WHERE variante_id = $2 AND stock >= $1
            RETURNING stock
        `;
        const stockRes = await client.query(updateStockQuery, [item.cantidad, item.variante_id]);

        if (stockRes.rowCount === 0) {
            throw new Error(`Stock insuficiente para variante_id ${item.variante_id}`);
        }
    }
}

async function reponerStockPorVenta(client, ventaId) {
    const detalles = await client.query(
        `SELECT variante_id, cantidad FROM detalle_ventas WHERE venta_id = $1`,
        [ventaId]
    );

    if (detalles.rowCount === 0) {
        throw new Error("La venta no tiene items para reponer stock");
    }

    for (const item of detalles.rows) {
        await client.query(
            `
                UPDATE variantes_producto
                SET stock = stock + $1
                WHERE variante_id = $2
            `,
            [item.cantidad, item.variante_id]
        );
    }
}

export const ventasRepository = {

    async CreateVenta(ventaData, items) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const estadoPendienteId = Number(ventaData?.estado_id) || 1;

        // 1. Insertar la venta (ponemos total 0 inicialmente, lo actualizaremos al final)
        const ventaQuery = `
            INSERT INTO ventas (total, metodo_id, cliente_id, estado_id)
            VALUES ($1, $2, $3, $4)
            RETURNING venta_id;
        `;
        const { rows: ventaRows } = await client.query(ventaQuery, [0, ventaData.metodo_id, ventaData.cliente_id, estadoPendienteId]);
        const idGenerado = ventaRows[0].venta_id;

        let totalCalculado = 0;

        // 2. Procesar items
        for (const item of items) {
            // BUSCAR PRECIO (OFERTA SI APLICA)
            const precioQuery = `SELECT CASE WHEN en_oferta THEN precio_oferta ELSE precio END AS precio FROM variantes_producto WHERE variante_id = $1`;
            const { rows: precioRows } = await client.query(precioQuery, [item.variante_id]);
            
            if (precioRows.length === 0) throw new Error(`La variante ${item.variante_id} no existe`);
            
            const precioUnitario = precioRows[0].precio;
            totalCalculado += precioUnitario * item.cantidad;

            // INSERTAR DETALLE con el precio encontrado
            const detalleQuery = `
                INSERT INTO detalle_ventas (cantidad, precio_unitario, venta_id, variante_id)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(detalleQuery, [item.cantidad, precioUnitario, idGenerado, item.variante_id]);
        }

        // 3. ACTUALIZAR EL TOTAL REAL DE LA VENTA
        await client.query(`UPDATE ventas SET total = $1 WHERE venta_id = $2`, [totalCalculado, idGenerado]);

        await client.query('COMMIT');
        return {
            id: idGenerado,
            total: totalCalculado,
            ...ventaData,
            estado_id: estadoPendienteId,
            estado: 'pendiente',
            items,
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
},

async createVentaDirecta(ventaData, items) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const estadoConfirmada = await getEstadoByDescripcion(client, ESTADOS.CONFIRMADA);
        if (!estadoConfirmada) {
            throw new Error("No se encontró el estado 'confirmada' en estados_venta");
        }

        const ventaQuery = `
            INSERT INTO ventas (total, metodo_id, cliente_id, estado_id)
            VALUES ($1, $2, $3, $4)
            RETURNING venta_id;
        `;
        const { rows: ventaRows } = await client.query(ventaQuery, [0, ventaData.metodo_id, ventaData.cliente_id, estadoConfirmada.estado_id]);
        const idGenerado = ventaRows[0].venta_id;

        let totalCalculado = 0;

        for (const item of items) {
            // BUSCAR PRECIO (OFERTA SI APLICA)
            const precioQuery = `SELECT CASE WHEN en_oferta THEN precio_oferta ELSE precio END AS precio FROM variantes_producto WHERE variante_id = $1`;
            const { rows: precioRows } = await client.query(precioQuery, [item.variante_id]);
            const precioUnitario = precioRows[0].precio;
            
            totalCalculado += precioUnitario * item.cantidad;

            // INSERTAR DETALLE
            await client.query(`
                INSERT INTO detalle_ventas (cantidad, precio_unitario, venta_id, variante_id)
                VALUES ($1, $2, $3, $4)
            `, [item.cantidad, precioUnitario, idGenerado, item.variante_id]);

        }

        await descontarStockPorVenta(client, idGenerado);

        // ACTUALIZAR TOTAL REAL
        await client.query(`UPDATE ventas SET total = $1 WHERE venta_id = $2`, [totalCalculado, idGenerado]);

        await client.query('COMMIT');
        return { id: idGenerado, total: totalCalculado, ...ventaData, items, estado: ESTADOS.CONFIRMADA };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
},


    async findAll(filters = {}){
        const values = [];
        const where = [];

        if (Number.isInteger(Number(filters.mes)) && Number(filters.mes) >= 1 && Number(filters.mes) <= 12) {
            values.push(Number(filters.mes));
            where.push(`EXTRACT(MONTH FROM v.created_at) = $${values.length}`);
        }

        if (Number.isInteger(Number(filters.anio)) && Number(filters.anio) >= 2000) {
            values.push(Number(filters.anio));
            where.push(`EXTRACT(YEAR FROM v.created_at) = $${values.length}`);
        }

        const query = `
        SELECT
            v.*,
            c.nombre AS cliente_nombre,
            c.email AS cliente_email,
            c.telefono AS cliente_telefono,
            e.descripcion AS estado_nombre,
            COALESCE(
                json_agg(
                    json_build_object(
                        'detalle_id', dv.detalle_id,
                        'variante_id', dv.variante_id,
                        'cantidad', dv.cantidad,
                        'precio_unitario', dv.precio_unitario,
                        'subtotal', dv.cantidad * dv.precio_unitario,
                        'producto_id', p.producto_id,
                        'producto_nombre', p.nombre,
                        'size_valor', s.valor,
                        'tela_nombre', t.nombre,
                        'color', vp.color,
                        'relleno', vp.relleno
                    )
                    ORDER BY dv.detalle_id ASC
                ) FILTER (WHERE dv.detalle_id IS NOT NULL),
                '[]'::json
            ) AS detalle_items
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.cliente_id
        JOIN estados_venta e ON v.estado_id = e.estado_id
        LEFT JOIN detalle_ventas dv ON dv.venta_id = v.venta_id
        LEFT JOIN variantes_producto vp ON vp.variante_id = dv.variante_id
        LEFT JOIN productos p ON p.producto_id = vp.producto_id
        LEFT JOIN sizes s ON s.size_id = vp.size_id
        LEFT JOIN tela t ON t.tela_id = vp.tela_id
        ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
        GROUP BY v.venta_id, c.cliente_id, e.estado_id
        ORDER BY v.created_at DESC
        `;
        const {rows} = await pool.query(query, values);
        return rows;
    },

    async findById(id) {
        const query = `
        SELECT
            v.*,
            c.nombre AS cliente_nombre,
            c.email AS cliente_email,
            c.telefono AS cliente_telefono,
            e.descripcion AS estado_nombre,
            COALESCE(
                json_agg(
                    json_build_object(
                        'detalle_id', dv.detalle_id,
                        'variante_id', dv.variante_id,
                        'cantidad', dv.cantidad,
                        'precio_unitario', dv.precio_unitario,
                        'subtotal', dv.cantidad * dv.precio_unitario,
                        'producto_id', p.producto_id,
                        'producto_nombre', p.nombre,
                        'size_valor', s.valor,
                        'tela_nombre', t.nombre,
                        'color', vp.color,
                        'relleno', vp.relleno
                    )
                    ORDER BY dv.detalle_id ASC
                ) FILTER (WHERE dv.detalle_id IS NOT NULL),
                '[]'::json
            ) AS detalle_items
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.cliente_id
        JOIN estados_venta e ON v.estado_id = e.estado_id
        LEFT JOIN detalle_ventas dv ON dv.venta_id = v.venta_id
        LEFT JOIN variantes_producto vp ON vp.variante_id = dv.variante_id
        LEFT JOIN productos p ON p.producto_id = vp.producto_id
        LEFT JOIN sizes s ON s.size_id = vp.size_id
        LEFT JOIN tela t ON t.tela_id = vp.tela_id
        WHERE v.venta_id = $1
        GROUP BY v.venta_id, c.cliente_id, e.estado_id
        `;
        const {rows} = await pool.query(query, [id]);
        return rows[0];
    },

    async getEstadosVenta() {
        const { rows } = await pool.query(
            `SELECT estado_id, descripcion FROM estados_venta ORDER BY estado_id ASC`
        );
        return rows;
    },

    async getMetodosPago() {
        const { rows } = await pool.query(
            `SELECT metodo_id, descripcion FROM metodos_pago ORDER BY metodo_id ASC`
        );
        return rows;
    },

    async findEstadoByDescripcion(descripcion) {
        const { rows } = await pool.query(
            `SELECT estado_id, descripcion FROM estados_venta WHERE LOWER(descripcion) = LOWER($1) LIMIT 1`,
            [descripcion]
        );
        return rows[0] || null;
    },

    async actualizarEstadoVenta(ventaId, nuevoEstadoId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const ventaActual = await client.query(
                `
                    SELECT v.venta_id, v.estado_id, e.descripcion AS estado_actual
                    FROM ventas v
                    JOIN estados_venta e ON e.estado_id = v.estado_id
                    WHERE v.venta_id = $1
                    FOR UPDATE
                `,
                [ventaId]
            );

            if (ventaActual.rowCount === 0) {
                throw new Error("Venta no encontrada");
            }

            const estadoNuevo = await client.query(
                `
                    SELECT estado_id, descripcion
                    FROM estados_venta
                    WHERE estado_id = $1
                    LIMIT 1
                `,
                [nuevoEstadoId]
            );

            if (estadoNuevo.rowCount === 0) {
                throw new Error("Estado de venta no válido");
            }

            const estadoActual = ventaActual.rows[0];
            const nuevoEstado = estadoNuevo.rows[0];

            const actualNombre = String(estadoActual.estado_actual || "").toLowerCase();
            const nuevoNombre = String(nuevoEstado.descripcion || "").toLowerCase();

            const transicionesPermitidas = {
                [ESTADOS.PENDIENTE]: [ESTADOS.CONFIRMADA, ESTADOS.CANCELADA, ESTADOS.ANULADA],
                [ESTADOS.CONFIRMADA]: [ESTADOS.ANULADA],
                [ESTADOS.CANCELADA]: [],
                [ESTADOS.ANULADA]: [],
            };

            if (Number(estadoActual.estado_id) === Number(nuevoEstado.estado_id)) {
                await client.query('COMMIT');
                return await getVentaByIdWithClient(client, ventaId);
            }

            const permitidos = transicionesPermitidas[actualNombre] || [];
            if (!permitidos.includes(nuevoNombre)) {
                throw new Error(`No se puede pasar de '${actualNombre}' a '${nuevoNombre}'`);
            }

            if (actualNombre !== ESTADOS.CONFIRMADA && nuevoNombre === ESTADOS.CONFIRMADA) {
                await descontarStockPorVenta(client, ventaId);
            }

            if (actualNombre === ESTADOS.CONFIRMADA && nuevoNombre === ESTADOS.ANULADA) {
                await reponerStockPorVenta(client, ventaId);
            }

            await client.query(
                `
                    UPDATE ventas
                    SET estado_id = $1
                    WHERE venta_id = $2
                `,
                [nuevoEstado.estado_id, ventaId]
            );

            const ventaActualizada = await getVentaByIdWithClient(client, ventaId);

            await client.query('COMMIT');
            return ventaActualizada;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async eliminarVenta(ventaId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const ventaActual = await client.query(
                `
                    SELECT v.venta_id, v.estado_id, e.descripcion AS estado_actual
                    FROM ventas v
                    JOIN estados_venta e ON e.estado_id = v.estado_id
                    WHERE v.venta_id = $1
                    FOR UPDATE
                `,
                [ventaId]
            );

            if (ventaActual.rowCount === 0) {
                throw new Error("Venta no encontrada");
            }

            const actualNombre = String(ventaActual.rows[0].estado_actual || "").toLowerCase();

            if (actualNombre === ESTADOS.CONFIRMADA) {
                await reponerStockPorVenta(client, ventaId);
            }

            await client.query(`DELETE FROM detalle_ventas WHERE venta_id = $1`, [ventaId]);
            await client.query(`DELETE FROM ventas WHERE venta_id = $1`, [ventaId]);

            await client.query('COMMIT');
            return { success: true, venta_id: Number(ventaId) };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
};