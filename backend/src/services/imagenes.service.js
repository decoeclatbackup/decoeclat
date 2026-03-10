import { imagenesRepository } from "../repositories/imagenes.repository.js";

export const imagenesService = {
    async uploadImage(data) {
        if (!data.variante_id || !data.url) {
            throw new Error("variante_id y url son obligatorios");
        }

        return await imagenesRepository.create({
            variante_id: data.variante_id,
            url: data.url,
            principal: data.principal || false
        });
    },

    async getImagenesByVariante(variante_id) {
        if (!variante_id) {
            throw new Error("variante_id es obligatorio");
        }
        return await imagenesRepository.getByVariante(variante_id);
    },

    async updateImage(img_id, updates) {
        if (!img_id) {
            throw new Error("img_id es obligatorio");
        }

        const imagen = await imagenesRepository.getById(img_id);
        if (!imagen) {
            throw new Error("Imagen no encontrada");
        }

        return await imagenesRepository.update(img_id, updates);
    },

    async deleteImage(img_id) {
        if (!img_id) {
            throw new Error("img_id es obligatorio");
        }

        const imagen = await imagenesRepository.getById(img_id);
        if (!imagen) {
            throw new Error("Imagen no encontrada");
        }

        return await imagenesRepository.delete(img_id);
    },

    async setImagemaPrincipal(img_id, variante_id) {
        if (!img_id || !variante_id) {
            throw new Error("img_id y variante_id son obligatorios");
        }

        // Primero, quitamos principal de todas las imágenes de esta variante
        const imagenes = await imagenesRepository.getByVariante(variante_id);
        
        for (const img of imagenes) {
            if (img.img_id !== img_id) {
                await imagenesRepository.update(img.img_id, { principal: false });
            }
        }

        // Luego establecemos la imagen como principal
        return await imagenesRepository.update(img_id, { principal: true });
    }
};
