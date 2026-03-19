import { clienteRepository } from "../repositories/cliente.repository.js";

export const clienteService = {
    async registerCliente(data) {
       if (!data) {
            throw new Error("No se recibieron datos para registrar el cliente");
        } 
    
    const required= ["nombre", "email","telefono"];
    for(const field of required){
        if (!data[field]) { 
            throw new Error(`${field} es obligatorio`);
        }
    }

    const clientesExistentes =
     await clienteRepository.find({ email: data.email });
     if (clientesExistentes.length>0) {
        throw new Error ("El correo electronico ya está registrado");
     }

    return await clienteRepository.create(data);
},

async crearclienteTemporal() {
  try {
    const random = Math.random().toString(36).substring(2, 8)

    return await clienteRepository.create({
      nombre: 'invitado',
      email: `temp_${random}@mail.com`,
      telefono: null,
    })
  } catch (error) {
    throw new Error(error.message)
  }
},

async getCliente(filters) {
    return await clienteRepository.find(filters);
},

async getClienteById(id) {
    const cliente =await clienteRepository.findById(id);
    if (!cliente) {
        throw new Error ("Cliente no encontrado");
    }
    return cliente;
},

async modifyCliente(id, updates) {
    // 1. Buscamos al cliente (usamos el nombre correcto)
    const clienteExistente = await clienteRepository.findById(id);
    if (!clienteExistente) {
        throw new Error("Cliente no encontrado");
    }

    // 2. Si quieren cambiar el email, validamos que no esté repetido
    if (updates.email && updates.email !== clienteExistente.email) {
        const existeEmail = await clienteRepository.find({ email: updates.email });
        if (existeEmail.length > 0) {
            throw new Error("El correo electronico ya está registrado por otro usuario");
        }
    }

    // 3. El UPDATE va AFUERA del bloque IF del email. 
    // Así funciona tanto si cambiás el email como si cambiás solo el teléfono.
    const clienteActualizado = await clienteRepository.update(id, updates);
    return clienteActualizado;
},
async removeCliente(id) {
    const clienteExistente = await clienteRepository.findById(id);
    if (!clienteExistente) {
        throw new Error ("Cliente no encontrado");
    }
    return await clienteRepository.deactivate(id);

},
};