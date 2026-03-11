import express from "express";
import { categoriasController } from "../controllers/categorias.controller.js";

const router = express.Router();

router.get("/categorias", categoriasController.list);

export default router;
