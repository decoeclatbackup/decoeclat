import { productosService } from "../services/productos.service.js";

/**
 * Controller para Productos (Decoeclat).
 * Traduce las peticiones HTTP a llamadas del Service.
 */

export const productosController = {
  async create(req, res) {
    try {
      // Ahora solo esperamos nombre, categoria y opcionalmente descripción
      const body = req.body || {};
      
      const payload = {
        name: body.name || body.nombre, // Aceptamos ambos para evitar errores
        categoryId: body.categoryId || body.categoria_id,
        description: body.description || body.descripcion,
      };

      const product = await productosService.registerProduct(payload);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async list(req, res) {
    try {
      const filters = {
        name: req.query.name || req.query.nombre,
        categoryId: req.query.categoryId || req.query.categoria_id,
        sizeId: req.query.sizeId || req.query.size_id,
        sizeTypeId: req.query.sizeTypeId || req.query.size_type_id || req.query.type_id,
        telaId: req.query.telaId || req.query.tela_id,
        color: req.query.color,
      };
      const products = await productosService.getProducts(filters);
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async get(req, res) {
    try {
      const prod = await productosService.getProduct(req.params.id);
      if (!prod) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json(prod);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      
      const updates = {};

      // Solo mapeamos campos generales del producto
      if (body.name !== undefined) updates.name = body.name;
      if (body.nombre !== undefined) updates.name = body.nombre;
      if (body.description !== undefined) updates.description = body.description;
      if (body.descripcion !== undefined) updates.description = body.descripcion;
      if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
      if (body.categoria_id !== undefined) updates.categoryId = body.categoria_id;
      if (body.activo !== undefined) updates.activo = Boolean(body.activo);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ 
          error: "No se enviaron campos válidos para actualizar (nombre, descripcion, categoria_id, activo)." 
        });
      }

      const updated = await productosService.modifyProduct(id, updates);
      
      if (!updated) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const removed = await productosService.removeProduct(req.params.id);
      if (!removed) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      // 204 No Content para éxito en eliminación
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};