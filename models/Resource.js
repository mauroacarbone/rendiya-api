const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Vehículos e instructores disponibles por sede. Se usan para la asignación
 * automática cuando el pago de una reserva queda acreditado.
 */
const Resource = sequelize.define(
  'Resource',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kind: {
      type: DataTypes.ENUM('vehicle', 'instructor'),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'resources',
  }
);

module.exports = Resource;
