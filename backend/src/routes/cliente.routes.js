import express from "express";
import {clienteController} from "../controllers/cliente.controller.js";

const router = express.Router();

// Endpoints para clientes
router.post("/clientes", clienteController.create);
router.post("/clientes/temporal", clienteController.crearclienteTemporal);
router.put("/clientes/temporal/:id", clienteController.completarClienteTemporal);
router.get("/clientes", clienteController.list);
router.get("/clientes/:id", clienteController.get);
router.put("/clientes/:id", clienteController.update);
router.delete("/clientes/:id", clienteController.remove);

export default router;