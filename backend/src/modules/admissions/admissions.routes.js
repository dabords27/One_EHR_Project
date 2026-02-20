const express = require('express');
const router = express.Router();
const controller = require('./admissions.controller');

router.get('/', controller.getAdmissions);
router.get('/active-count', controller.getActiveCount);

module.exports = router;