import express from "express";
import productosRoutes from "./routes/productos.routes.js";
import variantesRoutes from "./routes/variantes.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";

export const app = express();

app.use(express.json());

// mount product routes under /api
app.use("/api", clienteRoutes);
app.use("/api", variantesRoutes);
app.use("/api", productosRoutes);


app.get("/", (req, res) => {
  res.json({ message: "API funcionando 🚀" });
});