import { imagenesService } from "../services/imagenes.service.js";

export const imagenesController = {
    async uploadImage(req, res) {
        try {
            // 1. Validar que Multer haya procesado un archivo
            if (!req.file) {
                return res.status(400).json({ error: "Debe subir un archivo de imagen" });
            }

            // 2. Extraer datos del body
            const { variante_id, principal } = req.body;

            // 3. Construir la URL del archivo para la base de datos
            // req.file.filename es el nombre único que generó el middleware
            const urlPath = `/uploads/productos/${req.file.filename}`;

            const newImage = await imagenesService.uploadImage({
                variante_id: parseInt(variante_id), // Aseguramos que sea número
                url: urlPath,
                principal: principal === 'true' || principal === true // Convertir string de form-data a boolean
            });

            return res.status(201).json(newImage);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    async getByVariante(req, res) {
        try {
            const { variante_id } = req.params;
            const imagenes = await imagenesService.getImagenesByVariante(variante_id);
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
            const { variante_id } = req.body;
            const updated = await imagenesService.setImagemaPrincipal(img_id, variante_id);
            return res.status(200).json(updated);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
};