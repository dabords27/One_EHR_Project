const auditService = require("./audit-trail.service");

/* =====================================================
   GET AUDIT LOGS
===================================================== */
exports.getAuditLogs = async (req, res) => {

  try {

    const {
      search,
      module,
      type,
      from,
      to
    } = req.query;

    const logs = await auditService.getAuditLogs({
      search,
      module,
      type,
      from,
      to
    });

    res.json(logs);

  } catch (err) {

    console.error("Audit Trail Error:", err);

    res.status(500).json({
      message: "Failed to fetch audit trail"
    });

  }

};