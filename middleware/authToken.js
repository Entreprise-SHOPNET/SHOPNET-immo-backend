


const jwt = require('jsonwebtoken');

const authToken = (req, res, next) => {
  try {
    // 🔐 récupérer token depuis cookie OU header
    const token =
      req.headers.authorization?.split(' ')[1] ||
      req.cookies?.token;

    // ❌ si pas de token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Non connecté"
      });
    }

    // 🔓 vérifier token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 📦 injecter user dans req
    req.user = decoded;

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Session expirée ou invalide"
    });
  }
};

module.exports = authToken;