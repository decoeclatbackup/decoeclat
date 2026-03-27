import { Pool } from "pg";
import { envs } from "./env.js";

export const pool = new Pool({
  connectionString: envs.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Se aplica al iniciar la sesión, sin ejecutar queries manuales en el hook connect.
  options: "-c client_encoding=UTF8",
});

async function ensureImageSchema() {
  await pool.query(`
    ALTER TABLE IF EXISTS imagenes_variantes
    ADD COLUMN IF NOT EXISTS orden integer DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE IF EXISTS imagenes_variantes
    ADD COLUMN IF NOT EXISTS public_id text
  `);
}

async function ensureContactSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultas_contacto (
      consulta_contacto_id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      telefono VARCHAR(40) NOT NULL,
      mensaje TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureDefaultCategories() {
  await pool.query(`
    INSERT INTO categorias (nombre, parent_id)
    SELECT 'Combos', NULL
    WHERE NOT EXISTS (
      SELECT 1
      FROM categorias
      WHERE LOWER(nombre) = LOWER('Combos')
        AND parent_id IS NULL
    )
  `);
}

pool.query("SELECT 1")
  .then(async () => {
    console.log("✅ Conectado a PostgreSQL");
    await ensureImageSchema();
    await ensureContactSchema();
    await ensureDefaultCategories();
  })
  .catch((err) => {
    console.error("❌ Error de conexión a la base de datos");
    console.error(err);
  });