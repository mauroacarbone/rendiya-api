const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const venueController = require('../controllers/venueController');

const router = express.Router();

/* #swagger.tags = ['Venues'] */
router.get('/', venueController.getVenues);

/* #swagger.tags = ['Venues'] */
router.get('/:slug', venueController.getVenue);

/* #swagger.tags = ['Venues'] */
router.get('/:slug/availability', venueController.getAvailability);

/* #swagger.tags = ['Venues'] */
/* #swagger.security = [{ bearerAuth: [] }] */
router.put('/:slug', authMiddleware, venueController.updateVenue);

module.exports = router;
