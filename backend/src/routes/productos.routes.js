import express from "express";
import { productosController } from "../controllers/productos.controller.js";
import { verificarToken, esAdmin } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// Product catalog endpoints
router.post("/products", verificarToken, esAdmin, productosController.create);
router.get("/products", productosController.list);
router.get("/products/:id", productosController.get);
router.put("/products/:id", verificarToken, esAdmin, productosController.update);
router.delete("/products/:id", verificarToken, esAdmin, productosController.remove);

export default router;
