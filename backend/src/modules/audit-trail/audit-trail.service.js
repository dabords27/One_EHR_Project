const sql = require("mssql");

/* =====================================================
   GET AUDIT LOGS
===================================================== */
const getAuditLogs = async ({
  search,
  module,
  type,
  from,
  to
}) => {

  const pool = await sql.connect();

  const request = pool.request();

  request.input("search", sql.VarChar, search || "");
  request.input("module", sql.VarChar, module || "All");
  request.input("type", sql.VarChar, type || "All");

  request.input("from", sql.Date, from ? new Date(from) : null);
  request.input("to", sql.Date, to ? new Date(to) : null);

  const result = await request.query(`
  
SELECT TOP 500
    audit_id,
    CONVERT(VARCHAR(23), at_datetime, 121) AS at_datetime,
    at_transaction,
    at_transaction_type,
    at_username,
    at_old_value,
    at_new_value,
    at_module,
    at_pc_name,
    at_field
FROM audit_trail
WHERE
(
    @search = '' OR
    at_username LIKE '%' + @search + '%' OR
    at_module LIKE '%' + @search + '%' OR
    at_transaction LIKE '%' + @search + '%'
)
AND
(
    @module = 'All'
    OR at_module = @module
    OR at_table_name = @module
)
AND
(
    @type = 'All'
    OR at_transaction_type = @type
)
AND
(
  (@from IS NULL OR at_datetime >= @from)
  AND
  (@to IS NULL OR at_datetime < DATEADD(day,1,@to))
)
ORDER BY at_datetime DESC

  `);

  return result.recordset;
};
module.exports = {
  getAuditLogs
};