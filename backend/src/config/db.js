import { Pool } from "pg";
import { envs } from "./env.js";

export const pool = new Pool({
  connectionString: envs.DATABASE_URL,
});

pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch((err) => {
    console.error("❌ Error de conexión a la base de datos");
    console.error(err);
  });