import { pool } from "../config/db.js";

export const reportesRepository = {
    /**
     * Reporte unificado para CSV (Detalle de ventas)
     */
    getDatosParaCSV: async (mes, anio) => {
        const query = `
            SELECT 
                v.created_at AS "Fecha",
                v.venta_id AS "Orden_Nro",
                c.nombre AS "Cliente",
                p.nombre AS "Producto",
                -- Combinamos Tela y Medida para una descripción clara en el Excel
                (t.nombre || ' - ' || s.valor) AS "Variante_Detalle",
                dv.cantidad AS "Cantidad",
                dv.precio_unitario AS "Precio_Unitario",
                (dv.cantidad * dv.precio_unitario) AS "Subtotal",
                mp.descripcion AS "Metodo_Pago", -- Corregido a 'descripcion'
                ev.descripcion AS "Estado_Venta" -- Corregido a 'descripcion'
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.venta_id
            JOIN clientes c ON v.cliente_id = c.cliente_id
            JOIN variantes_producto vp ON dv.variante_id = vp.variante_id
            JOIN productos p ON vp.producto_id = p.producto_id
            JOIN tela t ON vp.tela_id = t.tela_id
            JOIN sizes s ON vp.size_id = s.size_id
            JOIN metodos_pago mp ON v.metodo_id = mp.metodo_id
            JOIN estados_venta ev ON v.estado_id = ev.estado_id
            WHERE EXTRACT(MONTH FROM v.created_at) = $1 
              AND EXTRACT(YEAR FROM v.created_at) = $2
              AND v.estado_id = 2 -- Solo ventas confirmadas
            ORDER BY v.created_at DESC, v.venta_id DESC;
        `;
        const { rows } = await pool.query(query, [mes, anio]);
        return rows;
    },

    /**
     * Ranking de productos más vendidos
     */
    getRankingProductos: async (mes, anio) => {
        const query = `
            SELECT 
                p.nombre AS "Producto",
                SUM(dv.cantidad) AS "Total_Unidades",
                SUM(dv.cantidad * dv.precio_unitario) AS "Total_Recaudado"
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.venta_id
            JOIN variantes_producto vp ON dv.variante_id = vp.variante_id
            JOIN productos p ON vp.producto_id = p.producto_id
            WHERE EXTRACT(MONTH FROM v.created_at) = $1 
              AND EXTRACT(YEAR FROM v.created_at) = $2
              AND v.estado_id = 2
            GROUP BY p.nombre
            ORDER BY "Total_Unidades" DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query, [mes, anio]);
        return rows;
    },

    /**
     * Mejores clientes del mes
     */
    getMejoresClientes: async (mes, anio) => {
        const query = `
            SELECT 
                c.nombre AS "Cliente",
                COUNT(DISTINCT v.venta_id) AS "Cantidad_Compras",
                SUM(v.total) AS "Inversion_Total"
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.cliente_id
            WHERE EXTRACT(MONTH FROM v.created_at) = $1 
              AND EXTRACT(YEAR FROM v.created_at) = $2
              AND v.estado_id = 2
            GROUP BY c.nombre
            ORDER BY "Inversion_Total" DESC
            LIMIT 10;
        `;
        const { rows } = await pool.query(query, [mes, anio]);
        return rows;
    }
};