import express from "express";
import { imagenesController } from "../controllers/imagenes.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
const router = express.Router();

router.post("/", upload.single('url'), imagenesController.uploadImage);

router.get("/producto/:producto_id", imagenesController.getByProducto);

router.put("/:img_id", imagenesController.updateImage);

router.put("/:img_id/principal", imagenesController.setImagemaPrincipal);

router.delete("/:img_id", imagenesController.deleteImage);

export default router;
