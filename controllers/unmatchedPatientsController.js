const { Op } = require("sequelize");
const { Event, Calendar, Customer } = require("../models");

exports.getUnmatchedPatients = async (req, res, next) => {

  const enabledCalendars = await Calendar.findAll({
    where: {
      user_id: req.user.user_id,
      enabled: true,
    },
    attributes: ['calendar_id'],
  })

  const calendarIds = enabledCalendars.map((calendar) => calendar.calendar_id );

  if(calendarIds.length === 0 ){
    return res.status(200).json({
      message: "Nenhum calendário sincronizado",
      unmatchedEvents: [],
    })
  }

  const unmatchedEvents = await Event.findAll({
    where: {
      user_id: req.user.user_id,
      customer_id: null,
      calendar_id: calendarIds,
      // Eventos apagados/cancelados no Google não aparecem mais na lista
      status: { [Op.or]: [{ [Op.notIn]: ["cancelado", "cancelled"] }, null] },
    },
    attributes: ['customers_id', 'event_name', 'date', 'google_event_id', 'calendar_id'],
  });

  // Possível duplicado: no mesmo dia, um evento com o mesmo nome já está
  // vinculado a um paciente em outra agenda
  const dates = [...new Set(unmatchedEvents.map((event) => event.date).filter(Boolean))];
  const linkedSameDay = dates.length
    ? await Event.findAll({
        where: {
          user_id: req.user.user_id,
          customer_id: { [Op.ne]: null },
          date: dates,
        },
        attributes: ["event_name", "date", "calendar_id"],
        include: [
          { model: Customer, attributes: ["customer_id", "customer_name"] },
        ],
      })
    : [];
  const calendarNames = (
    await Calendar.findAll({
      where: { user_id: req.user.user_id },
      attributes: ["calendar_id", "calendar_name"],
    })
  ).reduce((acc, cal) => ({ ...acc, [cal.calendar_id]: cal.calendar_name }), {});

  const normalize = (text) => (text || "").trim().toLowerCase();
  const findDuplicate = (event) => {
    const match = linkedSameDay.find(
      (linked) =>
        linked.date === event.date &&
        linked.calendar_id !== event.calendar_id &&
        normalize(linked.event_name) === normalize(event.event_name)
    );
    if (!match) return null;
    return {
      customer_id: match.Customer?.customer_id,
      customer_name: match.Customer?.customer_name,
      calendar_name: calendarNames[match.calendar_id] || "outra agenda",
    };
  };

  const response = unmatchedEvents.map(event => ({
    google_event_id: event.google_event_id,
    customers_id: event.customers_id,
    name: event.event_name,
    date: event.date,
    calendar_id: event.calendar_id,
    calendar_name: calendarNames[event.calendar_id] || null,
    duplicate_of: findDuplicate(event),
  }));

  res.json(response);
};

