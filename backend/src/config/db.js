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

pool.query("SELECT 1")
  .then(async () => {
    console.log("✅ Conectado a PostgreSQL");
    await ensureImageSchema();
  })
  .catch((err) => {
    console.error("❌ Error de conexión a la base de datos");
    console.error(err);
  });