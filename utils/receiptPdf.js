const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { valorPorExtenso } = require("./valorPorExtenso");

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
  "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const COLORS = {
  primary: "#006BA8",
  text: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  tint: "#F1F6FB",
};

const brl = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

// "123.456.789-00" / "12.345.678/0001-90"; vazio se não houver
const formatDocument = (value) => {
  const d = onlyDigits(value);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14)
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return d;
};
const documentLabel = (value) => (onlyDigits(value).length === 14 ? "CNPJ" : "CPF");

const formatPhone = (value) => {
  const d = onlyDigits(value);
  if (d.length === 11) return d.replace(/(\d{2})(\d)(\d{4})(\d{4})/, "($1) $2 $3-$4");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return d;
};

const longDate = (date) =>
  `${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`;

const shortDate = (iso) => iso.split("-").reverse().join("/");

const localShortDate = (date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;

// ["09","23","29"] + "2026-09" → "09/09, 23/09 e 29/09/2026"
const formatDays = (days, monthAndYear) => {
  const [year, month] = monthAndYear.split("-");
  const list = days.map((d) => `${String(d).padStart(2, "0")}/${month}`);
  const last = `${list.pop()}/${year}`;
  return list.length ? `${list.join(", ")} e ${last}` : last;
};

// Escreve um parágrafo com trechos em negrito: [["texto"], ["negrito", true]].
// Espaços entre trechos ficam no fim do trecho anterior: o pdfkit descarta
// espaço no começo de um trecho "continued".
const richParagraph = (doc, parts, options) => {
  parts.forEach(([text, bold], i) => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .text(text, { ...options, continued: i < parts.length - 1 });
  });
};

/**
 * Gera o PDF do recibo e escreve em `stream`.
 * data: { number, amount, total, partial, paymentDate, issuedAt, monthAndYear,
 *         days, service, professional: {...}, payer: {...}, patientName }
 */
const writeReceiptPdf = (stream, data) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 56,
    info: {
      Title: `Recibo nº ${String(data.number).padStart(4, "0")}`,
      Author: data.professional.name,
      Creator: "Psicontrol",
    },
  });
  doc.pipe(stream);

  const left = doc.page.margins.left;
  const width = doc.page.width - left - doc.page.margins.right;
  const number = String(data.number).padStart(4, "0");
  const pro = data.professional;

  // Cabeçalho: logotipo + identificação do profissional
  let textX = left;
  const top = doc.y;
  if (pro.logoPath && fs.existsSync(pro.logoPath)) {
    try {
      doc.image(pro.logoPath, left, top, { fit: [56, 56], align: "center", valign: "center" });
      textX = left + 72;
    } catch {
      // Formato de imagem não suportado pelo PDF: segue sem logotipo
    }
  }
  const headerWidth = width - (textX - left);
  doc
    .fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(pro.displayName, textX, top, { width: headerWidth });
  const idLine = [
    pro.registry,
    pro.document && `${documentLabel(pro.document)} ${formatDocument(pro.document)}`,
  ].filter(Boolean);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.muted)
    .text(idLine.join("  ·  "), { width: headerWidth });
  const contactLine = [pro.phone && formatPhone(pro.phone), pro.email, pro.city].filter(Boolean);
  if (contactLine.length) doc.text(contactLine.join("  ·  "), { width: headerWidth });

  const headerBottom = Math.max(doc.y, top + 56) + 18;
  doc
    .moveTo(left, headerBottom)
    .lineTo(left + width, headerBottom)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();

  // Título + valor em destaque
  const titleTop = headerBottom + 24;
  doc
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(26)
    .text("RECIBO", left, titleTop);
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(11)
    .text(`Nº ${number}`, left, doc.y + 2);

  const boxW = 190;
  const boxH = 62;
  const boxX = left + width - boxW;
  doc.roundedRect(boxX, titleTop, boxW, boxH, 10).fill(COLORS.tint);
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(data.partial ? "VALOR RECEBIDO (PARCIAL)" : "VALOR RECEBIDO", boxX + 16, titleTop + 13, {
      width: boxW - 32,
    });
  doc
    .fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(brl(data.amount), boxX + 16, titleTop + 28, { width: boxW - 32 });

  // Texto do recibo
  const payer = data.payer;
  const payerDoc = payer.document
    ? `, ${documentLabel(payer.document)} ${formatDocument(payer.document)}`
    : "";
  const days = formatDays(data.days, data.monthAndYear);
  const nosDias = data.days.length === 1 ? "no dia" : "nos dias";
  const forPatient =
    data.patientName && data.patientName !== payer.name
      ? `, do(a) paciente ${data.patientName},`
      : "";

  doc.x = left;
  doc.y = titleTop + boxH + 34;
  doc.fillColor(COLORS.text).fontSize(12.5);
  // Justificado quebra com trechos em negrito no pdfkit; à esquerda fica limpo
  const paragraph = { width, align: "left", lineGap: 5 };
  richParagraph(
    doc,
    [
      ["Recebi de "],
      [payer.name, true],
      [`${payerDoc}, a quantia de `],
      [`${brl(data.amount)} `, true],
      [`(${valorPorExtenso(data.amount)}), `],
      data.partial
        ? [`como pagamento parcial de ${data.service}${forPatient} ${nosDias} ${days}, no total de ${brl(data.total)}.`]
        : [`referente a ${data.service}${forPatient} ${nosDias} ${days}.`],
    ],
    paragraph
  );

  if (data.paymentDate) {
    doc.moveDown(0.6).font("Helvetica").text(`Pagamento recebido em ${shortDate(data.paymentDate)}.`, paragraph);
  }

  // Local e data
  doc.moveDown(2.2);
  const place = pro.city ? `${pro.city}, ${longDate(data.issuedAt)}.` : `${longDate(data.issuedAt)}.`;
  doc.font("Helvetica").fontSize(12).text(place, left, doc.y, { width, align: "right" });

  // Assinatura
  const signY = doc.y + 70;
  const signW = 280;
  const signX = left + (width - signW) / 2;
  doc.moveTo(signX, signY).lineTo(signX + signW, signY).lineWidth(0.8).strokeColor(COLORS.text).stroke();
  doc
    .fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(pro.name, signX, signY + 8, { width: signW, align: "center" });
  const signDetails = [
    pro.registry,
    pro.document && `${documentLabel(pro.document)} ${formatDocument(pro.document)}`,
  ].filter(Boolean);
  if (signDetails.length) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(signDetails.join("  ·  "), signX, doc.y + 2, { width: signW, align: "center" });
  }

  // Rodapé
  const footerY = doc.page.height - doc.page.margins.bottom - 12;
  doc
    .fontSize(8.5)
    .fillColor(COLORS.muted)
    .text(
      `Recibo nº ${number} · emitido em ${localShortDate(data.issuedAt)} pelo Psicontrol`,
      left,
      footerY,
      { width, align: "center", lineBreak: false }
    );

  doc.end();
};

const logoPathFor = (image) =>
  image ? path.join(process.cwd(), "uploads", path.basename(image)) : null;

module.exports = { writeReceiptPdf, logoPathFor };
