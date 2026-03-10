import { pool } from "../config/db.js";

export const imagenesRepository = {
    async create({ variante_id, url, principal = false }) {
        const query = `
            INSERT INTO imagenes_variantes (variante_id, url, principal)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [variante_id, url, principal]);
        return rows[0];
    },

    async getByVariante(variante_id) {
        const query = `
            SELECT * FROM imagenes_variantes
            WHERE variante_id = $1
            ORDER BY principal DESC, img_id ASC;
        `;
        const { rows } = await pool.query(query, [variante_id]);
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
            principal: "principal"
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

    async deleteByVariante(variante_id) {
        const query = `
            DELETE FROM imagenes_variantes
            WHERE variante_id = $1
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [variante_id]);
        return rows;
    }
};
