import { contactoRepository } from "../repositories/contacto.repository.js";

export const contactoService = {
  async registrarConsulta(data) {
    if (!data) {
      throw new Error("No se recibieron datos de contacto");
    }

    const payload = {
      nombre: data.nombre?.trim(),
      email: data.email?.trim(),
      telefono: data.telefono?.trim(),
      mensaje: data.mensaje?.trim(),
    };

    const required = ["nombre", "email", "telefono", "mensaje"];
    for (const field of required) {
      if (!payload[field]) {
        throw new Error(`${field} es obligatorio`);
      }
    }

    return await contactoRepository.create(payload);
  },
};
