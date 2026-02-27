const { sql, config } = require("../../config/db");

const getUserDepartments = async (req, res) => {
  const { username } = req.params;
  const pool = req.app.locals.pool;

  try {
    const result = await pool.request()
      .input("username", username)
      .query(`
        SELECT 
          d.auto_id,
          d.dept_name,
          d.dept_code,
          uda.is_default
        FROM user_department_access uda
        INNER JOIN departments d
          ON uda.fk_dept_code = d.dept_code
        WHERE uda.fk_username = @username
          AND d.dept_status_active = 1
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

module.exports = { getUserDepartments };