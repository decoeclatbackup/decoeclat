import { pool } from "../config/db.js";

export const telasRepository = {
  async findAll() {
    const query = `
      SELECT DISTINCT ON (LOWER(TRIM(regexp_replace(nombre, ',+$', ''))))
        tela_id,
        TRIM(regexp_replace(nombre, ',+$', '')) AS nombre
      FROM tela
      WHERE COALESCE(TRIM(nombre), '') <> ''
      ORDER BY
        LOWER(TRIM(regexp_replace(nombre, ',+$', ''))) ASC,
        tela_id ASC
    `;

    const { rows } = await pool.query(query);
    return rows;
  },
};
