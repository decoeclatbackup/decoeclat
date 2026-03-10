import express from "express";
import { homeController } from "../controllers/home.controller.js";
import { verificarToken, esAdmin } from "../middlewares/auth.middlewares.js";
import { uploadBanners } from "../middlewares/banners.middleware.js";

const router = express.Router();

// === RUTAS PÚBLICAS ===
router.get("/", homeController.getHomeData);

// === PRODUCTOS HOME (Requiere Admin) ===
router.post("/productos", verificarToken, esAdmin, homeController.addProductoHome);
router.put("/productos/:home_id", verificarToken, esAdmin, homeController.updateProductoHome);
router.delete("/productos/:home_id", verificarToken, esAdmin, homeController.removeProductoHome);

// === CAROUSEL HOME (Requiere Admin) ===
router.get("/carousel", homeController.getCarouselHome);
router.post("/carousel", verificarToken, esAdmin, uploadBanners, homeController.addCarouselItem);
router.put("/carousel/:carousel_id", verificarToken, esAdmin, uploadBanners, homeController.updateCarouselItem);
router.delete("/carousel/:carousel_id", verificarToken, esAdmin, homeController.removeCarouselItem);

export default router;
