import { productosRepository } from "../repositories/productos.repository.js";

function normalizeProductName(value) {
  const rawName = String(value ?? '').trim();
  if (!rawName) return rawName;
  return rawName.toLocaleUpperCase('es-AR');
}

/**
 * Service layer para Productos.
 * Ahora solo maneja la información general del producto.
 */

export const productosService = {
  async registerProduct(data) {
    // Validamos solo lo necesario para el "contenedor" del producto
    const required = ["name", "categoryId"];
    for (const field of required) {
      if (data[field] == null) {
        throw new Error(`${field} es obligatorio`);
      }
    }

    const payload = {
      nombre: normalizeProductName(data.name),
      categoria_id: data.categoryId,
      descripcion: data.description ?? null,
    };

    return productosRepository.create(payload);
  },

  async getProducts(filters) {
    return productosRepository.find(filters);
  },

  async getProduct(id) {
    const product = await productosRepository.findById(id);
    if (!product) throw new Error("Producto no encontrado");
    return product;
  },

  async modifyProduct(id, updates) {
    // Solo permitimos campos generales del producto
    const allowed = [
      "name",
      "nombre",
      "description",
      "descripcion",
      "categoryId",
      "categoria_id",
      "activo"
    ];
    
    const payload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates, k)) {
        payload[k] = updates[k];
      }
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
      payload.name = normalizeProductName(payload.name);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'nombre')) {
      payload.nombre = normalizeProductName(payload.nombre);
    }

    if (Object.keys(payload).length === 0) return null;
    
    return productosRepository.update(id, payload);
  },

  async removeProduct(id) {
    return productosRepository.deletePermanent(id);
  },
};