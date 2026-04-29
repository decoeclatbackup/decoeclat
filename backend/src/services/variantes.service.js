import { variantesRepository } from "../repositories/variantes.repository.js";

const ALLOWED_COLORS = new Map([
    ['beige', 'Beige'],
    ['arena', 'Arena'],
    ['avellana', 'Avellana'],
    ['khaki', 'Khaki'],
    ['blanco', 'Blanco'],
    ['negro', 'Negro'],
    ['gris perla', 'Gris Perla'],
    ['gris aero', 'Gris Aero'],
    ['gris acero', 'Gris Acero'],
    ['azul aero', 'Azul Aero'],
    ['azul acero', 'Azul Acero'],
    ['verde', 'Verde'],
    ['rosa', 'Rosa'],
    ['canela', 'Canela'],
    ['amarillo', 'Amarillo'],
    ['chocolate', 'Chocolate'],
]);

function normalizeBoolean(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    if (value == null) return fallback;
    return Boolean(value);
}


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
            color: normalizeColor(data.color),
            relleno: normalizeBoolean(data.relleno, false),
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
        if (Object.prototype.hasOwnProperty.call(updates, 'relleno')) {
            updates.relleno = normalizeBoolean(updates.relleno, false);
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'color')) {
            updates.color = normalizeColor(updates.color);
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

function normalizeColor(value) {
    const rawValue = String(value ?? '').trim();
    if (!rawValue) return null;
    const normalizedKey = rawValue
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const allowedColor = ALLOWED_COLORS.get(normalizedKey);
    if (!allowedColor) {
        throw new Error("Color invalido para la variante");
    }

    return allowedColor;
}