const express = require("express");
const router = express.Router();
const departmentController = require("./department.controller");
const { verifyToken } = require("../../../middleware/auth.middleware");

// GET
router.get("/", verifyToken, departmentController.getDepartments);

// CREATE
router.post("/", verifyToken, departmentController.createDepartment);

// UPDATE
router.put("/:id", verifyToken, departmentController.updateDepartment);

module.exports = router;