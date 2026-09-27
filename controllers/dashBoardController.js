const {
  Customer,
  CustomersBillingRecords,
  income,
  Calendar,
} = require("../models");
const { Op } = require("sequelize");

exports.updatePartialPayment = async (req, res) => {
  try {
    const { customer_id, month_and_year, payment_amount } = req.body;

    const billingRecord = await CustomersBillingRecords.findOne({
      where: {
        customer_id,
        month_and_year,
      },
    });

    if (!billingRecord) {
      return res.status(404).json({
        error: "Registro de faturamento não encontrado.",
      });
    }

    await billingRecord.update({
      payment_amount,
      payment_status: "parcial",
    });

    return res.status(200).json({
      message: "Pagamento parcial salvo com sucesso.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao salvar pagamento parcial.",
    });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { customer_id, month_and_year } = req.body;

    const billingRecord = await CustomersBillingRecords.findOne({
      where: {
        customer_id,
        month_and_year,
      },
    });

    if (!billingRecord) {
      return res.status(404).json({
        error: "Registro de faturamento não encontrado.",
      });
    }

    await billingRecord.update({
      payment_status: "pago",
      payment_date: new Date(),
    });

    return res.status(200).json({
      message: "Pagamento confirmado com sucesso.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao confirmar pagamento.",
    });
  }
};

exports.markInvoiceSent = async (req, res) => {
  try {
    const { customer_id, month_and_year } = req.body;

    const billingRecord = await CustomersBillingRecords.findOne({
      where: {
        customer_id,
        month_and_year,
      },
    });

    if (!billingRecord) {
      return res.status(404).json({
        error: "Registro não encontrado.",
      });
    }

    await billingRecord.update({
      sending_invoice: true,
    });

    return res.status(200).json({
      message: "Cobrança marcada como enviada.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Erro ao atualizar cobrança.",
    });
  }
};

exports.getBillingRecordsByMonthAndYear = async (req, res) => {
  const { month, year } = req.query;

  if (!req.user) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  const userId = req.user.user_id;

  if (!month || !year) {
    return res
      .status(400)
      .json({ error: "Os campos 'month' e 'year' são obrigatórios." });
  }

  // Só entram pacientes dos calendários habilitados no momento
  const enabledCalendars = await Calendar.findAll({
    where: { user_id: userId, enabled: true },
    attributes: ["calendar_id"],
  });
  const enabledCalendarIds = enabledCalendars.map((cal) => cal.calendar_id);

  const billingRecords = await CustomersBillingRecords.findAll({
    where: {
      month_and_year: { [Op.like]: `${year}-${month.padStart(2, "0")}%` },
    },
    include: [
      {
        model: Customer,
        where: { user_id: userId, calendar_id: enabledCalendarIds },
        attributes: ["customer_name", "customer_id", "calendar_id"],
      },
    ],
  });

  const totalConsultations = billingRecords.reduce((acc, record) => {
    const daysArray = record.consultation_days
      ? record.consultation_days.split(",").map((day) => day.trim())
      : [];
    return acc + daysArray.length;
  }, 0);

  const totalRevenue = billingRecords.reduce((acc, record) => {
    const daysArray = record.consultation_days
      ? record.consultation_days.split(",").map((day) => day.trim())
      : [];
    const numConsultations = daysArray.length;
    return acc + (record.consultation_fee || 0) * numConsultations;
  }, 0);

  const monthYear = `${month}/${year.slice(-2)}`;
  const revenues = await income.findAll({
    where: {
      user_id: userId,
      type: "revenue",
      month_year: monthYear,
    },
  });

  const expenses = await income.findAll({
    where: {
      user_id: userId,
      type: "expense",
      month_year: monthYear,
    },
  });

  

  const totalRevenueFromIncome = revenues.reduce(
    (acc, revenue) => acc + parseFloat(revenue.value || 0),
    0
  );
  const totalExpenseFromIncome = expenses.reduce(
    (acc, expense) => acc + parseFloat(expense.value || 0),
    0
  );
  const netRevenue =
    totalRevenue + totalRevenueFromIncome - totalExpenseFromIncome;
  const netTime = totalConsultations
    ? (netRevenue / totalConsultations).toFixed(2)
    : "0.00";

  const formattedRecords = billingRecords.map((record) => {
    const daysArray = record.consultation_days
      ? record.consultation_days.split(",").map((day) => day.trim())
      : [];
    const numConsultations = daysArray.length;
  
    const consultationFee = parseFloat(record.consultation_fee || 0);
    const totalConsultationFee = numConsultations * consultationFee;  
    return {
      ...record.toJSON(),
      total_consultation_fee: totalConsultationFee > 0 ? totalConsultationFee.toFixed(2) : "0.00",
    };
  });

  

  

  res.status(200).json({
    billingRecords: formattedRecords,
    totalConsultations,
    totalRevenue: parseFloat(totalRevenue).toFixed(2),
    netRevenue: parseFloat(netRevenue).toFixed(2),
    netTime,
  });

  

  
};
