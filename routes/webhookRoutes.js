const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

router.post('/mercadopago', webhookController.handlePaymentNotification);
router.post('/payments', webhookController.handlePaymentNotification);

module.exports = router;
