const express = require("express");
const router = express.Router();

const { getUserDepartments } = require("./userdepartmentaccess.controller");

router.get("/users/:username/departments", getUserDepartments);

module.exports = router;