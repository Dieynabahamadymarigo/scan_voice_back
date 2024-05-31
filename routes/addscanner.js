const express = require('express');
const addscannerController = require('../controllers/addscanner');

const router = express.Router();

router.post('/scanner', addscannerController.scanner)

module.exports = router;
