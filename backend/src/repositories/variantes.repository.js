import { pool } from "../config/db.js";
    
export const variantesRepository = {
    async create({ productoId, telaId, sizeId, color, relleno, stock, precio, precio_oferta, en_oferta }) {
        const text = `
            INSERT INTO variantes_producto (producto_id, tela_id, size_id, color, relleno, stock, precio, precio_oferta, en_oferta)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const values = [productoId, telaId, sizeId, color || null, Boolean(relleno), stock||0 , precio, precio_oferta||null, en_oferta||false];
        const { rows } = await pool.query(text, values);
        return rows[0];
    },

    async findByProducto(productoId) {
        let query = `
        SELECT v.*, t.nombre AS tela, s.valor AS Size, p.nombre AS producto_nombre
        FROM variantes_producto v
        JOIN tela t ON v.tela_id = t.tela_id
        JOIN sizes s ON v.size_id = s.size_id
        JOIN productos p ON p.producto_id = v.producto_id
        WHERE v.activo = true
        `;
        const values = [];
        if (productoId) {
            query += ` AND v.producto_id = $1`;
            values.push(productoId);
        }
        query += ` ORDER BY s.valor ASC, v.relleno ASC, COALESCE(v.color, '') ASC, v.variante_id ASC`;
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
            telaId: "tela_id",
            tela_id: "tela_id",
            sizeId: "size_id",
            size_id: "size_id",
            relleno: "relleno",
            color: "color",
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
            SET activo = false
            WHERE variante_id = $1
            RETURNING *
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }





}