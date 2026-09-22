const sequelize = require('../config/database');
const User = require('./User');
const Reservation = require('./Reservation');
const Venue = require('./Venue');
const Resource = require('./Resource');

User.hasMany(Reservation, { foreignKey: 'userId', as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Venue.hasMany(Reservation, { foreignKey: 'venueId', as: 'reservations' });
Reservation.belongsTo(Venue, { foreignKey: 'venueId', as: 'venue' });

Venue.hasMany(Resource, { foreignKey: 'venueId', as: 'resources' });
Resource.belongsTo(Venue, { foreignKey: 'venueId', as: 'venue' });

module.exports = {
  sequelize,
  User,
  Reservation,
  Venue,
  Resource,
};
