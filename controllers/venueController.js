const { Venue, Resource } = require('../models');
const { availabilityFor } = require('../services/availability');
const { venueBySlugOrId } = require('../services/assignment');

const EDITABLE = ['name', 'address', 'zone', 'lat', 'lng', 'phone', 'requirements', 'slots', 'weekdays', 'slotCapacity', 'active'];

function present(venue, resources) {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    address: venue.address,
    zone: venue.zone,
    lat: venue.lat,
    lng: venue.lng,
    phone: venue.phone,
    requirements: venue.requirements,
    slots: venue.slots,
    weekdays: venue.weekdays,
    slotCapacity: venue.slotCapacity,
    active: venue.active,
    ...(resources
      ? {
        vehicles: resources.filter((item) => item.kind === 'vehicle').map((item) => item.name),
        instructors: resources.filter((item) => item.kind === 'instructor').map((item) => item.name),
      }
      : {}),
  };
}

const getVenues = async (req, res) => {
  try {
    const where = req.query.all === '1' ? {} : { active: true };
    const venues = await Venue.findAll({ where, order: [['zone', 'ASC'], ['name', 'ASC']] });

    return res.status(200).json({
      success: true,
      data: venues.map((venue) => present(venue)),
      message: 'Sedes obtenidas correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al obtener las sedes',
    });
  }
};

const getVenue = async (req, res) => {
  try {
    const venue = await venueBySlugOrId(req.params.slug);
    if (!venue) {
      return res.status(404).json({ success: false, data: null, message: 'Sede no encontrada' });
    }

    const resources = await Resource.findAll({
      where: { venueId: venue.id, active: true },
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: present(venue, resources),
      message: 'Sede obtenida correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al obtener la sede',
    });
  }
};

const getAvailability = async (req, res) => {
  try {
    const venue = await venueBySlugOrId(req.params.slug);
    if (!venue) {
      return res.status(404).json({ success: false, data: null, message: 'Sede no encontrada' });
    }

    const date = String(req.query.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Indicá la fecha en formato YYYY-MM-DD',
      });
    }

    return res.status(200).json({
      success: true,
      data: await availabilityFor(venue, date),
      message: 'Disponibilidad obtenida correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al obtener la disponibilidad',
    });
  }
};

const updateVenue = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, data: null, message: 'Sólo un admin puede editar sedes' });
    }

    const venue = await venueBySlugOrId(req.params.slug);
    if (!venue) {
      return res.status(404).json({ success: false, data: null, message: 'Sede no encontrada' });
    }

    const changes = {};
    EDITABLE.forEach((field) => {
      if (req.body[field] !== undefined) {
        changes[field] = req.body[field];
      }
    });
    await venue.update(changes);

    return res.status(200).json({
      success: true,
      data: present(venue),
      message: 'Sede actualizada correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Error al actualizar la sede',
    });
  }
};

module.exports = { getVenues, getVenue, getAvailability, updateVenue };
