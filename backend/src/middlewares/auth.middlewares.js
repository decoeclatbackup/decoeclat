import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Acceso denegado. Token no provisto." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(403).json({ error: "Token inválido o expirado." });
    }
};

export const esAdmin = (req, res, next) => {
    // Agregamos el chequeo de que req.user exista primero
    if (!req.user || req.user.rol !== 1) {
        return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador." });
    }
    next();
};

export const esAdminOStaff = (req, res, next) => {
    if (!req.user || ![1, 2].includes(Number(req.user.rol))) {
        return res.status(403).json({ error: "Acceso denegado. Se requieren permisos administrativos." });
    }
    next();
};