const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

/* #swagger.tags = ['Auth'] */
router.post('/register', authController.register);

/* #swagger.tags = ['Auth'] */
router.post('/login', authController.login);
router.post('/storefront', authController.storefront);

module.exports = router;
