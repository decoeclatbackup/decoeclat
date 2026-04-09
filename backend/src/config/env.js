import "dotenv/config";

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().toLowerCase();
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY?.trim();
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const envs = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,

  // Email configuration
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL || "http://localhost:5173/reset-password",

  // Cloudinary configuration
  CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
  CLOUDINARY_API_KEY: cloudinaryApiKey,
  CLOUDINARY_API_SECRET: cloudinaryApiSecret,
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || "decoeclat/productos",

  // CORS configuration
  CORS_ORIGINS: corsOrigins,
};

if (!envs.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en el .env");
}

if (!envs.JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en el .env");
}

if (!envs.CLOUDINARY_CLOUD_NAME || !envs.CLOUDINARY_API_KEY || !envs.CLOUDINARY_API_SECRET) {
  throw new Error("Credenciales de Cloudinary incompletas en el .env");
}