const { Op } = require('sequelize');
const { Reservation, Resource, Venue } = require('../models');

async function busyNames(reservation, field) {
  const rows = await Reservation.findAll({
    where: {
      venueId: reservation.venueId,
      date: reservation.date,
      time_slot: reservation.time_slot,
      status: 'confirmed',
      id: { [Op.ne]: reservation.id },
      [field]: { [Op.ne]: null },
    },
    attributes: [field],
  });
  return new Set(rows.map((row) => row[field]));
}

async function pick(reservation, kind, field) {
  const pool = await Resource.findAll({
    where: { venueId: reservation.venueId, kind, active: true },
    order: [['id', 'ASC']],
  });
  if (!pool.length) {
    return null;
  }
  const busy = await busyNames(reservation, field);
  const free = pool.find((item) => !busy.has(item.name));
  return free ? free.name : null;
}

/**
 * Asigna el primer vehículo e instructor libres de la sede para esa fecha y
 * franja. Se llama al acreditarse el pago, así el turno queda operativo sin
 * intervención manual. Si la sede se quedó sin cupo devuelve lo que encontró.
 */
async function assignForReservation(reservation) {
  if (!reservation || !reservation.venueId) {
    return { assigned_vehicle: null, assigned_instructor: null, complete: false };
  }

  const [vehicle, instructor] = await Promise.all([
    reservation.assigned_vehicle ? reservation.assigned_vehicle : pick(reservation, 'vehicle', 'assigned_vehicle'),
    reservation.assigned_instructor ? reservation.assigned_instructor : pick(reservation, 'instructor', 'assigned_instructor'),
  ]);

  if (vehicle !== reservation.assigned_vehicle || instructor !== reservation.assigned_instructor) {
    await reservation.update({
      assigned_vehicle: vehicle,
      assigned_instructor: instructor,
    });
  }

  return {
    assigned_vehicle: vehicle,
    assigned_instructor: instructor,
    complete: Boolean(vehicle && instructor),
  };
}

async function venueBySlugOrId(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  const raw = String(value).trim();
  const id = Number(raw);
  if (Number.isInteger(id) && id > 0 && String(id) === raw) {
    return Venue.findByPk(id);
  }
  return Venue.findOne({ where: { slug: raw } });
}

module.exports = { assignForReservation, venueBySlugOrId };
