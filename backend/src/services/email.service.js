import nodemailer from "nodemailer";
import { envs } from "../config/env.js";

const transporter = nodemailer.createTransport({
    service: 'gmail', // Podés usar 'outlook', 'sendgrid', etc.
    auth: {
        user: envs.EMAIL_USER, // Tu mail de Deceoclat
        pass: envs.EMAIL_PASS  // Tu contraseña de aplicación
    }
});

export const emailService = {
    enviarLinkReseteo: async (emailDestino, token) => {
        // URL dinámica: se obtiene de .env o usa localhost para desarrollo
        const urlReset = `${envs.RESET_PASSWORD_URL}?token=${token}`;

        const mailOptions = {
            from: `"Sistema Gestión DECOECLAT" <${envs.EMAIL_USER}>`,
            to: emailDestino,
            subject: "Recuperación de Contraseña - DECOECLAT",
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center;">
                    <h2>¿Olvidaste tu contraseña?</h2>
                    <p>No hay problema. Hacé clic en el siguiente botón para elegir una nueva:</p>
                    <a href="${urlReset}" style="background-color: #444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Restablecer Contraseña
                    </a>
                    <p style="margin-top: 20px; color: #888;">Este link expira en 15 minutos.</p>
                </div>
            `
        };

        return await transporter.sendMail(mailOptions);
    }
};