const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');


// Existing login
router.post('/login', authController.login);

// NEW: verification for CRUD authentication
router.post('/verify', authController.verifyUser);

//Change password
router.post("/change-password", authController.changePassword);

module.exports = router;
