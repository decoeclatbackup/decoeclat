import { pool } from "../config/db.js";

export const contactoRepository = {
  async create({ nombre, email, telefono, mensaje }) {
    const query = `
      INSERT INTO consultas_contacto (nombre, email, telefono, mensaje)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [nombre, email, telefono, mensaje];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
};
