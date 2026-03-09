import { reportesRepository } from "../repositories/reportes.repository.js";
import { Parser } from "json2csv";

export const reportesService ={
    async generarReporteMensualCSV (mes, anio) {
    // 1. Obtenemos los datos crudos del Repository
    const datos = await reportesRepository.getDatosParaCSV(mes, anio);

    if (!datos || datos.length === 0) {
        throw new Error(`No se encontraron ventas confirmadas para el periodo ${mes}/${anio}`);
    }

    try {
        // 2. Definimos las columnas exactas que queremos en el Excel
        // Estas deben coincidir con los alias ("Nombres") que pusimos en el SQL
        const fields = [
            'Fecha', 
            'Orden_Nro', 
            'Cliente', 
            'Producto', 
            'Variante_Detalle', 
            'Cantidad', 
            'Precio_Unitario', 
            'Subtotal', 
            'Metodo_Pago', 
            'Estado_Venta'
        ];

        const json2csvParser = new Parser({ fields });
        
        // 3. Transformamos el array de objetos en un string CSV
        const csv = json2csvParser.parse(datos);
        
        return csv;
    } catch (error) {
        console.error("Error en el parseo de CSV:", error);
        throw new Error("Error técnico al generar el archivo de reporte");
    }
},

    async obtenerEstadisticasMensuales (mes, anio) {
    // Usamos Promise.all para ejecutar ambas consultas en paralelo y ganar velocidad
    const [ranking, clientes] = await Promise.all([
        reportesRepository.getRankingProductos(mes, anio),
        reportesRepository.getMejoresClientes(mes, anio)
    ]);

    return {
        mes,
        anio,
        topProductos: ranking,
        mejoresClientes: clientes
    };
},

};