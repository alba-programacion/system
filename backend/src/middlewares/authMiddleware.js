const jwt = require("jsonwebtoken");

// Verificar token

exports.verificarToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ msg: "No hay token, autorización denegada" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token inválido" });
  }
};

// Verificar rol

exports.verificarRol = (rolRequerido) => {
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.roles.includes(rolRequerido)) {
      return res.status(403).json({ msg: "No tienes permisos para esta acción" });
    }
    next();
  };
};
