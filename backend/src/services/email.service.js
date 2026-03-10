import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail', // Podés usar 'outlook', 'sendgrid', etc.
    auth: {
        user: process.env.EMAIL_USER, // Tu mail de Deceoclat
        pass: process.env.EMAIL_PASS  // Tu contraseña de aplicación
    }
});

export const emailService = {
    enviarLinkReseteo: async (emailDestino, token) => {
        // En un entorno real, este link llevaría a tu pantalla de Frontend
        const urlReset = `http://decoeclat.com.ar/reset-password?token=${token}`;

        const mailOptions = {
            from: `"Sistema gestión decoeclat" <${process.env.EMAIL_USER}>`,
            to: emailDestino,
            subject: "Recuperación de Contraseña - Decoeclat",
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