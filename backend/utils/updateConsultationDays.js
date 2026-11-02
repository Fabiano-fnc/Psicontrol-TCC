const { format, parseISO } = require("date-fns");
const { Op } = require("sequelize");
const { Event, CustomersBillingRecords, Customer } = require("../models");

const CANCELLED_STATUSES = ["cancelado", "cancelled"];

// Recalcula, mês a mês, os dias de consulta do paciente a partir dos
// eventos ativos. Meses que ficaram sem consulta são removidos, exceto
// os que já têm pagamento registrado (esses só ficam zerados).
const updateConsultationDays = async (customerId) => {
  const events = await Event.findAll({
    where: {
      customer_id: customerId,
      status: { [Op.or]: [{ [Op.notIn]: CANCELLED_STATUSES }, null] },
    },
    attributes: ["date"],
  });

  const daysByMonthYear = events.reduce((acc, event) => {
    if (!event.date) return acc;
    const [year, month] = event.date.split("-");
    const monthYear = `${year}-${month}`;
    if (!acc[monthYear]) acc[monthYear] = [];

    const day = format(parseISO(event.date), "dd");
    acc[monthYear].push(day);

    return acc;
  }, {});

  const customer = await Customer.findOne({
    where: { customer_id: customerId },
    attributes: ["consultation_fee"],
  });
  if (!customer) return;
  const consultationFee = customer.consultation_fee || 0.0;

  const existingRecords = await CustomersBillingRecords.findAll({
    where: { customer_id: customerId, month_and_year: { [Op.ne]: null } },
  });

  for (const record of existingRecords) {
    if (daysByMonthYear[record.month_and_year]) continue;

    const hasPayment =
      record.payment_status === "pago" ||
      record.payment_status === "parcial" ||
      Number(record.payment_amount) > 0;

    if (hasPayment) {
      await record.update({ consultation_days: null, num_consultations: 0 });
    } else {
      await record.destroy();
    }
  }

  for (const [monthYear, days] of Object.entries(daysByMonthYear)) {
    days.sort();
    const existingRecord = existingRecords.find(
      (record) => record.month_and_year === monthYear
    );

    const data = {
      consultation_days: days.join(", "),
      num_consultations: days.length,
    };

    // O valor da consulta fica congelado no mês; só meses novos pegam o
    // valor atual do cadastro (mudanças de valor são tratadas na edição)
    if (existingRecord) {
      if (existingRecord.consultation_fee == null) {
        data.consultation_fee = consultationFee;
      }
      await existingRecord.update(data);
    } else {
      await CustomersBillingRecords.create({
        customer_id: customerId,
        month_and_year: monthYear,
        consultation_fee: consultationFee,
        ...data,
      });
    }
  }
};

const recalculateAllConsultationDays = async () => {
  const customers = await CustomersBillingRecords.findAll({ attributes: ["customer_id"] });

  for (const customer of customers) {
    await updateConsultationDays(customer.customer_id);
  }
};

module.exports = { updateConsultationDays, recalculateAllConsultationDays };
