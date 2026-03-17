import { pool } from "../config/db.js";

export const imagenesRepository = {
    async create({ variante_id, url, public_id = null, principal = false, orden = 0 }) {
        const query = `
            INSERT INTO imagenes_variantes (variante_id, url, public_id, principal, orden)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [variante_id, url, public_id, principal, orden]);
        return rows[0];
    },

    async getByProducto(producto_id) {
        const query = `
            SELECT iv.*
            FROM imagenes_variantes iv
            JOIN variantes_producto vp ON vp.variante_id = iv.variante_id
            WHERE vp.producto_id = $1
            ORDER BY iv.orden ASC, iv.principal DESC, iv.img_id ASC;
        `;
        const { rows } = await pool.query(query, [producto_id]);
        return rows;
    },

    async getById(img_id) {
        const query = `
            SELECT * FROM imagenes_variantes
            WHERE img_id = $1;
        `;
        const { rows } = await pool.query(query, [img_id]);
        return rows[0];
    },

    async update(img_id, updates) {
        const sets = [];
        const values = [];
        let idx = 1;

        const columnMap = {
            url: "url",
            public_id: "public_id",
            principal: "principal",
            orden: "orden"
        };

        for (const key in updates) {
            if (columnMap[key]) {
                sets.push(`${columnMap[key]} = $${idx}`);
                values.push(updates[key]);
                idx++;
            }
        }

        if (sets.length === 0) return null;

        values.push(img_id);
        const query = `
            UPDATE imagenes_variantes
            SET ${sets.join(", ")}
            WHERE img_id = $${idx}
            RETURNING *;
        `;
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    async delete(img_id) {
        const query = `
            DELETE FROM imagenes_variantes
            WHERE img_id = $1
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [img_id]);
        return rows[0];
    },

    async deleteByProducto(producto_id) {
        const query = `
            DELETE FROM imagenes_variantes iv
            USING variantes_producto vp
            WHERE iv.variante_id = vp.variante_id
            AND vp.producto_id = $1
            RETURNING iv.*;
        `;
        const { rows } = await pool.query(query, [producto_id]);
        return rows;
    }
};
