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
                iv.url as imagen_principal
            FROM productos_home ph
            JOIN productos p ON ph.producto_id = p.producto_id
            LEFT JOIN variantes_producto vp ON vp.producto_id = p.producto_id AND vp.activo = true
            LEFT JOIN imagenes_variantes iv ON iv.variante_id = vp.variante_id AND iv.principal = true
            WHERE ph.activo = true
            ORDER BY ph.orden ASC, ph.home_id ASC
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
