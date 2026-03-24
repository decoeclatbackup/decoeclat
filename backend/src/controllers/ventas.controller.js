import { ventasService } from "../services/ventas.service.js";

export const ventasController = {
    async registrarWeb(req, res) {
        try {
            const nuevaVenta= await ventasService.registrarPedidoWeb(req.body);
            res.status(201).json({message: "Pedido web registrado con exito (Pendiente de confirmacion)",
                data: nuevaVenta});
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    },

    async registrarManual(req, res) {
        try {
            const nuevaVenta = await ventasService.registrarVentaManual(req.body);
            res.status(201).json({
                message: "Venta manual registrada y stock actualizado",
                data: nuevaVenta
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    //El botón de "Confirmar" que aprieta el dueño 
    async confirmar(req, res) {
        try {
            const {id} = req.params;
            const resultado =await ventasService.confirmarPedidoPendiente(id);
            res.status(200).json({message: "Venta confirmada con exito", data: resultado});
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    },

    async anular(req, res) {
        try {
            const {id} = req.params;
            const resultado = await ventasService.anularVentaRealizada(id);
            res.status(200).json({message: "Venta anulada con exito y stock reintegrado", data: resultado});
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    },

    async actualizarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado_id } = req.body;

            const venta = await ventasService.actualizarEstado(id, estado_id);
            res.status(200).json({
                message: "Estado de venta actualizado con exito",
                data: venta,
            });
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    },

    async listarEstados(req, res) {
        try {
            const estados = await ventasService.listarEstadosVenta();
            res.status(200).json({ data: estados });
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    },

    async listarMetodos(req, res) {
        try {
            const metodos = await ventasService.listarMetodosPago();
            res.status(200).json({ data: metodos });
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    },

    async listarTodo(req, res) {
        try {
            const filters = {
                mes: req.query.mes,
                anio: req.query.anio,
            };
            const ventas = await ventasService.obtenerHistorial(filters);
            res.status(200).json({data: ventas});
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    },

    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await ventasService.eliminarVenta(id);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    },


};