import { productosRepository } from "../repositories/productos.repository.js";

/**
 * Service layer contains business logic and input validation.
 * It delegates data access to the repository layer.
 */

export const productosService = {
  async registerProduct(data) {
    // Basic validation – for our existing database we expect
    // { name, categoryId, price } from the caller.  The controller
    // is responsible for mapping request fields if needed.
    const required = ["name", "categoryId", "price"];
    for (const field of required) {
      if (data[field] == null) {
        throw new Error(`${field} is required`);
      }
    }
    return productosRepository.create(data);
  },

  async getProducts(filters) {
    // filters may contain name or categoryId
    return productosRepository.find(filters);
  },

  async getProduct(id) {
    return productosRepository.findById(id);
  },

  async modifyProduct(id, updates) {
    return productosRepository.update(id, updates);
  },

  async removeProduct(id) {
    // logical deletion/inactivation
    return productosRepository.deactivate(id);
  },
};
