import { productosService } from "../services/productos.service.js";

/**
 * Controller handlers translate HTTP-level details to service calls and
 * format the responses.
 */

export const productosController = {
  async create(req, res) {
    try {
      // expect { name, categoryId, price } and optionally size/color later
      const product = await productosService.registerProduct(req.body);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async list(req, res) {
    const filters = {
      name: req.query.name,
      categoryId: req.query.categoryId,
    };
    const products = await productosService.getProducts(filters);
    res.json(products);
  },

  async get(req, res) {
    const prod = await productosService.getProduct(req.params.id);
    if (!prod) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(prod);
  },

  async update(req, res) {
    try {
      const updated = await productosService.modifyProduct(
        req.params.id,
        req.body
      );
      if (!updated) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    const removed = await productosService.removeProduct(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "Product not found" });
    }
    // 204 No Content when successful
    res.status(204).send();
  },
};
