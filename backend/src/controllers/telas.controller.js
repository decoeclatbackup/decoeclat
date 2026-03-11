import { telasService } from "../services/telas.service.js";

export const telasController = {
  async list(req, res) {
    try {
      const telas = await telasService.getTelas();
      res.json(telas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
