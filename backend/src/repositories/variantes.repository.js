import { pool } from "../config/db.js";
    
export const variantesRepository = {
    async create({ productoId, telaId, sizeId, stock, precio, precio_oferta, en_oferta }) {
        const text = `
            INSERT INTO variantes_producto (producto_id, tela_id, size_id, stock, precio, precio_oferta, en_oferta)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [productoId, telaId, sizeId, stock||0 , precio, precio_oferta||null, en_oferta||false];
        const { rows } = await pool.query(text, values);
        return rows[0];
    },

    async findByProducto(productoId) {
        let query = `
        SELECT v.*, t.nombre AS tela, s.valor AS Size
        FROM variantes_producto v
        JOIN tela t ON v.tela_id = t.tela_id
        JOIN sizes s ON v.size_id = s.size_id
        WHERE v.activo = true
        `;
        const values = [];
        if (productoId) {
            query += ` AND v.producto_id = $1`;
            values.push(productoId);
        }
        const { rows } = await pool.query(query, values);
        return rows;
    },

    async FindById(id) {
        const query = `
        SELECT v.*, t.nombre AS tela, s.valor AS Size
        FROM variantes_producto v
        JOIN tela t ON v.tela_id = t.tela_id
        JOIN sizes s ON v.size_id = s.size_id
        WHERE v.variante_id = $1
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];

    },

    async update (id, fields={}) {
        const sets =[];
        const values = [];
        let idx = 1;

        const columnMap = {
            stock: "stock",
            precio: "precio",
            precioOferta: "precio_oferta",
            precio_oferta: "precio_oferta",
            enOferta: "en_oferta",
            en_oferta: "en_oferta",
            activo: "activo"
        }
        for (const key in fields) {
            if (columnMap[key]) {
                sets.push(`${columnMap[key]} = $${idx}`);
                values.push(fields[key]);
                idx++;
            }
        }

        if (sets.length === 0) return null;

        values.push(id);
        const query = `
            UPDATE variantes_producto
            SET ${sets.join(", ")}
            WHERE variante_id = $${idx}
            RETURNING *
        `;
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    async delete(id) {
        const query = `
            UPDATE variantes_producto
            SET activo=false
            WHERE variante_id = $1
            RETURNING *
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }





}