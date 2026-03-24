import {Router} from 'express';
const router = Router();
import {ventasController} from "../controllers/ventas.controller.js";

router.post("/ventas/web", ventasController.registrarWeb);
router.post("/ventas/manual", ventasController.registrarManual);
router.get("/ventas/estados", ventasController.listarEstados);
router.get("/ventas/metodos", ventasController.listarMetodos);
router.get("/ventas", ventasController.listarTodo);
router.put("/ventas/:id/estado", ventasController.actualizarEstado);
router.delete("/ventas/:id", ventasController.eliminar);
router.put("/ventas/confirmar/:id", ventasController.confirmar);
router.put("/ventas/anular/:id", ventasController.anular);

export default router;
