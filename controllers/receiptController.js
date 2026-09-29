const { UniqueConstraintError } = require("sequelize");
const {
  Customer,
  CustomersBillingRecords,
  Receipt,
  User,
} = require("../models");
const { formatRegistry, describeService } = require("../utils/councils");
const { writeReceiptPdf, logoPathFor } = require("../utils/receiptPdf");

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const parseDays = (consultationDays) =>
  (consultationDays || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map(Number)
    .sort((a, b) => a - b);

// Próximo número do profissional; o índice único (user_id, number) barra
// dois recibos com o mesmo número se houver emissões simultâneas
const createWithNextNumber = async (fields) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const last = await Receipt.max("number", { where: { user_id: fields.user_id } });
    try {
      return await Receipt.create({ ...fields, number: (last || 0) + 1 });
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) throw error;
      // Mesmo paciente/mês criado em paralelo: usa o que já existe
      const existing = await Receipt.findOne({
        where: {
          user_id: fields.user_id,
          customer_id: fields.customer_id,
          month_and_year: fields.month_and_year,
        },
      });
      if (existing) return existing;
    }
  }
  throw new Error("Não foi possível numerar o recibo.");
};

// POST /dashboard/receipts { customer_id, month_and_year: "2026-09" } → PDF
exports.issueReceipt = async (req, res) => {
  const userId = req.user.user_id;
  const customerId = Number(req.body.customer_id);
  const monthAndYear = String(req.body.month_and_year || "");

  if (!Number.isInteger(customerId) || !MONTH_RE.test(monthAndYear)) {
    return res
      .status(400)
      .json({ error: "Informe o paciente e o mês (AAAA-MM)." });
  }

  const customer = await Customer.findOne({
    where: { customer_id: customerId, user_id: userId },
  });
  if (!customer) {
    return res.status(404).json({ error: "Paciente não encontrado." });
  }

  const billing = await CustomersBillingRecords.findOne({
    where: { customer_id: customerId, month_and_year: monthAndYear },
  });
  const days = parseDays(billing?.consultation_days);
  if (!billing || days.length === 0) {
    return res
      .status(404)
      .json({ error: "Não há consultas deste paciente no mês." });
  }

  const total = days.length * parseFloat(billing.consultation_fee || 0);
  const partial = billing.payment_status === "parcial";
  if (billing.payment_status !== "pago" && !partial) {
    return res
      .status(400)
      .json({ error: "Registre o pagamento antes de emitir o recibo." });
  }
  const amount = partial
    ? Math.min(parseFloat(billing.payment_amount || 0), total)
    : total;
  if (!(amount > 0)) {
    return res.status(400).json({ error: "O valor pago precisa ser maior que zero." });
  }

  // Reemitir o mesmo mês mantém o número; se o valor mudou (ex.: parcial →
  // pago), o recibo é atualizado com o novo valor e a nova data
  let receipt = await Receipt.findOne({
    where: { user_id: userId, customer_id: customerId, month_and_year: monthAndYear },
  });
  if (!receipt) {
    receipt = await createWithNextNumber({
      user_id: userId,
      customer_id: customerId,
      month_and_year: monthAndYear,
      amount,
    });
  } else if (Number(receipt.amount) !== amount) {
    await receipt.update({ amount, issued_at: new Date() });
  }

  const user = await User.findOne({ where: { user_id: userId } });
  const council = { type: user.council_type, category: user.council_category };
  const service = user.receipt_description
    ? `${user.receipt_description} (${days.length} ${days.length === 1 ? "atendimento" : "atendimentos"})`
    : describeService(council, days.length);

  const number = String(receipt.number).padStart(4, "0");
  const slug = customer.customer_name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="recibo-${number}-${slug}-${monthAndYear}.pdf"`
  );
  res.setHeader("X-Receipt-Number", receipt.number);
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, X-Receipt-Number");

  writeReceiptPdf(res, {
    number: receipt.number,
    amount,
    total,
    partial,
    paymentDate: partial ? null : billing.payment_date,
    issuedAt: new Date(receipt.issued_at),
    monthAndYear,
    days,
    service,
    patientName: customer.customer_name,
    payer: {
      name: customer.alternative_name || customer.customer_name,
      document: customer.alternative_cpf_cnpj || customer.customer_cpf_cnpj,
    },
    professional: {
      name: user.user_name,
      displayName: user.clinic_name || user.user_name,
      document: user.user_cnpj || user.user_cpf,
      registry: formatRegistry({
        type: user.council_type,
        region: user.council_region,
        number: user.council_number,
        category: user.council_category,
      }),
      phone: user.user_phone,
      email: user.user_email,
      city: user.city,
      logoPath: logoPathFor(user.image),
    },
  });
};

// GET /dashboard/receipts?month=9&year=2026 → { [customer_id]: número }
exports.listReceipts = async (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return res.status(400).json({ error: "Informe 'month' (1-12) e 'year' válidos." });
  }

  const receipts = await Receipt.findAll({
    where: {
      user_id: req.user.user_id,
      month_and_year: `${year}-${String(month).padStart(2, "0")}`,
    },
    attributes: ["customer_id", "number"],
  });
  res
    .status(200)
    .json(Object.fromEntries(receipts.map((r) => [r.customer_id, r.number])));
};
