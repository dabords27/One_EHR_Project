const router = require('express').Router();
const departmentController = require('./department.controller');

router.get('/', departmentController.getDepartments);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);

module.exports = router;