const jwt = require("jsonwebtoken");

exports.verificarToken = (req, res, next) => {
  let token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ msg: "Acceso denegado, token requerido" });
  }

  // Validar que empiece con Bearer
  if (!token.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Formato de token inválido" });
  }

  token = token.split(" ")[1]; // Extrae solo el JWT limpio

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token inválido" });
  }
};