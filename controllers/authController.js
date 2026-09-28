const { google } = require("googleapis");
const { User, Calendar, Event, Customer } = require("../models");
const Fuse = require("fuse.js");
const { Op } = require("sequelize");
const { listCalendars } = require("../services/calendarService");
const { parseISO, format } = require("date-fns");
const { oauth2Client, authUrl } = require("../config/oauth2");
const { saveTokens } = require("./tokenController");
const { updateConsultationDays } = require("../utils/updateConsultationDays");
const calendar = google.calendar({ version: "v3", auth: oauth2Client });
const bcrypt = require("bcrypt");
const CLIENT_TIMEZONE = "America/Sao_Paulo";

const fetchGoogleCalendars = async (accessToken) => {
  oauth2Client.setCredentials({ access_token: accessToken });

  try {
    const response = await calendar.calendarList.list();
    return response.data.items;
  } catch (error) {}
};

// Período buscado no Google: de 2 meses atrás até 2 meses à frente
const syncWindow = () => {
  const timeMin = new Date();
  const timeMax = new Date();
  timeMin.setMonth(timeMin.getMonth() - 2);
  timeMax.setMonth(timeMax.getMonth() + 2);
  return { timeMin, timeMax };
};

const fetchGoogleCalendarEvents = async (accessToken, calendarId) => {
  oauth2Client.setCredentials({ access_token: accessToken });

  const { timeMin, timeMax } = syncWindow();

  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items.map((event) => ({
    ...event,
    start: {
      ...event.start,
      dateTime: event.start.dateTime
        ? new Date(event.start.dateTime).toISOString()
        : null,
    },
  }));
};

// Usuários com sincronização em andamento: evita dois ciclos simultâneos
// (cron, login e sync manual) criando o mesmo evento em duplicidade
const syncingUsers = new Set();

const syncGoogleCalendarWithDatabase = async (userId, accessToken) => {
  if (syncingUsers.has(userId)) return;
  syncingUsers.add(userId);

  try {
    if (!userId || !accessToken) {
      throw new Error("userId ou accessToken ausente na sincronização");
    }

    oauth2Client.setCredentials({ access_token: accessToken });
    const calendars = await fetchGoogleCalendars(accessToken);
    if (!calendars) return;

    for (const calendar of calendars) {
      const calendarId = calendar.id;

      const dbCalendar = await Calendar.findOne({
        where: { calendar_id: calendarId, user_id: userId },
      });

      if (!dbCalendar) {
        await Calendar.create({
          calendar_id: calendarId,
          calendar_name: calendar.summary,
          user_id: userId,
          enabled: false,
        });
        continue;
      }

      if (calendar.summary && dbCalendar.calendar_name !== calendar.summary) {
        await dbCalendar.update({ calendar_name: calendar.summary });
      }

      // Só importa eventos dos calendários que o usuário escolheu
      if (!dbCalendar.enabled) continue;

      const events = await fetchGoogleCalendarEvents(accessToken, calendarId);

      // Um evento só pode ser ligado a pacientes deste usuário e deste calendário
      const patients = await Customer.findAll({
        where: { user_id: userId, calendar_id: calendarId },
      });

      const fuse = new Fuse(patients, {
        keys: ["customer_name"],
        threshold: 0.3,
      });

      const processedEvents = new Set();
      const affectedCustomers = new Set();

      for (const event of events) {
        const summary = event.summary?.trim() || "Evento Sem Título";

        const uniqueKey = `${summary}_${
          event.start?.date || event.start?.dateTime?.split("T")[0]
        }`;
        if (processedEvents.has(uniqueKey)) {
          continue;
        }
        processedEvents.add(uniqueKey);

        const eventExists = await Event.findOne({
          where: { google_event_id: event.id, user_id: userId },
        });

        const cleanedSummary = summary.replace(/^Paciente\s*-\s*/, "");

        // Vínculo feito à mão (ou em sincronização anterior) tem prioridade
        let customerId = eventExists?.customer_id || null;
        if (!customerId) {
          const result = fuse.search(cleanedSummary);
          customerId = result.length > 0 ? result[0].item.customer_id : null;
        }

        let startDate = null,
          startTime = null,
          endTime = null;

        if (event.start && event.start.dateTime) {
          const dateTime = event.start.dateTime;
          startDate = format(parseISO(dateTime), "yyyy-MM-dd");
          startTime = dateTime.split("T")[1].split(":").slice(0, 2).join(":");

          if (event.end && event.end.dateTime) {
            endTime = event.end.dateTime
              .split("T")[1]
              .split(":")
              .slice(0, 2)
              .join(":");
          } else {
            endTime = startTime;
          }
        } else if (event.start && event.start.date) {
          startDate = event.start.date;
        }

        const eventData = {
          event_name: event.summary,
          date: startDate,
          status: event.status,
          calendar_id: calendarId,
          start_time: startTime,
          end_time: endTime,
          user_id: userId,
          customer_id: customerId,
        };

        if (eventExists) {
          await eventExists.update(eventData);
        } else {
          await Event.create({ ...eventData, google_event_id: event.id });
        }

        if (customerId) affectedCustomers.add(customerId);
      }

      const cancelledCustomers = await deleteNonexistentGoogleEvents(
        events,
        calendarId,
        userId
      );
      cancelledCustomers.forEach((id) => affectedCustomers.add(id));

      for (const customerId of affectedCustomers) {
        await updateConsultationDays(customerId);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    syncingUsers.delete(userId);
  }
};

// Marca como canceladas as consultas que sumiram do Google e devolve
// os pacientes afetados, para recalcular o faturamento deles.
const deleteNonexistentGoogleEvents = async (events, calendarId, userId) => {
  const affected = new Set();
  try {
    const googleEventIds = new Set(events.map((event) => event.id));
    // Só confere eventos dentro do período buscado; os mais antigos não
    // vieram do Google e não podem ser considerados apagados
    const { timeMin, timeMax } = syncWindow();
    const allDbEvents = await Event.findAll({
      where: {
        calendar_id: calendarId,
        user_id: userId,
        date: {
          [Op.between]: [
            format(timeMin, "yyyy-MM-dd"),
            format(timeMax, "yyyy-MM-dd"),
          ],
        },
      },
    });

    for (const dbEvent of allDbEvents) {
      if (
        !googleEventIds.has(dbEvent.google_event_id) &&
        dbEvent.status !== "cancelado"
      ) {
        await dbEvent.update({ status: "cancelado" });
        if (dbEvent.customer_id) affected.add(dbEvent.customer_id);
      }
    }
  } catch (error) {
    console.error("Erro ao marcar eventos cancelados:", error);
  }
  return affected;
};

const initiateGoogleAuth = (req, res) => {
  res.json({ authUrl });
};

async function handleOAuth2Callback(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Código de autorização ausente.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials({ access_token: tokens.access_token });

    const calendars = await listCalendars();

    let oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      return res.status(400).json({
        statusCode: 400,
        message: "Email não encontrado.",
      });
    }

    await saveTokens(
      data.name,
      data.email,
      tokens.access_token,
      tokens.refresh_token
    );

    // Reaproveita a sessão que já existe para que entrar em um aparelho
    // (ex.: notebook) não desconecte os outros (ex.: celular)
    const user = await User.findOne({ where: { user_email: data.email } });
    if (!user.autentication_token) {
      user.autentication_token = bcrypt.hashSync(new Date().toISOString(), 10);
      await user.save();
    }
    const authenticationToken = user.autentication_token;

    await syncGoogleCalendarWithDatabase(
      user.user_id,
      tokens.access_token
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/token?token=${authenticationToken}`
    );
  } catch (error) {
    console.error("Erro no callback OAuth:", error);
    res.status(500).send("Erro ao concluir a autenticação.");
  }
}

const checkAndHandleCalendars = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const enabledCalendars = await Calendar.findAll({
      where: { user_id: userId, enabled: true },
    });

    if (!enabledCalendars || enabledCalendars.length === 0) {
      console.log("Nenhum calendário habilitado. Redirecionando para seleção.");
      return res.json({ redirect: "/select-calendar" });
    }

    const calendarIds = enabledCalendars.map(
      (calendar) => calendar.calendar_id
    );
    console.log("Calendários habilitados encontrados:", calendarIds);

    return res.json({
      redirect: `/create-event-form?calendarIds=${calendarIds.join(",")}`,
    });
  } catch (error) {
    console.error("Erro ao verificar calendários:", error);
    res.status(500).json({ error: "Erro interno ao verificar calendários." });
  }
};

module.exports = {
  handleOAuth2Callback,
  initiateGoogleAuth,
  syncGoogleCalendarWithDatabase,
  fetchGoogleCalendarEvents,
  fetchGoogleCalendars,
  checkAndHandleCalendars,
};
