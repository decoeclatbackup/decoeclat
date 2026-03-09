import { reportesService } from "../services/reportes.service.js";
export const reportesController = {
    async descargarReporteMensual (req, res) {
    try {
        // 1. Obtenemos mes y año de los query params (ej: /reportes/descargar?mes=3&anio=2026)
        const { mes, anio } = req.query;

        if (!mes || !anio) {
            return res.status(400).json({ error: "Mes y Año son requeridos" });
        }

        // 2. Llamamos al service para obtener el string CSV
        const csvData = await reportesService.generarReporteMensualCSV(mes, anio);

        // 3. CONFIGURACIÓN DE HEADERS PARA DESCARGA
        // Definimos el nombre del archivo dinámicamente
        const nombreArchivo = `Reporte_Ventas_${mes}_${anio}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader("Content-Disposition", `attachment; filename=${nombreArchivo}`);

        // 4. Enviamos el contenido del archivo
        return res.status(200).send(csvData);

    } catch (error) {
        console.error("Error en descargarReporteMensual Controller:", error);
        return res.status(500).json({ error: error.message || "Error al generar el reporte" });
    }
},

    async obtenerEstadisticasDashboard (req, res) {
    try {
        const { mes, anio } = req.query;

        if (!mes || !anio) {
            return res.status(400).json({ error: "Mes y Año son requeridos para las estadísticas" });
        }

        const estadisticas = await reportesService.obtenerEstadisticasMensuales(mes, anio);
        
        return res.status(200).json(estadisticas);

    } catch (error) {
        console.error("Error en obtenerEstadisticasDashboard Controller:", error);
        return res.status(500).json({ error: "Error al obtener datos del dashboard" });
    }
},
};
