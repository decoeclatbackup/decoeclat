import { Pool } from "pg";
import { envs } from "./env.js";

export const pool = new Pool({
  connectionString: envs.DATABASE_URL,
  // Se aplica al iniciar la sesión, sin ejecutar queries manuales en el hook connect.
  options: "-c client_encoding=UTF8",
});

async function ensureImageSchema() {
  await pool.query(`
    ALTER TABLE IF EXISTS imagenes_productos
    ADD COLUMN IF NOT EXISTS orden integer DEFAULT 0
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