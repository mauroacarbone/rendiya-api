const { sequelize, Reservation, Venue, Resource } = require('./models');
const venueData = require('./data/venues.json');

/**
 * `sequelize.sync()` crea tablas nuevas pero no agrega columnas a las que ya
 * existen. Las reservas creadas antes de las sedes y los add-ons necesitan ese
 * alta manual para no perder los datos guardados.
 */
async function ensureReservationColumns() {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable(Reservation.getTableName());
  const attributes = Reservation.getAttributes();
  const pending = ['venueId', 'addons', 'amount', 'assigned_vehicle', 'assigned_instructor']
    .filter((column) => !table[column]);

  for (const column of pending) {
    await queryInterface.addColumn(Reservation.getTableName(), column, attributes[column]);
  }

  return pending;
}

async function seedVenues() {
  for (const venue of venueData.venues) {
    const [row] = await Venue.findOrCreate({
      where: { slug: venue.slug },
      defaults: {
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
      },
    });

    const pool = [
      ...venue.vehicles.map((name) => ({ kind: 'vehicle', name })),
      ...venue.instructors.map((name) => ({ kind: 'instructor', name })),
    ];

    for (const item of pool) {
      await Resource.findOrCreate({
        where: { venueId: row.id, kind: item.kind, name: item.name },
        defaults: { venueId: row.id, kind: item.kind, name: item.name },
      });
    }
  }
}

async function bootstrap() {
  await ensureReservationColumns();
  await seedVenues();
}

module.exports = { bootstrap, ensureReservationColumns, seedVenues };
