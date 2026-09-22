const { Reservation, User, Venue } = require('../models');
const { emitReservationChange } = require('../realtime');
const { normalizeAddons } = require('../services/addons');
const { slotRejection } = require('../services/availability');
const { venueBySlugOrId } = require('../services/assignment');

const reservationInclude = [
  { model: User, as: 'user' },
  { model: Venue, as: 'venue' },
];

const notify = (req, reservation) => {
  emitReservationChange(req.app.get('io'), reservation);
};

const canAccessReservation = (reqUser, reservation) =>
  reqUser.role === 'admin' || reservation.userId === reqUser.id;

const getReservations = async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };

    const reservations = await Reservation.findAll({
      where,
      include: reservationInclude,
      order: [['date', 'ASC'], ['time_slot', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: reservations,
      message: 'Reservas obtenidas correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al obtener reservas',
    });
  }
};

const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: reservationInclude,
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Reserva no encontrada',
      });
    }

    if (!canAccessReservation(req.user, reservation)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'No autorizado para ver esta reserva',
      });
    }

    return res.status(200).json({
      success: true,
      data: reservation,
      message: 'Reserva obtenida correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al obtener la reserva',
    });
  }
};

const createReservation = async (req, res) => {
  try {
    const { date, time_slot, status } = req.body;

    if (!date || !time_slot) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'date y time_slot son obligatorios',
      });
    }

    const venue = await venueBySlugOrId(req.body.venue_slug ?? req.body.venueId);
    if ((req.body.venue_slug ?? req.body.venueId) && !venue) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'La sede indicada no existe',
      });
    }

    if (venue) {
      const rejection = await slotRejection(venue, date, time_slot);
      if (rejection) {
        return res.status(409).json({ success: false, data: null, message: rejection });
      }
    }

    const { addons, total: addonsTotal } = normalizeAddons(req.body.addons);
    const amount = Number(req.body.amount);

    const reservation = await Reservation.create({
      date,
      time_slot,
      status: status || 'pending',
      userId: req.user.id,
      venueId: venue ? venue.id : null,
      addons,
      amount: Number.isFinite(amount) && amount >= 0 ? amount : addonsTotal,
    });

    notify(req, reservation);
    await reservation.reload({ include: reservationInclude });

    return res.status(201).json({
      success: true,
      data: reservation,
      message: 'Reserva creada correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al crear la reserva',
    });
  }
};

const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, { include: reservationInclude });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Reserva no encontrada',
      });
    }

    if (!canAccessReservation(req.user, reservation)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'No autorizado para modificar esta reserva',
      });
    }

    const { date, time_slot, status } = req.body;
    const venue = await venueBySlugOrId(req.body.venue_slug ?? req.body.venueId);
    const amount = Number(req.body.amount);
    const changes = {
      date: date ?? reservation.date,
      time_slot: time_slot ?? reservation.time_slot,
      status: status ?? reservation.status,
    };

    if (venue) {
      changes.venueId = venue.id;
    }
    if (req.body.addons !== undefined) {
      changes.addons = normalizeAddons(req.body.addons).addons;
    }
    if (Number.isFinite(amount) && amount >= 0) {
      changes.amount = amount;
    }

    const target = venue || reservation.venue;
    const movedSlot = changes.date !== reservation.date
      || changes.time_slot !== reservation.time_slot
      || (venue && venue.id !== reservation.venueId);

    if (target && movedSlot) {
      const rejection = await slotRejection(target, changes.date, changes.time_slot);
      if (rejection) {
        return res.status(409).json({ success: false, data: null, message: rejection });
      }
    }

    await reservation.update(changes);

    notify(req, reservation);
    await reservation.reload({ include: reservationInclude });

    return res.status(200).json({
      success: true,
      data: reservation,
      message: 'Reserva actualizada correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al actualizar la reserva',
    });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Reserva no encontrada',
      });
    }

    if (!canAccessReservation(req.user, reservation)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'No autorizado para eliminar esta reserva',
      });
    }

    const snapshot = reservation.get({ plain: true });
    await reservation.destroy();
    notify(req, { ...snapshot, status: 'cancelled' });

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Reserva eliminada correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al eliminar la reserva',
    });
  }
};

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
};
