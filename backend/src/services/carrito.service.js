import { carritoRepository } from "../repositories/carrito.repository.js";

function toPositiveInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} debe ser un entero mayor a 0`);
  }
  return parsed;
}

function toInteger(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} es obligatorio y debe ser un entero válido`);
  }
  return parsed;
}

function normalizeItems(items = []) {
  return items.map((item) => ({
    variante_id: Number(item.variante_id),
    cantidad: Number(item.cantidad),
    precio: Number(item.precio),
    subtotal: Number(item.subtotal),
  }));
}

async function validateCliente(clienteId) {
  const cliente = await carritoRepository.findClienteById(clienteId);
  if (!cliente || cliente.activo === false) {
    throw new Error("Cliente no encontrado o inactivo");
  }
}

async function validateVariante(varianteId) {
  const variante = await carritoRepository.findVarianteById(varianteId);
  if (!variante || variante.activo === false) {
    throw new Error("Variante no encontrada o inactiva");
  }
  return variante;
}

export const carritoService = {
  async agregarProducto(data = {}) {
    try {
      const clienteId = toInteger(data.clienteId ?? data.cliente_id, "cliente_id");
      const varianteId = toInteger(data.varianteId ?? data.variante_id, "variante_id");
      const cantidad = toPositiveInteger(data.cantidad, "cantidad");

      await validateCliente(clienteId);
      const variante = await validateVariante(varianteId);

      const carrito = await carritoRepository.getOrCreateActiveCart(clienteId);
      const itemExistente = await carritoRepository.findItemByCarritoAndVariante(
        carrito.carrito_id,
        varianteId
      );

      const cantidadActual = itemExistente ? Number(itemExistente.cantidad) : 0;
      const nuevaCantidad = cantidadActual + cantidad;

      if (nuevaCantidad > Number(variante.stock)) {
        throw new Error("Stock insuficiente para la cantidad solicitada");
      }

      if (itemExistente) {
        await carritoRepository.updateItemCantidad(itemExistente.item_id, nuevaCantidad);
      } else {
        await carritoRepository.insertItem(carrito.carrito_id, varianteId, cantidad);
      }

      return this.obtenerPorCliente(clienteId, { createIfMissing: false });
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async obtenerPorCliente(clienteIdParam, options = {}) {
    try {
      const clienteId = toInteger(clienteIdParam, "cliente_id");
      await validateCliente(clienteId);

      const createIfMissing = options.createIfMissing !== false;
      let carrito = await carritoRepository.findActiveCartByCliente(clienteId);

      if (!carrito && createIfMissing) {
        carrito = await carritoRepository.createCart(clienteId);
      }

      if (!carrito) {
        return {
          carrito_id: null,
          cliente_id: clienteId,
          estado: "inexistente",
          items: [],
          total: 0,
        };
      }

      const rawItems = await carritoRepository.getItemsWithPricing(carrito.carrito_id);
      const items = normalizeItems(rawItems);
      const total = items.reduce((acc, item) => acc + item.subtotal, 0);

      return {
        carrito_id: Number(carrito.carrito_id),
        cliente_id: Number(carrito.cliente_id),
        estado: carrito.estado,
        created_at: carrito.created_at,
        items,
        total,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async actualizarCantidadItem(data = {}) {
    try {
      const clienteId = toInteger(data.clienteId ?? data.cliente_id, "cliente_id");
      const varianteId = toInteger(data.varianteId ?? data.variante_id, "variante_id");
      const cantidad = toPositiveInteger(data.cantidad, "cantidad");

      await validateCliente(clienteId);
      const carrito = await carritoRepository.findActiveCartByCliente(clienteId);
      if (!carrito) {
        throw new Error("El cliente no tiene carrito activo");
      }

      const itemExistente = await carritoRepository.findItemByCarritoAndVariante(
        carrito.carrito_id,
        varianteId
      );
      if (!itemExistente) {
        throw new Error("El producto no existe en el carrito");
      }

      const variante = await validateVariante(varianteId);
      if (cantidad > Number(variante.stock)) {
        throw new Error("Stock insuficiente para la cantidad solicitada");
      }

      await carritoRepository.updateItemCantidad(itemExistente.item_id, cantidad);

      return this.obtenerPorCliente(clienteId, { createIfMissing: false });
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async eliminarItem(data = {}) {
    try {
      const clienteId = toInteger(data.clienteId ?? data.cliente_id, "cliente_id");
      const varianteId = toInteger(data.varianteId ?? data.variante_id, "variante_id");

      await validateCliente(clienteId);
      const carrito = await carritoRepository.findActiveCartByCliente(clienteId);
      if (!carrito) {
        throw new Error("El cliente no tiene carrito activo");
      }

      const deleted = await carritoRepository.deleteItem(carrito.carrito_id, varianteId);
      if (!deleted) {
        throw new Error("El producto no existe en el carrito");
      }

      return this.obtenerPorCliente(clienteId, { createIfMissing: false });
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async vaciarCarrito(clienteIdParam) {
    try {
      const clienteId = toInteger(clienteIdParam, "cliente_id");
      await validateCliente(clienteId);

      const carrito = await carritoRepository.findActiveCartByCliente(clienteId);
      if (!carrito) {
        return {
          carrito_id: null,
          cliente_id: clienteId,
          estado: "inexistente",
          items: [],
          total: 0,
        };
      }

      await carritoRepository.clearItemsByCarrito(carrito.carrito_id);
      return this.obtenerPorCliente(clienteId, { createIfMissing: false });
    } catch (error) {
      throw new Error(error.message);
    }
  },
};