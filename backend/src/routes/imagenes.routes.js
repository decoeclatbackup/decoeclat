import express from "express";
import { imagenesController } from "../controllers/imagenes.controller.js";
import { uploadProductImage } from "../middlewares/upload.middleware.js";
import { verificarToken, esAdmin } from "../middlewares/auth.middlewares.js";
const router = express.Router();

router.post("/", verificarToken, esAdmin, uploadProductImage, imagenesController.uploadImage);

router.get("/producto/:producto_id", imagenesController.getByProducto);

router.put("/:img_id", verificarToken, esAdmin, imagenesController.updateImage);

router.put("/:img_id/principal", verificarToken, esAdmin, imagenesController.setImagemaPrincipal);

router.delete("/:img_id", verificarToken, esAdmin, imagenesController.deleteImage);

export default router;
