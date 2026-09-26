const { User } = require("../models");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    // Nome único e sem caminhos: evita sobrescrever arquivos de outros usuários
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

const EDITABLE_FIELDS = [
  "user_cpf",
  "user_cnpj",
  "crp_number",
  "user_phone",
  "user_message",
  "clinic_name",
];

const FIELD_RULES = {
  user_cpf: { pattern: /^\d{11}$/, message: "CPF deve ter 11 dígitos." },
  user_cnpj: { pattern: /^\d{14}$/, message: "CNPJ deve ter 14 dígitos." },
  crp_number: { pattern: /^\d{2}\/\d{4,6}$/, message: "CRP deve estar no formato XX/XXXXX." },
  user_phone: { pattern: /^\d{10,15}$/, message: "Telefone deve ter entre 10 e 15 dígitos." },
  clinic_name: { maxLength: 255, message: "Nome/Clínica deve ter no máximo 255 caracteres." },
};

const toUserResponse = (user) => ({
  user_id: user.user_id,
  user_name: user.user_name,
  user_cpf: user.user_cpf,
  user_cnpj: user.user_cnpj,
  crp_number: user.crp_number,
  user_phone: user.user_phone,
  user_email: user.user_email,
  user_message: user.user_message,
  clinic_name: user.clinic_name,
  image: user.image ? `/uploads/${user.image}` : null,
});

// Campo ausente na requisição: não altera. Campo vazio: apaga (null).
const buildUserUpdates = (body) => {
  const updates = {};

  for (const field of EDITABLE_FIELDS) {
    if (body[field] === undefined) continue;

    const value = String(body[field]).trim();
    if (value === "") {
      updates[field] = null;
      continue;
    }

    const rule = FIELD_RULES[field];
    if (
      rule &&
      ((rule.pattern && !rule.pattern.test(value)) ||
        (rule.maxLength && value.length > rule.maxLength))
    ) {
      return { error: rule.message };
    }

    updates[field] = value;
  }

  return { updates };
};

exports.getUser = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.status(200).json(toUserResponse(user));
  } catch (error) {
    console.error("Erro no getUser:", error);
    res.status(500).json({ error: "Erro ao buscar os dados do usuário." });
  }
};


// Função para editar o usuário com upload de imagem
exports.editUser = [
  upload.single("image"),
  async (req, res) => {
    const userId = req.user.user_id;
    const { updates, error } = buildUserUpdates(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    if (req.file) {
      updates.image = req.file.filename;
    }

    try {
      const user = await User.findOne({ where: { user_id: userId } });
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      await user.update(updates);

      res.status(200).json(toUserResponse(user));
    } catch (error) {
      console.error("Erro ao atualizar o usuário:", error);
      res.status(500).json({ error: "Erro ao atualizar os dados do usuário." });
    }
  },
];
