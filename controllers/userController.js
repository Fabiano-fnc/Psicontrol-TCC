const { User } = require("../models");
const { validateRegistry, formatRegistry } = require("../utils/councils");
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
  "user_phone",
  "user_message",
  "clinic_name",
  "city",
  "receipt_description",
];

const FIELD_RULES = {
  user_cpf: { pattern: /^\d{11}$/, message: "CPF deve ter 11 dígitos." },
  user_cnpj: { pattern: /^\d{14}$/, message: "CNPJ deve ter 14 dígitos." },
  user_phone: { pattern: /^\d{10,15}$/, message: "Telefone deve ter entre 10 e 15 dígitos." },
  clinic_name: { maxLength: 255, message: "Nome/Clínica deve ter no máximo 255 caracteres." },
  city: { maxLength: 100, message: "Cidade deve ter no máximo 100 caracteres." },
  receipt_description: { maxLength: 120, message: "Descrição do serviço deve ter no máximo 120 caracteres." },
};

const toUserResponse = (user) => ({
  user_id: user.user_id,
  user_name: user.user_name,
  user_cpf: user.user_cpf,
  user_cnpj: user.user_cnpj,
  council_type: user.council_type,
  council_region: user.council_region,
  council_number: user.council_number,
  council_category: user.council_category,
  // Registro já escrito no formato do conselho, ex.: "CRM-SP 123456"
  registry: formatRegistry({
    type: user.council_type,
    region: user.council_region,
    number: user.council_number,
    category: user.council_category,
  }),
  user_phone: user.user_phone,
  user_email: user.user_email,
  user_message: user.user_message,
  clinic_name: user.clinic_name,
  city: user.city,
  receipt_description: user.receipt_description,
  image: user.image ? `/uploads/${user.image}` : null,
  signature_image: user.signature_image ? `/uploads/${user.signature_image}` : null,
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

  // Registro profissional: vem junto (conselho + região + número + categoria).
  // Número vazio apaga o registro.
  if (body.council_number !== undefined) {
    if (String(body.council_number).trim() === "") {
      Object.assign(updates, {
        council_type: null,
        council_region: null,
        council_number: null,
        council_category: null,
      });
    } else {
      const { value, error } = validateRegistry({
        type: body.council_type,
        region: body.council_region,
        number: body.council_number,
        category: body.council_category,
      });
      if (error) return { error };
      Object.assign(updates, {
        council_type: value.type,
        council_region: value.region,
        council_number: value.number,
        council_category: value.category,
      });
    }
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
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  async (req, res) => {
    const userId = req.user.user_id;
    const { updates, error } = buildUserUpdates(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    if (req.files?.image?.[0]) {
      updates.image = req.files.image[0].filename;
    }
    // Assinatura: arquivo novo substitui; remove_signature=true apaga
    if (req.files?.signature?.[0]) {
      updates.signature_image = req.files.signature[0].filename;
    } else if (req.body.remove_signature === "true") {
      updates.signature_image = null;
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
