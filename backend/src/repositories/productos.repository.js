import { pool } from "../config/db.js";

/**
 * Repository layer handles direct database operations for products.
 * SQL queries are executed with parameter binding to avoid injections.
 */

export const productosRepository = {
  async create({ name, categoryId, price }) {
    const text = `
      INSERT INTO productos (nombre, categoria_id, precio)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, categoryId, price];
    const { rows } = await pool.query(text, values);
    return rows[0];
  },

  async find(filters = {}) {
    let query = `
      SELECT p.*, c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON c.categoria_id = p.categoria_id
      WHERE p.activo = true
    `;
    const values = [];
    let idx = 1;

    if (filters.name) {
      query += ` AND p.nombre ILIKE $${idx}`;
      values.push(`%${filters.name}%`);
      idx++;
    }
    if (filters.categoryId) {
      query += ` AND p.categoria_id = $${idx}`;
      values.push(filters.categoryId);
      idx++;
    }

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      "SELECT * FROM productos WHERE producto_id = $1",
      [id]
    );
    return rows[0];
  },

  async update(id, fields = {}) {
    const sets = [];
    const values = [];
    let idx = 1;

    const columnMap = {
      name: "nombre",
      price: "precio",
      categoryId: "categoria_id",
    };

    for (const key of Object.keys(fields)) {
      const col = columnMap[key] || key;
      sets.push(`${col} = $${idx}`);
      values.push(fields[key]);
      idx++;
    }
    if (sets.length === 0) return null;

    values.push(id);
    const text = `
      UPDATE productos
      SET ${sets.join(", ")}, updated_at = NOW()
      WHERE producto_id = $${idx}
      RETURNING *
    `;
    const { rows } = await pool.query(text, values);
    return rows[0];
  },

  async deactivate(id) {
    const { rows } = await pool.query(
      "UPDATE productos SET activo = false WHERE producto_id = $1 RETURNING *",
      [id]
    );
    return rows[0];
  },
};
