import { pool } from "../config/db.js";

export const imagenesRepository = {
    async create({ producto_id, url, principal = false, orden = 0 }) {
        const query = `
            INSERT INTO imagenes_productos (producto_id, url, principal, orden)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [producto_id, url, principal, orden]);
        return rows[0];
    },

    async getByProducto(producto_id) {
        const query = `
            SELECT * FROM imagenes_productos
            WHERE producto_id = $1
            ORDER BY orden ASC, principal DESC, img_id ASC;
        `;
        const { rows } = await pool.query(query, [producto_id]);
        return rows;
    },

    async getById(img_id) {
        const query = `
            SELECT * FROM imagenes_productos
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
            UPDATE imagenes_productos
            SET ${sets.join(", ")}
            WHERE img_id = $${idx}
            RETURNING *;
        `;
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    async delete(img_id) {
        const query = `
            DELETE FROM imagenes_productos
            WHERE img_id = $1
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [img_id]);
        return rows[0];
    },

    async deleteByProducto(producto_id) {
        const query = `
            DELETE FROM imagenes_productos
            WHERE producto_id = $1
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [producto_id]);
        return rows;
    }
};
