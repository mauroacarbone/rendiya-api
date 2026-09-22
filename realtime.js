const jwt = require('jsonwebtoken');

const EVENT = 'reservation_updated';

function userRoom(userId) {
  return `user_${userId}`;
}

function attachRealtime(io) {
  io.use((socket, next) => {
    const token = (socket.handshake.auth && socket.handshake.auth.token)
      || socket.handshake.query.token;
    if (!token) {
      return next(new Error('unauthorized'));
    }
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.user.id));
    if (socket.user.role === 'admin') {
      socket.join('admin_dashboard');
    }
  });
}

function livePayload(reservation) {
  const row = reservation && typeof reservation.get === 'function'
    ? reservation.get({ plain: true })
    : reservation;
  if (!row) {
    return null;
  }
  const updatedAt = row.updatedAt
    ? new Date(row.updatedAt).toISOString()
    : new Date().toISOString();
  return {
    reservationId: row.id,
    status: row.status,
    updatedAt,
  };
}

function emitReservationChange(io, reservation) {
  if (!io) {
    return;
  }
  const payload = livePayload(reservation);
  if (!payload) {
    return;
  }
  const row = reservation && typeof reservation.get === 'function'
    ? reservation.get({ plain: true })
    : reservation;
  io.to(userRoom(row.userId)).emit(EVENT, payload);
  io.to('admin_dashboard').emit(EVENT, payload);
}

module.exports = { attachRealtime, emitReservationChange, livePayload, EVENT };
