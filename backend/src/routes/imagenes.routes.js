import express from "express";
import { imagenesController } from "../controllers/imagenes.controller.js";
import { verificarToken, esAdmin } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/upload.middleware.js";
const router = express.Router();

// Subir imagen a una variante (requiere admin)
router.post("/", verificarToken, esAdmin, upload.single('url'), imagenesController.uploadImage);

// Obtener todas las imágenes de una variante
router.get("/variante/:variante_id", imagenesController.getByVariante);

// Actualizar imagen (requiere admin)
router.put("/:img_id", verificarToken, esAdmin, imagenesController.updateImage);

// Establecer imagen como principal (requiere admin)
router.put("/:img_id/principal", verificarToken, esAdmin, imagenesController.setImagemaPrincipal);

// Eliminar imagen (requiere admin)
router.delete("/:img_id", verificarToken, esAdmin, imagenesController.deleteImage);

export default router;
