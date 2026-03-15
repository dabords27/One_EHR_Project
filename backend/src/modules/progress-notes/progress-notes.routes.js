const express = require('express');
const router = express.Router();
const controller = require('./progress-notes.controller');

// AUTH MIDDLEWARE
const { verifyToken } = require("../../../middleware/auth.middleware");

/* =====================================================
   GET NOTES BY REGISTRY
===================================================== */
router.get(
  '/:registryNo',
  verifyToken,
  controller.getNotesByRegistry
);

/* =====================================================
   CREATE NEW NOTE (DRAFT OR FINALIZED)
===================================================== */
router.post(
  '/',
  verifyToken,
  controller.createNote
);

/* =====================================================
   UPDATE DRAFT (ONLY CREATOR OR ADMIN)
===================================================== */
router.put(
  '/:noteId',
  verifyToken,
  controller.updateDraft
);

/* =====================================================
   FINALIZE NOTE
===================================================== */
router.put(
  '/:noteId/finalize',
  verifyToken,
  controller.finalizeNote
);

/* =====================================================
   EXCLUDE NOTE FROM PRINT
===================================================== */
router.put(
  '/:noteId/exclude',
  verifyToken,
  controller.excludeFromPrint
);

module.exports = router;