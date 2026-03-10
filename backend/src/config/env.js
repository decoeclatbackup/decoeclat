import "dotenv/config";

export const envs = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,

  // Email configuration
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL || "http://localhost:5173/reset-password",
};

if (!envs.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en el .env");
}

if (!envs.JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en el .env");
}