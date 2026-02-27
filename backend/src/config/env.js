import "dotenv/config";

export const envs = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
};

if (!envs.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en el .env");
}

if (!envs.JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en el .env");
}