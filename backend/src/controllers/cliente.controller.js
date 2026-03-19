import { clienteService } from "../services/cliente.service.js"; // Comillas corregidas

export const clienteController = {
    async create(req, res) {
        try {
            const cliente = await clienteService.registerCliente(req.body); // Nombre corregido
            res.status(201).json(cliente);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    async crearclienteTemporal(req, res) {
  try {
    const cliente = await clienteService.crearclienteTemporal()
    res.status(201).json(cliente)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
},

        async completarClienteTemporal(req, res) {
                try {
                        const { id } = req.params;
                        const cliente = await clienteService.completarClienteTemporal(id, req.body);
                        res.status(200).json(cliente);
                } catch (error) {
                        res.status(400).json({ error: error.message });
                }
        },

    async list(req, res) {
        try {
            const filters = {
                nombre: req.query.nombre,
                email: req.query.email,
            };
            const clientes = await clienteService.getCliente(filters);
            res.json(clientes);
        } catch (err) {
            res.status(500).json({ error: "Error al obtener clientes" }); // 'res' corregido
        }
    },

    async get(req, res) {
        const { id } = req.params;
        try {
            const cliente = await clienteService.getClienteById(id);
            if (!cliente) {
                return res.status(404).json({ error: "cliente no encontrado" });
            }
            res.json(cliente);
        } catch (err) {
            res.status(404).json({ error: err.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const clienteActualizado = await clienteService.modifyCliente(id, updates);

            if (!clienteActualizado) { // Nombre de variable corregido
                return res.status(404).json({ error: "Cliente no encontrado" });
            }
            res.json(clienteActualizado);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    async remove(req, res) {
        try {
            const { id } = req.params;
            const desactivado = await clienteService.removeCliente(id);
            if (!desactivado) {
                return res.status(404).json({ error: "Cliente no encontrado" });
            }
            res.status(204).send();
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
};