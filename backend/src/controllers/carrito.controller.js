import { carritoService } from "../services/carrito.service.js";

export const carritoController = {
  async agregar(req, res) {
    try {
      const payload = {
        clienteId: req.body?.clienteId ?? req.body?.cliente_id,
        varianteId: req.body?.varianteId ?? req.body?.variante_id,
        cantidad: req.body?.cantidad,
      };

      const carrito = await carritoService.agregarProducto(payload);
      res.status(200).json(carrito);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async obtener(req, res) {
    try {
      const clienteId =
        req.query?.clienteId ??
        req.query?.cliente_id ??
        req.body?.clienteId ??
        req.body?.cliente_id;

      const carrito = await carritoService.obtenerPorCliente(clienteId);
      res.status(200).json(carrito);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async actualizarItem(req, res) {
    try {
      const payload = {
        clienteId: req.body?.clienteId ?? req.body?.cliente_id,
        varianteId: req.body?.varianteId ?? req.body?.variante_id,
        cantidad: req.body?.cantidad,
      };

      const carrito = await carritoService.actualizarCantidadItem(payload);
      res.status(200).json(carrito);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async eliminarItem(req, res) {
    try {
      const payload = {
        clienteId:
          req.body?.clienteId ??
          req.body?.cliente_id ??
          req.query?.clienteId ??
          req.query?.cliente_id,
        varianteId:
          req.body?.varianteId ??
          req.body?.variante_id ??
          req.query?.varianteId ??
          req.query?.variante_id,
      };

      const carrito = await carritoService.eliminarItem(payload);
      res.status(200).json(carrito);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async vaciar(req, res) {
    try {
      const clienteId =
        req.body?.clienteId ??
        req.body?.cliente_id ??
        req.query?.clienteId ??
        req.query?.cliente_id;

      const carrito = await carritoService.vaciarCarrito(clienteId);
      res.status(200).json(carrito);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};