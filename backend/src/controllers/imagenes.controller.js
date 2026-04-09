import { imagenesService } from "../services/imagenes.service.js";

export const imagenesController = {
    async uploadImage(req, res) {
        try {
            const uploadedFiles = Array.isArray(req.uploadedImages) && req.uploadedImages.length > 0
                ? req.uploadedImages
                : (req.file ? [req.file] : []);

            if (uploadedFiles.length === 0) {
                return res.status(400).json({ error: "Debe subir un archivo de imagen" });
            }

            const { variante_id, principal, orden } = req.body;
            const varianteId = Number.parseInt(variante_id, 10);

            if (!Number.isInteger(varianteId) || varianteId <= 0) {
                return res.status(400).json({ error: "variante_id es obligatorio y debe ser un número válido" });
            }

            const baseOrder = Number(orden ?? 0);
            const isPrincipalRequested = principal === 'true' || principal === true;
            const createdImages = [];

            for (let index = 0; index < uploadedFiles.length; index += 1) {
                const file = uploadedFiles[index];
                const cloudinaryUrl = file.path || file.secure_url || file.url;
                const cloudinaryPublicId = file.filename || file.public_id || null;

                if (!cloudinaryUrl) {
                    throw new Error('No se pudo obtener la URL de Cloudinary');
                }

                const newImage = await imagenesService.uploadImage({
                    variante_id: varianteId,
                    url: cloudinaryUrl,
                    public_id: cloudinaryPublicId,
                    principal: isPrincipalRequested && index === 0,
                    orden: Number.isFinite(baseOrder) ? baseOrder + index : index,
                });

                createdImages.push(newImage);
            }

            if (createdImages.length === 1) {
                return res.status(201).json(createdImages[0]);
            }

            return res.status(201).json(createdImages);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async getByProducto(req, res) {
        try {
            const { producto_id } = req.params;
            const imagenes = await imagenesService.getImagenesByProducto(producto_id);
            return res.status(200).json(imagenes);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async updateImage(req, res) {
        try {
            const { img_id } = req.params;
            const updates = req.body;
            // Si el body trae 'principal' como string, lo convertimos
            if (updates.principal !== undefined) {
                updates.principal = updates.principal === 'true' || updates.principal === true;
            }
            const updated = await imagenesService.updateImage(img_id, updates);
            return res.status(200).json(updated);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async deleteImage(req, res) {
        try {
            const { img_id } = req.params;
            await imagenesService.deleteImage(img_id);
            return res.status(204).send();
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async setImagemaPrincipal(req, res) {
        try {
            const { img_id } = req.params;
            const { producto_id } = req.body;
            const updated = await imagenesService.setImagemaPrincipal(img_id, producto_id);
            return res.status(200).json(updated);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
};