import express from "express";
import { productosController } from "../controllers/productos.controller.js";

const router = express.Router();

// Product catalog endpoints
router.post("/products", productosController.create);
router.get("/products", productosController.list);
router.get("/products/:id", productosController.get);
router.put("/products/:id", productosController.update);
router.delete("/products/:id", productosController.remove);

export default router;
