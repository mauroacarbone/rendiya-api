const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Sede de examen. Los campos de lista (requisitos, horarios, días) se guardan
 * como texto JSON para que el modelo funcione igual en SQLite y en MySQL.
 */
function jsonList(field) {
  return {
    get() {
      const raw = this.getDataValue(field);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue(field, JSON.stringify(Array.isArray(value) ? value : []));
    }
  };
}

const Venue = sequelize.define(
  'Venue',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    zone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'CABA',
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requirements: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      ...jsonList('requirements'),
    },
    slots: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      ...jsonList('slots'),
    },
    weekdays: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      ...jsonList('weekdays'),
    },
    slotCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'venues',
  }
);

module.exports = Venue;
