import { pool } from "../config/db.js";


export const clienteRepository = {
    async create({ nombre, telefono, email }) {
  const query = `
    INSERT INTO clientes (nombre, telefono, email)
    VALUES ($1, $2, $3)
    RETURNING *
  `

  const values = [nombre, telefono, email]

  const result = await pool.query(query, values)
  return result.rows[0]
},

    async findByEmailExact(email) {
        const query = `
        SELECT *
        FROM clientes
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
        `;
        const { rows } = await pool.query(query, [email]);
        return rows[0];
    },

    async find(filters={}){
        let query = `
        SELECT * FROM clientes WHERE activo = true
        `;
        const values = [];
        let idx = 1;

        if (filters.nombre) {
            query += ` AND nombre ILIKE $${idx}`;
            values.push(`%${filters.nombre}%`);
            idx++;
        }

        if (filters.email){
            query += ` AND email ILIKE $${idx}`;
            values.push(`%${filters.email}%`);
            idx++;
        }

        const { rows } = await pool.query(query, values);
        return rows;
    },

    async findById(id){
        const query = "SELECT * FROM clientes Where cliente_id = $1";

        const { rows } = await pool.query(query, [id]);
        return rows[0];
    },

    async update(id, fields = {}) {
    const sets = [];
    const values = [];
    let idx = 1;

    const columnMap = { // Corregido a 'p'
        name: "nombre",
        phone: "telefono",
        email: "email"
    };

    for (const key of Object.keys(fields)) {
        const col = columnMap[key] || key;
        sets.push(`${col} = $${idx}`);
        values.push(fields[key]);
        idx++;
    }

    if (sets.length === 0) {
        throw new Error("No hay campos para actualizar");
    }

    // --- EL CAMBIO ESTÁ AQUÍ ---
    // Agregamos el ID al array antes de ejecutar, para que sea el último $idx
    values.push(id);

    const query = `
        UPDATE clientes
        SET ${sets.join(", ")}, updated_at = NOW()
        WHERE cliente_id = $${idx}
        RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

async deactivate(id) {
    // 1. La consulta es directa: cambiamos el estado 'activo' a false
    const query = `
      UPDATE clientes 
      SET activo = false, updated_at = NOW() 
      WHERE cliente_id = $1 
      RETURNING *
    `;

    // 2. Ejecutamos pasando solo el ID
    const { rows } = await pool.query(query, [id]);

    // 3. Devolvemos el cliente actualizado para confirmar que se desactivó
    return rows[0];
  }

}