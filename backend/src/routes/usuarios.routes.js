import express from "express";
import { usuariosController } from "../controllers/usuarios.controller.js";
import { verificarToken, esAdmin } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// --- RUTAS PÚBLICAS ---
// Estas no llevan middleware porque el usuario aún no entró al sistema
router.post("/login", usuariosController.login);
router.post("/forgot-password", usuariosController.requestPasswordReset);
router.post("/reset-password", usuariosController.resetPassword);

// --- RUTAS PRIVADAS (Requieren Token) ---
// El usuario debe estar logueado para cambiar su propia contraseña
router.put("/change-password", verificarToken, usuariosController.updatePassword);

// --- RUTAS ADMINISTRATIVAS (Requieren Token y ser Admin) ---
// Solo el dueño puede registrar empleados o ver la lista de staff
router.get("/staff", verificarToken, esAdmin, usuariosController.getStaff);
router.post("/register", verificarToken, esAdmin, usuariosController.register);

export default router;