const express = require('express');
const router = express.Router();
const userController = require('./user.controller');

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.put('/:id/status', userController.updateUserStatus);

module.exports = router;

