const express = require('express');
const scanController = require('../controllers/scan');

const router = express.Router();

router.get('/scan', scanController.scan)

module.exports = router;
