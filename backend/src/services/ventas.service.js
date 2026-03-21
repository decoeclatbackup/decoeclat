import { ventasRepository } from "../repositories/ventas.repository.js";

export const ventasService = {
    async registrarPedidoWeb(datosVenta) {

        const { cliente_id, metodo_id,items } = datosVenta;
        const ESTADO_PENDIENTE_ID = 1;

        if (!items|| items.length === 0) {
            throw new Error("El pedido debe contener al menos un item");
        }

        if (!cliente_id) {
            throw new Error("El cliente_id es requerido");
        }

        if (!metodo_id) {
            throw new Error("El metodo_id es requerido");
        }

        const nuevaVentaData= {
            cliente_id,
            metodo_id,
            estado_id: ESTADO_PENDIENTE_ID,
        };

        return await ventasRepository.CreateVenta(nuevaVentaData, items);
    },

    async registrarVentaManual(datosVenta) {
        const { cliente_id, metodo_id, items } = datosVenta;

        if (!cliente_id) throw new Error("El cliente_id es requerido");
        if (!metodo_id) throw new Error("El metodo_id es requerido");
        if (!items || items.length === 0) throw new Error("La venta debe contener al menos un item");

        const ventaData ={
            cliente_id,
            metodo_id,
            estado_id: 2 // Directamente confirmada para ventas manuales
        }

        return await ventasRepository.createVentaDirecta(ventaData, items);
    },

 async confirmarPedidoPendiente(ventaId) {
    if (!ventaId) throw new Error("El venta_id es requerido");

    const venta = await ventasRepository.findById(ventaId);

    // DEBUG: Vamos a ver qué trae de la base de datos
    console.log("Datos de la venta encontrada:", venta);

    if (!venta) {
        throw new Error("Venta no encontrada");
    }

    // Usamos Number() por las dudas de que la DB devuelva un string
    if (Number(venta.estado_id) !== 1) {
        throw new Error(`La venta está en estado ${venta.estado_id}, no en 1 (pendiente)`);
    }

    // CORRECCIÓN AQUÍ: Usar 'ventaId', no 'venta_id'
    return await ventasRepository.confirmarVenta(ventaId); 
},

    async anularVentaRealizada(ventaId) {

        const venta = await ventasRepository.findById(ventaId);

        if (!venta) {throw new Error("Venta no encontrada");}

        if (venta.estado_id !== 2) {
            throw new Error("Solo las ventas confirmadas pueden ser anuladas");
        }

        return await ventasRepository.anularVenta(ventaId);
    },

    async obtenerHistorial(){
        return await ventasRepository.findAll();
    },

    async obtenerDetalleVenta(id) {
        const venta=await ventasRepository.findById(id);

        if (!venta) {
            throw new Error("Venta no encontrada");
        }
        return venta;
    },










}