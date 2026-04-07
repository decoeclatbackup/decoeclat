import express from "express";
import cors from "cors";
import productosRoutes from "./routes/productos.routes.js";
import variantesRoutes from "./routes/variantes.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import imagenesRoutes from "./routes/imagenes.routes.js";
import homeRoutes from "./routes/home.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import telasRoutes from "./routes/telas.routes.js";
import sizesRoutes from "./routes/sizes.routes.js";
import carritoRoutes from "./routes/carrito.routes.js";
import contactoRoutes from "./routes/contacto.routes.js";
import path from "path";
import { pool } from "./config/db.js";

export const app = express();

app.use(cors({
  origin: [
    "https://decoeclat.vercel.app",
    "https://decoeclat.com.ar",
    "https://www.decoeclat.com.ar",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());

// mount product routes under /api
app.use("/api", clienteRoutes);
app.use("/api", variantesRoutes);
app.use("/api", productosRoutes);
app.use("/api", ventasRoutes);
app.use("/api", reportesRoutes);
app.use("/api", usuariosRoutes);
app.use("/api", categoriasRoutes);
app.use("/api", telasRoutes);
app.use("/api", sizesRoutes);
app.use("/api", carritoRoutes);
app.use("/api", contactoRoutes);
app.use("/api/imagenes", imagenesRoutes);
app.use("/api/home", homeRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

async function healthHandler(_req, res) {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({
      status: "ok",
      database: "ok",
      service: "decoeclat-backend",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      status: "degraded",
      database: "unavailable",
      service: "decoeclat-backend",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
}

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);


app.get("/", (req, res) => {
  res.json({ message: "API funcionando 🚀" });
});