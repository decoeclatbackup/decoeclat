import express from "express";
import { sizesController } from "../controllers/sizes.controller.js";

const router = express.Router();

router.get("/sizes", sizesController.list);

export default router;
