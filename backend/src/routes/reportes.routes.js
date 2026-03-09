import express from "express";
import { reportesController } from "../controllers/reportes.controller.js";

const router = express.Router();

/**
 * Endpoint para descargar el archivo CSV
 * Uso: GET /api/reportes/descargar?mes=3&anio=2026
 */
router.get("/reportes/descargar", reportesController.descargarReporteMensual);

/**
 * Endpoint para obtener estadísticas visuales (Top productos y clientes)
 * Uso: GET /api/reportes/dashboard?mes=3&anio=2026
 */
router.get("/reportes/dashboard", reportesController.obtenerEstadisticasDashboard);

export default router;