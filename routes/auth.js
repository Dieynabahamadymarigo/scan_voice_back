const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();

// Route pour l'inscription
router.post('/register', authController.register);

// Route pour la connexion
router.post('/login', authController.login);

//route pour la réinitialisation de mot de passe
router.post('/forgotPassword', authController.forgotPassword);

//route pour réinitialiser le nouveau mot de passe
router.post('/resetPassword', authController.resetPassword);

module.exports = router;
