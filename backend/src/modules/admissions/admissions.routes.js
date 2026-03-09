const express = require('express');
const router = express.Router();

const controller = require('./admissions.controller');
const admissionsService = require('./admissions.service');

/* ================= ADMISSIONS LIST ================= */

router.get('/', controller.getAdmissions);

/* ================= ACTIVE COUNT ================= */

router.get('/active-count', controller.getActiveCount);

/* ================= DISCHARGES TODAY ================= */

router.get('/discharges-today', async (req, res) => {
  try {
    const pool = req.app.locals.pool;

    const count = await admissionsService.getDischargesToday(pool);

    res.json({ count });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Server error" });

  }
});

module.exports = router;