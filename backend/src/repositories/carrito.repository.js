import { pool } from "../config/db.js";

export const carritoRepository = {
  async findClienteById(clienteId) {
    const query = `
      SELECT cliente_id, activo
      FROM clientes
      WHERE cliente_id = $1
    `;
    const { rows } = await pool.query(query, [clienteId]);
    return rows[0];
  },

  async findVarianteById(varianteId) {
    const query = `
      SELECT variante_id, stock, precio, precio_oferta, en_oferta, activo
      FROM variantes_producto
      WHERE variante_id = $1
    `;
    const { rows } = await pool.query(query, [varianteId]);
    return rows[0];
  },

  async findActiveCartByCliente(clienteId) {
    const query = `
      SELECT carrito_id, cliente_id, estado, created_at
      FROM carrito
      WHERE cliente_id = $1 AND estado = 'activo'
      ORDER BY created_at DESC, carrito_id DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [clienteId]);
    return rows[0];
  },

  async createCart(clienteId) {
    const query = `
      INSERT INTO carrito (cliente_id, estado)
      VALUES ($1, 'activo')
      RETURNING carrito_id, cliente_id, estado, created_at
    `;
    const { rows } = await pool.query(query, [clienteId]);
    return rows[0];
  },

  async getOrCreateActiveCart(clienteId) {
    const carrito = await this.findActiveCartByCliente(clienteId);
    if (carrito) return carrito;
    return this.createCart(clienteId);
  },

  async findItemByCarritoAndVariante(carritoId, varianteId) {
    const query = `
      SELECT item_id, carrito_id, variante_id, cantidad
      FROM carrito_items
      WHERE carrito_id = $1 AND variante_id = $2
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [carritoId, varianteId]);
    return rows[0];
  },

  async insertItem(carritoId, varianteId, cantidad) {
    const query = `
      INSERT INTO carrito_items (carrito_id, variante_id, cantidad)
      VALUES ($1, $2, $3)
      RETURNING item_id, carrito_id, variante_id, cantidad
    `;
    const { rows } = await pool.query(query, [carritoId, varianteId, cantidad]);
    return rows[0];
  },

  async updateItemCantidad(itemId, cantidad) {
    const query = `
      UPDATE carrito_items
      SET cantidad = $1
      WHERE item_id = $2
      RETURNING item_id, carrito_id, variante_id, cantidad
    `;
    const { rows } = await pool.query(query, [cantidad, itemId]);
    return rows[0];
  },

  async deleteItem(carritoId, varianteId) {
    const query = `
      DELETE FROM carrito_items
      WHERE carrito_id = $1 AND variante_id = $2
      RETURNING item_id
    `;
    const result = await pool.query(query, [carritoId, varianteId]);
    return result.rowCount > 0;
  },

  async clearItemsByCarrito(carritoId) {
    const query = `
      DELETE FROM carrito_items
      WHERE carrito_id = $1
    `;
    const result = await pool.query(query, [carritoId]);
    return result.rowCount;
  },

  async getItemsWithPricing(carritoId) {
    const query = `
      SELECT
        ci.item_id,
        ci.variante_id,
        vp.producto_id,
        p.nombre AS producto_nombre,
        vp.size_id,
        vp.color,
        vp.relleno,
        s.valor AS size_valor,
        t.nombre AS tela_nombre,
        COALESCE(img_var.url, img_prod.url) AS imagen_url,
        ci.cantidad,
        CASE
          WHEN vp.en_oferta = true AND vp.precio_oferta IS NOT NULL THEN vp.precio_oferta
          ELSE vp.precio
        END AS precio,
        (
          ci.cantidad *
          CASE
            WHEN vp.en_oferta = true AND vp.precio_oferta IS NOT NULL THEN vp.precio_oferta
            ELSE vp.precio
          END
        ) AS subtotal
      FROM carrito_items ci
      JOIN variantes_producto vp ON vp.variante_id = ci.variante_id
      JOIN productos p ON p.producto_id = vp.producto_id
      LEFT JOIN sizes s ON s.size_id = vp.size_id
      LEFT JOIN tela t ON t.tela_id = vp.tela_id
      LEFT JOIN LATERAL (
        SELECT iv.url
        FROM imagenes_variantes iv
        WHERE iv.variante_id = ci.variante_id
        ORDER BY iv.principal DESC, iv.orden ASC, iv.img_id ASC
        LIMIT 1
      ) img_var ON true
      LEFT JOIN LATERAL (
        SELECT iv2.url
        FROM imagenes_variantes iv2
        JOIN variantes_producto vp2 ON vp2.variante_id = iv2.variante_id
        WHERE vp2.producto_id = vp.producto_id
        ORDER BY iv2.principal DESC, iv2.orden ASC, iv2.img_id ASC
        LIMIT 1
      ) img_prod ON true
      WHERE ci.carrito_id = $1
      ORDER BY ci.item_id ASC
    `;
    const { rows } = await pool.query(query, [carritoId]);
    return rows;
  },
};