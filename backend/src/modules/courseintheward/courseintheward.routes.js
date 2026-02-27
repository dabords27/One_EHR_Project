const express = require('express');
const router = express.Router();
const controller = require('./courseintheward.controller');

// Get admission + course timeline per registry
router.get('/:registryNo', controller.getCourseByRegistry);

module.exports = router;