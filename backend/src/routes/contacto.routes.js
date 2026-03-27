import express from "express";
import { contactoController } from "../controllers/contacto.controller.js";

const router = express.Router();

router.post("/contacto", contactoController.create);

export default router;
