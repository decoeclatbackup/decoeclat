import {Router} from 'express';
const router = Router();
import {ventasController} from "../controllers/ventas.controller.js";
import { verificarToken, esAdminOStaff } from "../middlewares/auth.middlewares.js";

router.post("/ventas/web", ventasController.registrarWeb);
router.post("/ventas/manual", verificarToken, esAdminOStaff, ventasController.registrarManual);
router.get("/ventas/estados", ventasController.listarEstados);
router.get("/ventas/metodos", ventasController.listarMetodos);
router.get("/ventas", verificarToken, esAdminOStaff, ventasController.listarTodo);
router.put("/ventas/:id/estado", verificarToken, esAdminOStaff, ventasController.actualizarEstado);
router.delete("/ventas/:id", verificarToken, esAdminOStaff, ventasController.eliminar);
router.put("/ventas/confirmar/:id", verificarToken, esAdminOStaff, ventasController.confirmar);
router.put("/ventas/anular/:id", verificarToken, esAdminOStaff, ventasController.anular);

export default router;
