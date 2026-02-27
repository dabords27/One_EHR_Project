const sql = require("mssql");

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

    // 🔥 USE VERIFIED USER FIRST
    const createdBy = data.createdBy || currentUser?.username || "SYSTEM";

    await transaction.request()
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
        )
      `);

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

    // 🔥 USE VERIFIED USER FIRST
    const updatedBy = data.updatedBy || currentUser?.username || "SYSTEM";

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