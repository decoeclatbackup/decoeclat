import { request } from './http'

export const clienteService = {
    async crearclienteTemporal() {
        return request('/api/clientes/temporal', {
            method: 'POST',
        })
    },

    async verificarEmailExistente(email) {
        try {
            const clientes = await request('/api/clientes', {}, { email })
            return Array.isArray(clientes) && clientes.length > 0
        } catch {
            // Si hay error en la búsqueda, asumimos que no existe
            return false
        }
    },

    async completarClienteTemporal(clienteId, payload) {
        if (!clienteId) {
            throw new Error('clienteId es obligatorio para completar cliente temporal')
        }

        return request(`/api/clientes/temporal/${clienteId}`, {
            method: 'PUT',
            body: JSON.stringify({
                nombre: payload?.nombre,
                email: payload?.email,
                telefono: payload?.telefono,
            }),
        })
    },
};