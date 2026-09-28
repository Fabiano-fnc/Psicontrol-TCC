const {
  Customer,
  CustomersBillingRecords,
  income,
  Calendar,
} = require("../models");
const { Op } = require("sequelize");

const HISTORY_MONTHS = 6;

const countDays = (consultationDays) =>
  consultationDays
    ? consultationDays.split(",").filter((day) => day.trim()).length
    : 0;

// Os `count` meses que terminam em (year, month), do mais antigo ao mais novo
const lastMonths = (year, month, count) => {
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(year, month - 1 - i, 1);
    months.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }
  return months;
};

const pad = (n) => String(n).padStart(2, "0");

// Indicadores do Dashboard: recebido x em aberto do mês e histórico de
// receita, despesa e lucro dos últimos 6 meses. Segue as mesmas regras de
// getBillingRecordsByMonthAndYear (só calendários habilitados; lançamentos
// "Geral" sempre entram), para os números baterem com os cards.
exports.getOverview = async (req, res) => {
  const userId = req.user.user_id;
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(year) || year < 2000 || year > 2100) {
    return res
      .status(400)
      .json({ error: "Informe 'month' (1-12) e 'year' válidos." });
  }

  const enabledCalendars = await Calendar.findAll({
    where: { user_id: userId, enabled: true },
    attributes: ["calendar_id"],
  });
  const enabledCalendarIds = enabledCalendars.map((cal) => cal.calendar_id);

  const months = lastMonths(year, month, HISTORY_MONTHS);
  const billingKeys = months.map((m) => `${m.year}-${pad(m.month)}`);
  const incomeKeys = months.map(
    (m) => `${pad(m.month)}/${String(m.year).slice(-2)}`
  );

  const billingRecords = await CustomersBillingRecords.findAll({
    where: { month_and_year: billingKeys },
    attributes: [
      "month_and_year",
      "consultation_days",
      "consultation_fee",
      "payment_status",
      "payment_amount",
    ],
    include: [
      {
        model: Customer,
        where: { user_id: userId, calendar_id: enabledCalendarIds },
        attributes: [],
      },
    ],
  });

  const incomes = await income.findAll({
    where: {
      user_id: userId,
      month_year: incomeKeys,
      [Op.or]: [{ calendar_id: null }, { calendar_id: enabledCalendarIds }],
    },
    attributes: ["month_year", "type", "value"],
  });

  const history = months.map((m, i) => {
    let consultations = 0;
    let received = 0;
    const patients = { paid: 0, partial: 0, open: 0 };

    billingRecords
      .filter((record) => record.month_and_year === billingKeys[i])
      .forEach((record) => {
        const total =
          countDays(record.consultation_days) *
          parseFloat(record.consultation_fee || 0);
        consultations += total;
        if (record.payment_status === "pago") {
          received += total;
          patients.paid += 1;
        } else if (record.payment_status === "parcial") {
          received += Math.min(parseFloat(record.payment_amount || 0), total);
          patients.partial += 1;
        } else if (total > 0) {
          patients.open += 1;
        }
      });

    let otherRevenue = 0;
    let expense = 0;
    incomes
      .filter((entry) => entry.month_year === incomeKeys[i])
      .forEach((entry) => {
        const value = parseFloat(entry.value || 0);
        if (entry.type === "revenue") otherRevenue += value;
        else if (entry.type === "expense") expense += value;
      });

    const revenue = consultations + otherRevenue;
    return {
      year: m.year,
      month: m.month,
      consultations,
      received,
      open: consultations - received,
      patients,
      revenue,
      expense,
      profit: revenue - expense,
    };
  });

  const current = history[history.length - 1];
  const round = (n) => Math.round(n * 100) / 100;

  res.status(200).json({
    billing: {
      total: round(current.consultations),
      received: round(current.received),
      open: round(current.open),
      openPercent: current.consultations
        ? round((current.open / current.consultations) * 100)
        : 0,
      patients: current.patients,
    },
    history: history.map((h) => ({
      year: h.year,
      month: h.month,
      revenue: round(h.revenue),
      expense: round(h.expense),
      profit: round(h.profit),
    })),
  });
};
