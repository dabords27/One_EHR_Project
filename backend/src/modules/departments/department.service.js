const sql = require("mssql");

/* =====================================================
   SAFE STRING FOR AUDIT VALUES
===================================================== */
const safeString = (val) => {
  if (val === undefined || val === null) return null;
  return String(val);
};

/* =====================================================
   NORMALIZE VALUES
===================================================== */
const normalize = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

/* =====================================================
   FIELD LABELS FOR AUDIT
===================================================== */
const FIELD_LABELS = {
  dept_name: "Department Name",
  dept_status_active: "Department Status"
};

/* =====================================================
   AUDIT LOGGER
===================================================== */
const logAudit = async (transaction, data) => {

  await transaction.request()
    .input("table_name", sql.VarChar(100), data.table)
    .input("record_id", sql.VarChar(100), data.recordId)
    .input("transaction", sql.VarChar(200), data.transaction)
    .input("transaction_type", sql.VarChar(20), data.type)
    .input("old_value", sql.NVarChar(sql.MAX), safeString(data.oldValue))
    .input("new_value", sql.NVarChar(sql.MAX), safeString(data.newValue))
    .input("module", sql.VarChar(100), "DEPARTMENT")
    .input("username", sql.VarChar(100), data.username || "SYSTEM")
    .input("pc_name", sql.VarChar(100), data.pcName || "UNKNOWN")
    .execute("sp_insert_audit");

};


/* ==============================
   GET DEPARTMENTS
================================= */
exports.getDepartments = async (pool) => {

  const result = await pool.request().query(`
    SELECT 
      auto_id,
      dept_code,
      dept_name,
      dept_status_active,
      dept_created_by,
      dept_date_created,
      dept_updated_by,
      dept_date_updated
    FROM dbo.departments
    ORDER BY dept_name
  `);

  return result.recordset;

};


/* ==============================
   CREATE DEPARTMENT
================================= */
exports.createDepartment = async (pool, data, currentUser) => {

  const transaction = pool.transaction();

  try {

    await transaction.begin();

    const createdBy = data.createdBy || currentUser?.username || "SYSTEM";

    const result = await transaction.request()
      .input("dept_code", sql.VarChar(50), data.dept_code)
      .input("dept_name", sql.VarChar(200), data.dept_name)
      .input("dept_status_active", sql.Bit, data.dept_status_active ? 1 : 0)
      .input("dept_created_by", sql.VarChar(100), createdBy)
      .input("dept_date_created", sql.DateTime, new Date())
      .query(`
        INSERT INTO dbo.departments (
          dept_code,
          dept_name,
          dept_status_active,
          dept_created_by,
          dept_date_created
        )
        VALUES (
          @dept_code,
          @dept_name,
          @dept_status_active,
          @dept_created_by,
          @dept_date_created
        );

        SELECT SCOPE_IDENTITY() AS newId;
      `);

    const newId = result.recordset[0].newId;

    /* AUDIT CREATE */
    await logAudit(transaction, {
      table: "departments",
      recordId: String(newId),
     transaction: `Create Department - ${data.dept_name}`,
      type: "ADD",
      newValue: data.dept_name,
      username: createdBy
    });

    await transaction.commit();

  } catch (err) {

    await transaction.rollback();
    throw err;

  }

};


/* ==============================
   UPDATE DEPARTMENT
================================= */
exports.updateDepartment = async (pool, id, data, currentUser) => {

  const transaction = pool.transaction();

  try {

    await transaction.begin();

    const updatedBy = data.updatedBy || currentUser?.username || "SYSTEM";

    /* GET OLD DATA */
    const oldResult = await transaction.request()
      .input("id", sql.Int, id)
      .query(`SELECT * FROM dbo.departments WHERE auto_id = @id`);

    if (!oldResult.recordset.length)
      throw new Error("Department not found");

    const oldData = oldResult.recordset[0];

    /* FIELD CHANGE AUDIT */
	  const deptName = oldData.dept_name;
    for (const field of Object.keys(FIELD_LABELS)) {

      let oldVal = oldData[field];
      let newVal = data[field];

      if (field === "dept_status_active") {

        oldVal = oldData[field] ? "ACTIVE" : "INACTIVE";
        newVal = data[field] ? "ACTIVE" : "INACTIVE";

      }

      const oldNorm = normalize(oldVal);
      const newNorm = normalize(newVal);
	

      if (oldNorm === newNorm) continue;

      await logAudit(transaction, {
        table: "departments",
        recordId: String(id),
        transaction: `Update ${FIELD_LABELS[field]} - ${deptName}`,
        type: "UPDATE",
        oldValue: oldNorm,
        newValue: newNorm,
        username: updatedBy
      });

    }

    /* UPDATE RECORD */
    await transaction.request()
      .input("id", sql.Int, id)
      .input("dept_name", sql.VarChar(200), data.dept_name)
      .input("dept_status_active", sql.Bit, data.dept_status_active ? 1 : 0)
      .input("dept_updated_by", sql.VarChar(100), updatedBy)
      .input("dept_date_updated", sql.DateTime, new Date())
      .query(`
        UPDATE dbo.departments
        SET 
          dept_name = @dept_name,
          dept_status_active = @dept_status_active,
          dept_updated_by = @dept_updated_by,
          dept_date_updated = @dept_date_updated
        WHERE auto_id = @id
      `);

    await transaction.commit();

  } catch (err) {

    await transaction.rollback();
    throw err;

  }

};