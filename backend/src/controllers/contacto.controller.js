import { contactoService } from "../services/contacto.service.js";

export const contactoController = {
  async create(req, res) {
    try {
      const consulta = await contactoService.registrarConsulta(req.body);
      return res.status(201).json({
        consulta_id: consulta.consulta_contacto_id,
        message: "Consulta enviada correctamente",
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};
