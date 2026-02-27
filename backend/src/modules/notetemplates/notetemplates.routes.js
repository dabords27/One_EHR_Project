const express = require('express');
const router = express.Router();
const controller = require('./notetemplates.controller');
const { verifyToken } = require("../../../middleware/auth.middleware"); // correct path


router.get('/', verifyToken, controller.getTemplates);
router.post('/', verifyToken, controller.createTemplate);
router.put('/:id', verifyToken, controller.updateTemplate);
router.delete('/:id', verifyToken, controller.deleteTemplate);

module.exports = router;