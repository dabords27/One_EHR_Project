const express = require('express');
const router = express.Router();

const controller = require('./facilityinformation.controller');  // 👈 ADD THIS
const upload = require("../../../middleware/facilityUpload.middleware");
const { verifyToken } = require("../../../middleware/auth.middleware");

router.get('/', verifyToken, controller.getFacility);  // keep your GET

router.post(
  "/save",
  verifyToken,
  upload.single("logo"),
  controller.saveFacility
);

module.exports = router;