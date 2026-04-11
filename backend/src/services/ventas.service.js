import { ventasRepository } from "../repositories/ventas.repository.js";
import { clienteRepository } from "../repositories/cliente.repository.js";

const ESTADOS = {
    PENDIENTE: "pendiente",
    CONFIRMADA: "confirmada",
    ANULADA: "anulada",
};

function normalizarItems(items = []) {
    return items
        .map((item) => ({
            variante_id: Number(item?.variante_id),
            cantidad: Number(item?.cantidad),
            es_personalizado: Boolean(item?.es_personalizado),
            producto_nombre_manual: normalizeText(item?.producto_nombre_manual),
            variante_manual: normalizeText(item?.variante_manual),
            precio_unitario: Number(item?.precio_unitario),
        }))
        .filter(
            (item) => {
                const cantidadValida = Number.isInteger(item.cantidad) && item.cantidad > 0;
                if (!cantidadValida) return false;

                if (item.es_personalizado) {
                    return (
                        item.producto_nombre_manual.length > 0 &&
                        item.variante_manual.length > 0 &&
                        Number.isFinite(item.precio_unitario) &&
                        item.precio_unitario > 0
                    );
                }

                return Number.isInteger(item.variante_id) && item.variante_id > 0;
            }
        );
}

function normalizeText(value) {
    return String(value || "").trim();
}

export const ventasService = {
    async registrarPedidoWeb(datosVenta) {
        const { cliente_id, metodo_id, items } = datosVenta;
        const estadoPendiente = await ventasRepository.findEstadoByDescripcion(ESTADOS.PENDIENTE);

        if (!estadoPendiente) {
            throw new Error("No se encontró el estado 'pendiente' en estados_venta");
        }

        if (!items || items.length === 0) {
            throw new Error("El pedido debe contener al menos un item");
        }

        if (!cliente_id) {
            throw new Error("El cliente_id es requerido");
        }

        if (!metodo_id) {
            throw new Error("El metodo_id es requerido");
        }

        const itemsNormalizados = normalizarItems(items);
        if (itemsNormalizados.length === 0) {
            throw new Error("El pedido no tiene items válidos");
        }

        const nuevaVentaData = {
            cliente_id,
            metodo_id,
            estado_id: estadoPendiente.estado_id,
        };

        return await ventasRepository.CreateVenta(nuevaVentaData, itemsNormalizados);
    },

    async registrarVentaManual(datosVenta) {
        const { cliente_id, metodo_id, items, cliente } = datosVenta;

        let clienteIdFinal = Number(cliente_id);

        if (!metodo_id) throw new Error("El metodo_id es requerido");
        if (!items || items.length === 0) throw new Error("La venta debe contener al menos un item");

        if (!Number.isInteger(clienteIdFinal) || clienteIdFinal <= 0) {
            const nombre = normalizeText(cliente?.nombre);
            const email = normalizeText(cliente?.email);
            const telefono = normalizeText(cliente?.telefono);

            if (!nombre) {
                throw new Error("Debes ingresar el nombre del cliente nuevo");
            }

            if (!email) {
                throw new Error("Debes ingresar el email del cliente nuevo");
            }

            const clienteExistentePorEmail = await clienteRepository.findByEmailExact(email);
            if (clienteExistentePorEmail) {
                const updates = {};
                if (nombre && nombre !== clienteExistentePorEmail.nombre) {
                    updates.nombre = nombre;
                }
                if (telefono && telefono !== clienteExistentePorEmail.telefono) {
                    updates.telefono = telefono;
                }

                if (Object.keys(updates).length > 0) {
                    const actualizado = await clienteRepository.update(clienteExistentePorEmail.cliente_id, updates);
                    clienteIdFinal = Number(actualizado.cliente_id);
                } else {
                    clienteIdFinal = Number(clienteExistentePorEmail.cliente_id);
                }
            } else {
                const clienteCreado = await clienteRepository.create({
                    nombre,
                    email,
                    telefono: telefono || null,
                });

                clienteIdFinal = Number(clienteCreado.cliente_id);
            }
        }

        const itemsNormalizados = normalizarItems(items);
        if (itemsNormalizados.length === 0) {
            throw new Error("La venta manual no tiene items válidos");
        }

        const ventaData = {
            cliente_id: clienteIdFinal,
            metodo_id,
        };

        return await ventasRepository.createVentaDirecta(ventaData, itemsNormalizados);
    },

    async actualizarEstado(ventaId, estadoId) {
        const idVenta = Number(ventaId);
        const idEstado = Number(estadoId);

        if (!Number.isInteger(idVenta) || idVenta <= 0) {
            throw new Error("El venta_id es requerido");
        }

        if (!Number.isInteger(idEstado) || idEstado <= 0) {
            throw new Error("El estado_id es requerido");
        }

        return await ventasRepository.actualizarEstadoVenta(idVenta, idEstado);
    },

    async confirmarPedidoPendiente(ventaId) {
        const estadoConfirmada = await ventasRepository.findEstadoByDescripcion(ESTADOS.CONFIRMADA);
        if (!estadoConfirmada) {
            throw new Error("No se encontró el estado 'confirmada' en estados_venta");
        }

        return await this.actualizarEstado(ventaId, estadoConfirmada.estado_id);
    },

    async anularVentaRealizada(ventaId) {
        const estadoAnulada = await ventasRepository.findEstadoByDescripcion(ESTADOS.ANULADA);
        if (!estadoAnulada) {
            throw new Error("No se encontró el estado 'anulada' en estados_venta");
        }

        return await this.actualizarEstado(ventaId, estadoAnulada.estado_id);
    },

    async listarEstadosVenta() {
        return await ventasRepository.getEstadosVenta();
    },

    async listarMetodosPago() {
        return await ventasRepository.getMetodosPago();
    },

    async eliminarVenta(ventaId) {
        const idVenta = Number(ventaId);
        if (!Number.isInteger(idVenta) || idVenta <= 0) {
            throw new Error("El venta_id es requerido");
        }

        return await ventasRepository.eliminarVenta(idVenta);
    },

    async obtenerHistorial(filters = {}) {
        return await ventasRepository.findAll(filters);
    },

    async obtenerDetalleVenta(id) {
        const venta = await ventasRepository.findById(id);

        if (!venta) {
            throw new Error("Venta no encontrada");
        }
        return venta;
    },
};
