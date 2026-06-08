const { Event } = require("../models/eventModel");
const { CustomersBillingRecords } = require("../models");

const updateBillingFromEvent = async (event) => {
  if (!event.customer_id || !event.date) return;

  const [year, month, day] = event.date.split("-");
  const monthAndYear = `${year}-${month}`;

  const billing = await CustomersBillingRecords.findOne({
    where: {
      customer_id: event.customer_id,
      month_and_year: monthAndYear,
    },
  });

  if (!billing) {
    await CustomersBillingRecords.create({
      customer_id: event.customer_id,
      month_and_year: monthAndYear,
      consultation_days: day,
    });
    return;
  }

  const days = billing.consultation_days
    ? billing.consultation_days.split(",").map(d => d.trim())
    : [];

  if (!days.includes(day)) {
    days.push(day);
    await billing.update({
      consultation_days: days.join(", "),
    });
  }
};


exports.createEvent = async (event) => {
  try {
    return await Event.create(event);
  } catch (error) {}
};

exports.eventExists = async (googleEventId) => {
  try {
    return await Event.findOne({ where: { google_event_id: googleEventId } });
  } catch (error) {}
};

exports.deleteEventById = async (customers_id) => {
  try {
    const result = await Event.destroy({
      where: { customers_id },
    });
    return result;
  } catch (error) {

  }
};

exports.cancelEventByGoogleId = async (googleEventId) => {
  try {
    const result = await Event.update(
      { status: "cancelado" },
      { where: { google_event_id: googleEventId } }
    );
  } catch (error) {}
};

exports.saveEvent = async (eventData) => {
  try {
    const event = await Event.create(eventData);
    await updateBillingFromEvent(event);
    return event;
  } catch (error) {
    throw error;
  }
};


exports.updateEvent = async (eventData) => {
  try {
    await Event.update(eventData, {
      where: { google_event_id: eventData.google_event_id },
    });

    const event = await Event.findOne({
      where: { google_event_id: eventData.google_event_id },
    });

    await updateBillingFromEvent(event);
  } catch (error) {
    throw error;
  }
};
