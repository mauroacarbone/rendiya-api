const { Reservation, User } = require('../models');
const { emitReservationChange } = require('../realtime');

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
      include: [{ model: User, as: 'user' }],
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
      include: [{ model: User, as: 'user' }],
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

    const reservation = await Reservation.create({
      date,
      time_slot,
      status: status || 'pending',
      userId: req.user.id,
    });

    notify(req, reservation);

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
        message: 'No autorizado para modificar esta reserva',
      });
    }

    const { date, time_slot, status } = req.body;
    await reservation.update({
      date: date ?? reservation.date,
      time_slot: time_slot ?? reservation.time_slot,
      status: status ?? reservation.status,
    });

    notify(req, reservation);

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
