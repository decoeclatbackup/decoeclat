import { pool } from "../config/db.js";

/**
 * Capa de Repositorio para Productos (Decoeclat).
 * Ahora la información de precios y stock se maneja en Variantes.
 */

export const productosRepository = {
  async create({ nombre, descripcion, categoria_id }) {
    const text = `
      INSERT INTO productos (nombre, descripcion, categoria_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [
      nombre,
      descripcion ?? null,
      categoria_id,
    ];
    const { rows } = await pool.query(text, values);
    return rows[0];
  },

  async find(filters = {}) {
    let query = `
      SELECT p.*, c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON c.categoria_id = p.categoria_id
      WHERE 1 = 1
    `;
    const values = [];
    let idx = 1;

    // Filtro por nombre
    if (filters.name || filters.nombre) {
      query += ` AND p.nombre ILIKE $${idx}`;
      values.push(`%${filters.name || filters.nombre}%`);
      idx++;
    }
    
    // Filtro por categoría
    if (filters.categoryId || filters.categoria_id) {
      query += ` AND p.categoria_id = $${idx}`;
      values.push(filters.categoryId || filters.categoria_id);
      idx++;
    }

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT p.*, c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON c.categoria_id = p.categoria_id
      WHERE p.producto_id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  async update(id, fields = {}) {
    const sets = [];
    const values = [];
    let idx = 1;

    // Mapeo de campos permitidos para la tabla productos
    const columnMap = {
      name: "nombre",
      nombre: "nombre",
      description: "descripcion",
      descripcion: "descripcion",
      categoryId: "categoria_id",
      categoria_id: "categoria_id",
      activo: "activo"
    };

    for (const key of Object.keys(fields)) {
      if (columnMap[key]) {
        const col = columnMap[key];
        sets.push(`${col} = $${idx}`);
        values.push(fields[key]);
        idx++;
      }
    }

    if (sets.length === 0) return null;

    values.push(id); // El ID será el último parámetro
    const text = `
      UPDATE productos
      SET ${sets.join(", ")}
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

  async deletePermanent(id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM variantes_producto WHERE producto_id = $1", [id]);
      await client.query("DELETE FROM productos_home WHERE producto_id = $1", [id]);
      await client.query("DELETE FROM carousel_home WHERE producto_id = $1", [id]);

      const { rows } = await client.query(
        "DELETE FROM productos WHERE producto_id = $1 RETURNING *",
        [id]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};