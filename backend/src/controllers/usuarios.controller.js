import { usuariosService } from "../services/usuarios.service.js";

export const usuariosController = {
    login: async (req, res) => {
        try {
            const {email, contrasenia } = req.body;
            const resultado = await usuariosService.login(email, contrasenia);
            return res.status(200).json(resultado);
        } catch (error) {
            return res.status(401).json({ error: error.message });
        }
    },

    register: async (req, res) => {
        try {
            const nuevoUsuario = await usuariosService.registrarUsuario(req.body);
            return res.status(201).json(nuevoUsuario);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },

    getStaff: async (req, res) => {
        try {
            const empleados = await usuariosService.listarUsuarios();
            return res.status(200).json(empleados);
        } catch (error) {
            return res.status(500).json({ error: "Error al obtener empleados" });
        }
    },

    // --- NUEVOS MÉTODOS PARA RECUPERACIÓN ---

    requestPasswordReset: async (req, res) => {
        try {
            const { email } = req.body;
            const resultado = await usuariosService.solicitarRecuperacion(email);
            return res.status(200).json(resultado);
        } catch (error) {
            // Por seguridad, aunque falle, no le damos pistas al atacante
            return res.status(200).json({ message: "Si el correo es válido, recibirás un link de recuperación." });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token, nuevaPassword } = req.body;
            await usuariosService.resetearPasswordConToken(token, nuevaPassword);
            return res.status(200).json({ message: "Contraseña actualizada con éxito" });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },
    // ... (login, register, getStaff, etc.)

    updatePassword: async (req, res) => {
        try {
            const {passwordActual, passwordNueva} = req.body;
            const usuario_id = req.user.id; // Recordá que esto lo inyecta el middleware verificarToken

            await usuariosService.cambiarPassword(usuario_id, passwordActual, passwordNueva);
            
            return res.status(200).json({ message: "Contraseña actualizada con éxito" });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    },
};