const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const reservationController = require('../controllers/reservationController');

const router = express.Router();

router.use(authMiddleware);

/* #swagger.tags = ['Reservations'] */
/* #swagger.security = [{ bearerAuth: [] }] */
router.get('/', reservationController.getReservations);

/* #swagger.tags = ['Reservations'] */
/* #swagger.security = [{ bearerAuth: [] }] */
router.get('/:id', reservationController.getReservationById);

/* #swagger.tags = ['Reservations'] */
/* #swagger.security = [{ bearerAuth: [] }] */
router.post('/', reservationController.createReservation);

/* #swagger.tags = ['Reservations'] */
/* #swagger.security = [{ bearerAuth: [] }] */
router.put('/:id', reservationController.updateReservation);

/* #swagger.tags = ['Reservations'] */
/* #swagger.security = [{ bearerAuth: [] }] */
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;
