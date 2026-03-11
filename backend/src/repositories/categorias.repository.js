import { pool } from "../config/db.js";

export const categoriasRepository = {
  async findAll() {
    const query = `
      SELECT DISTINCT ON (nombre, parent_id) categoria_id, nombre, parent_id
      FROM categorias
      ORDER BY
        nombre,
        parent_id NULLS FIRST,
        categoria_id ASC
    `;

    const { rows } = await pool.query(query);
    return rows;
  },
};
