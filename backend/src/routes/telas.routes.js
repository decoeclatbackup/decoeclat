import express from "express";
import { telasController } from "../controllers/telas.controller.js";

const router = express.Router();

router.get("/telas", telasController.list);

export default router;
