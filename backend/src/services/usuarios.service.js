import { usuariosRepository } from "../repositories/usuarios.repository.js";
import { emailService } from "./email.service.js"; // IMPORTANTE: Agregar esta línea
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const usuariosService = {
    login: async (email, contrasenia) => {
        const usuario = await usuariosRepository.findByEmail(email);
        if (!usuario) throw new Error("Credenciales inválidas");

        const esValida = await bcrypt.compare(contrasenia, usuario.contrasenia);
        if (!esValida) throw new Error("Credenciales inválidas");

        const token = jwt.sign(
            { id: usuario.usuario_id, rol: usuario.rol_id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return {
            token,
            user: { nombre: usuario.nombre, rol: usuario.rol_id }
        };
    },

    registrarUsuario: async (datos) => {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(datos.contrasenia, saltRounds);
        
        return await usuariosRepository.create({ 
            ...datos, 
            contrasenia: hashedPassword 
        });
    },

    listarUsuarios: async () => {
        return await usuariosRepository.list();
    },

    solicitarRecuperacion: async (email) => {
        const usuario = await usuariosRepository.findByEmail(email);
        
        // Seguridad: No confirmamos si el mail existe para evitar "User Enumeration"
        if (!usuario) return { message: "Si el correo es válido, recibirás un link pronto." };

        const tokenReset = jwt.sign(
            { id: usuario.usuario_id, reset: true }, 
            process.env.JWT_SECRET, 
            { expiresIn: '15m' }
        );

        // ACTIVADO: Ahora sí enviamos el mail real
        await emailService.enviarLinkReseteo(email, tokenReset);
        
        return { message: "Correo enviado con éxito" };
    },

    resetearPasswordConToken: async (token, nuevaPassword) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (!decoded.reset) throw new Error("Token inválido");

            const saltRounds = 10;
            const nuevoHash = await bcrypt.hash(nuevaPassword, saltRounds);

            return await usuariosRepository.updatePassword(decoded.id, nuevoHash);
        } catch (error) {
            throw new Error("El link de recuperación expiró o es inválido");
        }
    }
};