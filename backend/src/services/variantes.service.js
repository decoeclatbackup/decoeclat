import { variantesRepository } from "../repositories/variantes.repository.js";


export const variantesService ={

    async registerVariant(data) {

        if (!data.productoId || !data.precio) {
            throw new Error("El productoID y el precio son obligatorios");
        }
        if (data.precio<=0){
            throw new Error("El precio debe ser mayor a 0");    
        }
        if (data.enOferta && data.precioOferta>= data.precio) {
            throw new Error ("El precio de oferta debe ser menor al precio regular");  
    }
        const payload = {
            productoId: data.productoId,
            telaId: data.telaId,
            sizeId: data.sizeId,
            stock: data.stock || 0,
            precio: data.precio,
            precio_oferta: data.precioOferta || null,
            en_oferta: data.enOferta || false   
        }

        return variantesRepository.create(payload);
    },

    async getVariantsByProduct(filters) {
        
        return variantesRepository.findByProducto(filters);
    },

    async getVariantsByProductById(id) {
        if(!id) throw new Error("ID de producto no provisto");
        return variantesRepository.FindById(id);
    },

    async updateVariant(id, updates) {
        if (updates.stock !== undefined && updates.stock < 0) {
            throw new Error("El stock no puede ser negativo");
        }
        const results = await variantesRepository.update(id, updates);
        if (!results) {
            throw new Error("No se encontraron campos válidos para actualizar o variante no encontrada");
        }
        return results;
    },

    async removeVariant(id) {
        return await variantesRepository.delete(id);
    }

}