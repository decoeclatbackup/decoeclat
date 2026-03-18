import express from "express";
import { carritoController } from "../controllers/carrito.controller.js";

const router = express.Router();

router.post("/carrito/agregar", carritoController.agregar);
router.get("/carrito", carritoController.obtener);
router.put("/carrito/item", carritoController.actualizarItem);
router.delete("/carrito/item", carritoController.eliminarItem);
router.delete("/carrito/vaciar", carritoController.vaciar);

export default router;