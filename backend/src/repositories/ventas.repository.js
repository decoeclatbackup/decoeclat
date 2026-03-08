import {pool} from "../config/db.js";

export const ventasRepository = {

    async CreateVenta(ventaData, items) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insertar la venta (ponemos total 0 inicialmente, lo actualizaremos al final)
        const ventaQuery = `
            INSERT INTO ventas (total, metodo_id, cliente_id, estado_id)
            VALUES ($1, $2, $3, $4)
            RETURNING venta_id;
        `;
        const { rows: ventaRows } = await client.query(ventaQuery, [0, ventaData.metodo_id, ventaData.cliente_id, 1]);
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
        return { id: idGenerado, total: totalCalculado, ...ventaData, items };
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

        const ventaQuery = `
            INSERT INTO ventas (total, metodo_id, cliente_id, estado_id)
            VALUES ($1, $2, $3, $4)
            RETURNING venta_id;
        `;
        const { rows: ventaRows } = await client.query(ventaQuery, [0, ventaData.metodo_id, ventaData.cliente_id, 2]);
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

            // ACTUALIZAR STOCK (Solo en venta directa)
            const updateStockQuery = `
                UPDATE variantes_producto
                SET stock = stock - $1
                WHERE variante_id = $2 AND stock >= $1
                RETURNING stock
            `;
            const stockRes = await client.query(updateStockQuery, [item.cantidad, item.variante_id]);
            if (stockRes.rowCount === 0) throw new Error(`Stock insuficiente para variante_id ${item.variante_id}`);
        }

        // ACTUALIZAR TOTAL REAL
        await client.query(`UPDATE ventas SET total = $1 WHERE venta_id = $2`, [totalCalculado, idGenerado]);

        await client.query('COMMIT');
        return { id: idGenerado, total: totalCalculado, ...ventaData, items, estado: 'confirmada' };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
},


    async findAll(){
        const query = `
        SELECT v.*, c.nombre AS cliente_nombre, e.descripcion AS estado_nombre
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.cliente_id
        JOIN estados_venta e ON v.estado_id = e.estado_id
        ORDER BY v.created_at DESC
        `;
        const {rows} = await pool.query(query);
        return rows;
    },

    async findById(id) {
        const query = `
        SELECT v.*, c.nombre AS cliente_nombre, e.descripcion AS estado_nombre
        FROM ventas v
        JOIN clientes c ON v.cliente_id = c.cliente_id
        JOIN estados_venta e ON v.estado_id = e.estado_id
        WHERE v.venta_id = $1
        `;
        const {rows} = await pool.query(query, [id]);
        return rows[0];
    },

    async confirmarVenta(ventaId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const detalles = await client.query(`
                SELECT variante_id, cantidad FROM detalle_ventas WHERE venta_id = $1
            `, [ventaId]);

            for (const item of detalles.rows) {
                const updateStock = `
                    UPDATE variantes_producto
                    SET stock = stock - $1
                    WHERE variante_id = $2 AND stock >= $1
                    RETURNING stock
                `;
                const res = await client.query(updateStock, [item.cantidad, item.variante_id]);

                if (res.rowCount === 0) {
                    throw new Error(`Stock insuficiente para variante_id ${item.variante_id}`);
                }
            }

            await client.query(`
                UPDATE ventas
                SET estado_id = 2
                WHERE venta_id = $1
            `, [ventaId]);

            await client.query('COMMIT');
            return {success: true} ;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        },

    async anularVenta(ventaId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const detalles = await client.query(`
                SELECT variante_id, cantidad FROM detalle_ventas WHERE venta_id = $1
            `, [ventaId]);

            for (const item of detalles.rows) {
                await client.query(`
                    UPDATE variantes_producto
                    SET stock = stock + $1
                    WHERE variante_id = $2
                `, [item.cantidad, item.variante_id]);
            }

            await client.query(`
                UPDATE ventas
                SET estado_id = 4
                WHERE venta_id = $1
            `, [ventaId]);

            await client.query('COMMIT');
            return {success: true};
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },
};