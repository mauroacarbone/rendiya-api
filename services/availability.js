const { Op } = require('sequelize');
const { Reservation } = require('../models');

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function weekdayOf(date) {
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getDay();
}

function venueOpensOn(venue, date) {
  const weekday = weekdayOf(date);
  if (weekday === null) return false;
  const weekdays = venue.weekdays || [];
  return weekdays.length ? weekdays.includes(weekday) : true;
}

async function takenBySlot(venue, date) {
  const rows = await Reservation.findAll({
    where: {
      venueId: venue.id,
      date: String(date).slice(0, 10),
      status: { [Op.in]: ['pending', 'confirmed'] },
    },
    attributes: ['time_slot'],
  });

  return rows.reduce((acc, row) => {
    acc[row.time_slot] = (acc[row.time_slot] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Turnos de una sede para una fecha, con el cupo ya tomado por otras reservas.
 */
async function availabilityFor(venue, date) {
  const open = venueOpensOn(venue, date);
  const taken = open ? await takenBySlot(venue, date) : {};
  const capacity = venue.slotCapacity || 1;

  return {
    venue: venue.slug,
    date: String(date).slice(0, 10),
    open,
    weekday: weekdayOf(date) === null ? null : DAY_NAMES[weekdayOf(date)],
    capacity,
    slots: (venue.slots || []).map((slot) => {
      const used = taken[slot] || 0;
      return {
        time_slot: slot,
        taken: used,
        free: Math.max(0, capacity - used),
        available: open && used < capacity,
      };
    }),
  };
}

/**
 * Valida que el turno exista en la sede, que el día esté habilitado y que
 * quede cupo libre. Devuelve un mensaje de error o `null` si se puede reservar.
 */
async function slotRejection(venue, date, timeSlot) {
  if (!venueOpensOn(venue, date)) {
    const days = (venue.weekdays || []).map((day) => DAY_NAMES[day]).join(', ');
    return `${venue.name} no toma exámenes ese día. Días habilitados: ${days || 'consultar'}.`;
  }

  const slots = venue.slots || [];
  if (slots.length && !slots.includes(timeSlot)) {
    return `La franja ${timeSlot} no existe en ${venue.name}. Disponibles: ${slots.join(', ')}.`;
  }

  const taken = await takenBySlot(venue, date);
  if ((taken[timeSlot] || 0) >= (venue.slotCapacity || 1)) {
    return `No quedan turnos libres en ${venue.name} para ${timeSlot}.`;
  }

  return null;
}

module.exports = { availabilityFor, slotRejection, venueOpensOn, weekdayOf, DAY_NAMES };
