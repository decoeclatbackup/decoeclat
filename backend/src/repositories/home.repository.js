import { pool } from "../config/db.js";

export const homeRepository = {
    // === PRODUCTOS HOME ===

    async getProductosHome() {
        const query = `
            SELECT
                ph.home_id,
                ph.orden,
                ph.activo,
                p.producto_id,
                p.nombre,
                p.descripcion,
                vp.variante_id,
                vp.stock,
                vp.precio,
                vp.precio_oferta,
                iv.url as imagen_principal,
                iv2.url as imagen_secundaria
            FROM productos_home ph
            JOIN productos p ON ph.producto_id = p.producto_id
            LEFT JOIN LATERAL (
                SELECT
                    v.variante_id,
                    v.stock,
                    v.precio,
                    v.precio_oferta
                FROM variantes_producto v
                WHERE v.producto_id = p.producto_id
                  AND v.activo = true
                ORDER BY
                    EXISTS (
                        SELECT 1
                        FROM imagenes_variantes i
                        WHERE i.variante_id = v.variante_id
                    ) DESC,
                    v.variante_id ASC
                LIMIT 1
            ) vp ON true
            LEFT JOIN LATERAL (
                SELECT i.url
                FROM imagenes_variantes i
                WHERE i.variante_id = vp.variante_id
                ORDER BY i.principal DESC, i.orden ASC, i.img_id ASC
                LIMIT 1
            ) iv ON true
            LEFT JOIN LATERAL (
                SELECT i.url
                FROM imagenes_variantes i
                WHERE i.variante_id = vp.variante_id
                ORDER BY i.principal DESC, i.orden ASC, i.img_id ASC
                OFFSET 1
                LIMIT 1
            ) iv2 ON true
            WHERE ph.activo = true
            ORDER BY ph.orden ASC, ph.home_id ASC, vp.variante_id ASC
        `;
        const { rows } = await pool.query(query);
        return rows;
    },

    async addProductoHome(producto_id, orden = 0) {
        const query = `
            INSERT INTO productos_home (producto_id, orden, activo)
            VALUES ($1, $2, true)
            RETURNING *
        `;
        const { rows } = await pool.query(query, [producto_id, orden]);
        return rows[0];
    },

    async getNextProductoHomeOrden() {
        const query = `
            SELECT COALESCE(MAX(orden), -1) + 1 AS next_orden
            FROM productos_home
            WHERE activo = true
        `;
        const { rows } = await pool.query(query);
        return Number(rows[0]?.next_orden ?? 0);
    },

    async normalizeProductoHomeOrden() {
        const query = `
            WITH ordered AS (
                SELECT
                    home_id,
                    ROW_NUMBER() OVER (ORDER BY orden ASC, home_id ASC) - 1 AS new_orden
                FROM productos_home
                WHERE activo = true
            )
            UPDATE productos_home ph
            SET orden = ordered.new_orden
            FROM ordered
            WHERE ph.home_id = ordered.home_id
        `;

        await pool.query(query);
    },

    async shiftProductoHomeOrdenFrom(orden, excludeHomeId = null) {
        if (excludeHomeId) {
            const query = `
                UPDATE productos_home
                SET orden = orden + 1
                WHERE activo = true
                  AND orden >= $1
                  AND home_id <> $2
            `;
            await pool.query(query, [orden, excludeHomeId]);
            return;
        }

        const query = `
            UPDATE productos_home
            SET orden = orden + 1
            WHERE activo = true
              AND orden >= $1
        `;
        await pool.query(query, [orden]);
    },

    async findProductoHomeByProductoId(producto_id) {
        const query = `
            SELECT *
            FROM productos_home
            WHERE producto_id = $1
            ORDER BY home_id DESC
            LIMIT 1
        `;
        const { rows } = await pool.query(query, [producto_id]);
        return rows[0];
    },

    async updateProductoHome(home_id, updates) {
        const sets = [];
        const values = [];
        let idx = 1;

        const columnMap = {
            orden: "orden",
            activo: "activo",
            producto_id: "producto_id"
        };

        for (const key in updates) {
            if (columnMap[key]) {
                sets.push(`${columnMap[key]} = $${idx}`);
                values.push(updates[key]);
                idx++;
            }
        }

        if (sets.length === 0) return null;

        values.push(home_id);
        const query = `
            UPDATE productos_home
            SET ${sets.join(", ")}
            WHERE home_id = $${idx}
            RETURNING *
        `;
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    async removeProductoHome(home_id) {
        const query = `
            DELETE FROM productos_home
            WHERE home_id = $1
            RETURNING *
        `;
        const { rows } = await pool.query(query, [home_id]);
        return rows[0];
    },

    // === CAROUSEL HOME ===

    async getCarouselHome() {
        const query = `
            SELECT
                ch.*,
                p.nombre as producto_nombre,
                c.nombre as categoria_nombre
            FROM carousel_home ch
            LEFT JOIN productos p ON ch.producto_id = p.producto_id
            LEFT JOIN categorias c ON ch.categoria_id = c.categoria_id
            WHERE ch.activo = true
            ORDER BY ch.orden ASC, ch.carousel_id ASC
        `;
        const { rows } = await pool.query(query);
        return rows;
    },

    async addCarouselItem(img_desktop_url, img_mobile_url, orden = 0, producto_id = null, categoria_id = null) {
        // Validar que al menos una imagen esté presente
        if (!img_desktop_url && !img_mobile_url) {
            throw new Error("Se requiere al menos una imagen (desktop o mobile)");
        }

        const query = `
            INSERT INTO carousel_home (img_desktop_url, img_mobile_url, orden, activo, producto_id, categoria_id)
            VALUES ($1, $2, $3, true, $4, $5)
            RETURNING *
        `;
        const { rows } = await pool.query(query, [img_desktop_url, img_mobile_url, orden, producto_id, categoria_id]);
        return rows[0];
    },

    async getNextCarouselOrden() {
        const query = `
            SELECT COALESCE(MAX(orden), -1) + 1 AS next_orden
            FROM carousel_home
            WHERE activo = true
        `;
        const { rows } = await pool.query(query);
        return Number(rows[0]?.next_orden ?? 0);
    },

    async normalizeCarouselOrden() {
        const query = `
            WITH ordered AS (
                SELECT
                    carousel_id,
                    ROW_NUMBER() OVER (ORDER BY orden ASC, carousel_id ASC) - 1 AS new_orden
                FROM carousel_home
                WHERE activo = true
            )
            UPDATE carousel_home ch
            SET orden = ordered.new_orden
            FROM ordered
            WHERE ch.carousel_id = ordered.carousel_id
        `;

        await pool.query(query);
    },

    async updateCarouselItem(carousel_id, updates) {
        const sets = [];
        const values = [];
        let idx = 1;

        const columnMap = {
            img_desktop_url: "img_desktop_url",
            img_mobile_url: "img_mobile_url",
            orden: "orden",
            activo: "activo",
            producto_id: "producto_id",
            categoria_id: "categoria_id"
        };

        for (const key in updates) {
            if (columnMap[key]) {
                sets.push(`${columnMap[key]} = $${idx}`);
                values.push(updates[key]);
                idx++;
            }
        }

        if (sets.length === 0) return null;

        values.push(carousel_id);
        const query = `
            UPDATE carousel_home
            SET ${sets.join(", ")}
            WHERE carousel_id = $${idx}
            RETURNING *
        `;
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    async removeCarouselItem(carousel_id) {
        const query = `
            DELETE FROM carousel_home
            WHERE carousel_id = $1
            RETURNING *
        `;
        const { rows } = await pool.query(query, [carousel_id]);
        return rows[0];
    },

    // === HELPERS ===

    async checkProductoExists(producto_id) {
        const query = 'SELECT producto_id FROM productos WHERE producto_id = $1';
        const { rows } = await pool.query(query, [producto_id]);
        return rows.length > 0;
    },

    async checkCategoriaExists(categoria_id) {
        const query = 'SELECT categoria_id FROM categorias WHERE categoria_id = $1';
        const { rows } = await pool.query(query, [categoria_id]);
        return rows.length > 0;
    }
};
