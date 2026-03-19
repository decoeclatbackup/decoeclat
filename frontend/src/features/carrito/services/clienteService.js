export const clienteService = {
    async crearclienteTemporal() {
        return request('/api/clientes/temporal', {
            method: 'POST',
        })
    },
};