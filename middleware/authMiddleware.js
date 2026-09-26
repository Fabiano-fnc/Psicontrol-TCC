const { User } = require("../models");

exports.verifyToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token || token === "null") {
    return res.status(401).json({ error: "Sessão não encontrada. Faça login." });
  }

  try {
    const user = await User.findOne({ where: { autentication_token: token } });
    if (!user) {
      return res
        .status(401)
        .json({ error: "Sessão inválida ou expirada. Faça login novamente." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Erro ao validar sessão:", error);
    res.status(500).json({ error: "Erro ao validar sessão." });
  }
};
