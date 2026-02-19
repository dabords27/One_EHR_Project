exports.getDepartments = async (pool) => {
  const result = await pool.request().query(`
    SELECT auto_id, dept_code, dept_name, dept_status_active
    FROM dbo.departments
    ORDER BY dept_name
  `);

  return result.recordset;
};

exports.createDepartment = async (pool, data) => {
  await pool.request()
    .input('dept_code', data.dept_code)
    .input('dept_name', data.dept_name)
    .input('dept_status_active', data.dept_status_active ? 1 : 0)
    .query(`
      INSERT INTO dbo.departments
      (dept_code, dept_name, dept_status_active, dept_date_created, dept_created_by)
      VALUES
      (@dept_code, @dept_name, @dept_status_active, GETDATE(), 'SYSTEM')
    `);
};

exports.updateDepartment = async (pool, id, data) => {
  await pool.request()
    .input('id', id)
    .input('dept_name', data.dept_name)
    .input('dept_status_active', data.dept_status_active ? 1 : 0)
    .query(`
      UPDATE dbo.departments
      SET dept_name = @dept_name,
          dept_status_active = @dept_status_active
      WHERE auto_id = @id
    `);
	console.log("Update data:", data);
};

