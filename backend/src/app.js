import express from "express";
import productosRoutes from "./routes/productos.routes.js";
import variantesRoutes from "./routes/variantes.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";

export const app = express();

app.use(express.json());

// mount product routes under /api
app.use("/api", clienteRoutes);
app.use("/api", variantesRoutes);
app.use("/api", productosRoutes);
app.use("/api", ventasRoutes);
app.use("/api", reportesRoutes);


app.get("/", (req, res) => {
  res.json({ message: "API funcionando 🚀" });
});