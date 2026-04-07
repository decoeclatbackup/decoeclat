import { pool } from "../config/db.js";

/**
 * Capa de Repositorio para Productos (Decoeclat).
 * Ahora la información de precios y stock se maneja en Variantes.
 */

export const productosRepository = {
  normalizeListFilter(value) {
    if (Array.isArray(value)) {
      return value.map((item) => Number(item)).filter((item) => Number.isFinite(item))
    }

    if (typeof value === 'string' && value.includes(',')) {
      return value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item))
    }

    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? [numericValue] : []
  },

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
      SELECT p.*, c.nombre AS categoria, img.imagen_principal, img.imagen_secundaria
      FROM productos p
      LEFT JOIN categorias c ON c.categoria_id = p.categoria_id
      LEFT JOIN LATERAL (
        SELECT
          (ARRAY_AGG(iv.url ORDER BY iv.principal DESC, iv.orden ASC, iv.img_id ASC))[1] AS imagen_principal,
          (ARRAY_AGG(iv.url ORDER BY iv.principal DESC, iv.orden ASC, iv.img_id ASC))[2] AS imagen_secundaria
        FROM variantes_producto vp
        JOIN imagenes_variantes iv ON iv.variante_id = vp.variante_id
        WHERE vp.producto_id = p.producto_id
          AND vp.activo = true
      ) img ON true
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
    
    // Filtro por categoría (puede ser un ID único, un array de IDs, o una cadena separada por comas)
    if (filters.categoryId || filters.categoria_id) {
      let categoryValue = filters.categoryId || filters.categoria_id;
      
      // Si es una cadena con comas, convertir a array de números
      if (typeof categoryValue === 'string' && categoryValue.includes(',')) {
        categoryValue = categoryValue.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
      }
      
      // Si es un array con elementos
      if (Array.isArray(categoryValue) && categoryValue.length > 0) {
        query += ` AND p.categoria_id = ANY($${idx}::int[])`;
        values.push(categoryValue);
      } else if (!Array.isArray(categoryValue) && categoryValue) {
        // Si es un número simple
        query += ` AND p.categoria_id = $${idx}`;
        values.push(Number(categoryValue));
      }
      idx++;
    }

    const variantConditions = [`v.producto_id = p.producto_id`, `v.activo = true`];

    if (filters.telaId || filters.tela_id) {
      const telaIds = this.normalizeListFilter(filters.telaId || filters.tela_id);
      if (telaIds.length > 0) {
        variantConditions.push(`v.tela_id = ANY($${idx}::int[])`);
        values.push(telaIds);
        idx++;
      }
    }

    if (filters.sizeId || filters.size_id) {
      const sizeIds = this.normalizeListFilter(filters.sizeId || filters.size_id);
      if (sizeIds.length > 0) {
        variantConditions.push(`v.size_id = ANY($${idx}::int[])`);
        values.push(sizeIds);
        idx++;
      }
    }

    if (filters.sizeTypeId || filters.size_type_id || filters.type_id) {
      variantConditions.push(`s.type_id = $${idx}`);
      values.push(filters.sizeTypeId || filters.size_type_id || filters.type_id);
      idx++;
    }

    if (variantConditions.length > 2) {
      query += `
        AND EXISTS (
          SELECT 1
          FROM variantes_producto v
          JOIN sizes s ON s.size_id = v.size_id
          WHERE ${variantConditions.join(" AND ")}
        )
      `;
    }

    const { rows } = await pool.query(query, values);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT p.*, c.nombre AS categoria, img.imagen_principal, img.imagen_secundaria
      FROM productos p
      LEFT JOIN categorias c ON c.categoria_id = p.categoria_id
      LEFT JOIN LATERAL (
        SELECT
          (ARRAY_AGG(iv.url ORDER BY iv.principal DESC, iv.orden ASC, iv.img_id ASC))[1] AS imagen_principal,
          (ARRAY_AGG(iv.url ORDER BY iv.principal DESC, iv.orden ASC, iv.img_id ASC))[2] AS imagen_secundaria
        FROM variantes_producto vp
        JOIN imagenes_variantes iv ON iv.variante_id = vp.variante_id
        WHERE vp.producto_id = p.producto_id
          AND vp.activo = true
      ) img ON true
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
      await client.query(
        `UPDATE variantes_producto
         SET activo = false
         WHERE producto_id = $1`,
        [id]
      );
      await client.query(
        `UPDATE productos_home
         SET activo = false
         WHERE producto_id = $1`,
        [id]
      );
      await client.query(
        `UPDATE carousel_home
         SET activo = false
         WHERE producto_id = $1`,
        [id]
      );

      const { rows } = await client.query(
        `UPDATE productos
         SET activo = false
         WHERE producto_id = $1
         RETURNING *`,
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