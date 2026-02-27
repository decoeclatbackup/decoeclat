import { app } from "./app.js";
import { envs } from "./config/env.js";
import "./config/db.js";

app.listen(envs.PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${envs.PORT}`);
});