import { Pool } from "pg";
import { envs } from "./env.js";

export const pool = new Pool({
  connectionString: envs.DATABASE_URL,
  // Se aplica al iniciar la sesión, sin ejecutar queries manuales en el hook connect.
  options: "-c client_encoding=UTF8",
});

pool.query("SELECT 1")
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch((err) => {
    console.error("❌ Error de conexión a la base de datos");
    console.error(err);
  });