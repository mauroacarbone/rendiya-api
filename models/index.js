const sequelize = require('../config/database');
const User = require('./User');
const Reservation = require('./Reservation');

User.hasMany(Reservation, { foreignKey: 'userId', as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Reservation,
};
