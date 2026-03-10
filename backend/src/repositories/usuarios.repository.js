import { pool } from "../config/db.js";

export const usuariosRepository = {
    create: async (userData) => {
        const { nombre, email, contrasenia, rol_id } = userData;
        const query = `
            INSERT INTO usuarios (nombre, email, contrasenia, rol_id)
            VALUES ($1, $2, $3, $4) 
            RETURNING usuario_id, nombre, email, rol_id;
        `;
        const { rows } = await pool.query(query, [nombre, email, contrasenia, rol_id]);
        return rows[0];
    },

    findByEmail: async (email) => {
        const query = 'SELECT * FROM usuarios WHERE email = $1;';
        const { rows } = await pool.query(query, [email]);
        return rows[0];
    },

    findById: async (usuario_id) => {
        const query = 'SELECT * FROM usuarios WHERE usuario_id = $1;';
        const { rows } = await pool.query(query, [usuario_id]);
        return rows[0];
    },

    list: async () => {
        const query = `
            SELECT u.usuario_id, u.nombre, u.email, r.descripcion as rol 
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.rol_id
            ORDER BY u.usuario_id ASC;
        `;
        const { rows } = await pool.query(query);
        return rows;
    },

    updatePassword: async (usuario_id, nuevaContraseniaHash) => {
        const query = `
            UPDATE usuarios 
            SET contrasenia = $1 
            WHERE usuario_id = $2;
        `;
        await pool.query(query, [nuevaContraseniaHash, usuario_id]);
        return true;
    },
};