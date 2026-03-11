const express = require("express");
const router = express.Router();
const controller = require("./audit-trail.controller");
const { verifyToken } = require("../../../middleware/auth.middleware");

/* =====================================================
   ROUTES
===================================================== */

router.get("/", verifyToken, controller.getAuditLogs);

module.exports = router;