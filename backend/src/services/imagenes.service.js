import { imagenesRepository } from "../repositories/imagenes.repository.js";

export const imagenesService = {
    async uploadImage(data) {
        if (!data.producto_id || !data.url) {
            throw new Error("producto_id y url son obligatorios");
        }

        return await imagenesRepository.create({
            producto_id: data.producto_id,
            url: data.url,
            principal: data.principal || false,
            orden: data.orden ?? 0,
        });
    },

    async getImagenesByProducto(producto_id) {
        if (!producto_id) {
            throw new Error("producto_id es obligatorio");
        }
        return await imagenesRepository.getByProducto(producto_id);
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

    async setImagemaPrincipal(img_id, producto_id) {
        if (!img_id || !producto_id) {
            throw new Error("img_id y producto_id son obligatorios");
        }

        // Primero, quitamos principal de todas las imágenes de este producto
        const imagenes = await imagenesRepository.getByProducto(producto_id);
        
        for (const img of imagenes) {
            if (img.img_id !== img_id) {
                await imagenesRepository.update(img.img_id, { principal: false });
            }
        }

        // Luego establecemos la imagen como principal
        return await imagenesRepository.update(img_id, { principal: true });
    }
};
