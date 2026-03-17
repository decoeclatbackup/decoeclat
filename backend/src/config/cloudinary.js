import { v2 as cloudinary } from "cloudinary";
import { envs } from "./env.js";

cloudinary.config({
  cloud_name: envs.CLOUDINARY_CLOUD_NAME,
  api_key: envs.CLOUDINARY_API_KEY,
  api_secret: envs.CLOUDINARY_API_SECRET,
  secure: true,
});

export function getCloudinaryFolder() {
  return envs.CLOUDINARY_FOLDER || "decoeclat/productos";
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };