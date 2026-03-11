import { pool } from "../config/db.js";

export const sizesRepository = {
  async findAll() {
    const query = `
      SELECT s.size_id, s.valor, s.type_id, st.nombre AS type_nombre
      FROM sizes s
      JOIN size_types st ON st.type_id = s.type_id
      ORDER BY st.nombre ASC, s.valor ASC
    `;

    const { rows } = await pool.query(query);
    return rows;
  },
};
