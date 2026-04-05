import { contactoRepository } from "../repositories/contacto.repository.js";

export const contactoService = {
  async registrarConsulta(data) {
    if (!data) {
      throw new Error("No se recibieron datos de contacto");
    }

    const rawMensaje = data.mensaje?.trim();
    if (!rawMensaje) {
      throw new Error("mensaje es obligatorio");
    }

    const payload = {
      nombre: data.nombre?.trim() || "Consulta web",
      email: data.email?.trim() || "sin-email@decoeclat.local",
      telefono: data.telefono?.trim() || "No informado",
      mensaje: rawMensaje,
    };

    return await contactoRepository.create(payload);
  },
};
