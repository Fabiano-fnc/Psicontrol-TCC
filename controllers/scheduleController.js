const { google } = require("googleapis");
const { Customer, Calendar, Event } = require("../models");
const { updateConsultationDays } = require("../utils/updateConsultationDays");

const TIME_ZONE = "America/Sao_Paulo";
const REPEAT_DAYS = { none: 0, weekly: 7, biweekly: 14 };
const MAX_OCCURRENCES = 26;

// Cliente do Google só deste usuário (o oauth2Client compartilhado pode
// estar com as credenciais de outra pessoa no meio de uma sincronização)
const googleClientFor = (user) => {
  const client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  client.setCredentials({
    access_token: user.access_token,
    refresh_token: user.refresh_token,
  });
  return google.calendar({ version: "v3", auth: client });
};

// Datas e horas "de parede" (sem fuso): o fuso vai separado para o Google
const pad = (n) => String(n).padStart(2, "0");
const toWallClock = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00`;

// Agenda consultas do paciente no Google Agenda (na agenda dele) e já as
// deixa vinculadas no banco
exports.scheduleConsultations = async (req, res) => {
  const user = req.user;
  const { customerId } = req.params;
  const {
    date,
    start_time,
    duration_minutes = 50,
    repeat = "none",
    occurrences = 1,
  } = req.body;

  // Formato e data real (2026-13-01 não vira janeiro do ano seguinte)
  const isRealDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date || "") &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  if (!isRealDate) {
    return res.status(400).json({ error: "Data inválida." });
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start_time || "")) {
    return res.status(400).json({ error: "Horário inválido." });
  }
  const duration = Number(duration_minutes);
  if (!Number.isInteger(duration) || duration < 15 || duration > 240) {
    return res.status(400).json({ error: "Duração inválida." });
  }
  if (!(repeat in REPEAT_DAYS)) {
    return res.status(400).json({ error: "Repetição inválida." });
  }
  const count = repeat === "none" ? 1 : Number(occurrences);
  if (!Number.isInteger(count) || count < 1 || count > MAX_OCCURRENCES) {
    return res
      .status(400)
      .json({ error: `Escolha de 1 a ${MAX_OCCURRENCES} consultas.` });
  }

  const customer = await Customer.findOne({
    where: { customer_id: customerId, user_id: user.user_id },
  });
  if (!customer) {
    return res.status(404).json({ error: "Paciente não encontrado." });
  }
  const calendar = customer.calendar_id
    ? await Calendar.findOne({
        where: {
          user_id: user.user_id,
          calendar_id: customer.calendar_id,
          enabled: true,
        },
      })
    : null;
  if (!calendar) {
    return res
      .status(400)
      .json({ error: "O paciente precisa estar em uma agenda ativa." });
  }

  const googleCalendar = googleClientFor(user);
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = start_time.split(":").map(Number);

  const created = [];
  let failure = null;
  for (let i = 0; i < count; i++) {
    const start = new Date(
      Date.UTC(year, month - 1, day + i * REPEAT_DAYS[repeat], hour, minute)
    );
    const end = new Date(start.getTime() + duration * 60000);
    try {
      const response = await googleCalendar.events.insert({
        calendarId: customer.calendar_id,
        requestBody: {
          summary: customer.customer_name,
          description: "Consulta agendada pelo Psicontrol",
          start: { dateTime: toWallClock(start), timeZone: TIME_ZONE },
          end: { dateTime: toWallClock(end), timeZone: TIME_ZONE },
        },
      });
      const eventDate = toWallClock(start).slice(0, 10);
      await Event.create({
        event_name: customer.customer_name,
        date: eventDate,
        status: "confirmed",
        calendar_id: customer.calendar_id,
        user_id: user.user_id,
        customer_id: customer.customer_id,
        google_event_id: response.data.id,
      });
      created.push(eventDate);
    } catch (error) {
      console.error("Erro ao criar consulta no Google:", error.message);
      failure =
        error.code === 401 || error.message?.includes("invalid_grant")
          ? "Sua conexão com o Google expirou. Entre novamente com o Google."
          : "O Google Agenda recusou a criação da consulta.";
      break;
    }
  }

  if (created.length > 0) await updateConsultationDays(customer.customer_id);

  if (failure) {
    return res.status(created.length ? 207 : 502).json({
      error: created.length
        ? `${failure} ${created.length} de ${count} consultas foram criadas.`
        : failure,
      created,
    });
  }
  res.status(201).json({ created });
};
