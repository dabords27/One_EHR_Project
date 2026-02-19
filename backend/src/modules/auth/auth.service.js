const { sql } = require('../../config/db');

const login = async (pool, { username, password }) => {
console.log("Incoming username:", username);
console.log("Incoming password:", password);

  // Find user (case-insensitive)
  const userResult = await pool.request()
    .input("username", sql.VarChar(100), username)
    .query(`
      SELECT *
      FROM dbo.users
      WHERE LOWER(usr_username) = LOWER(@username)
    `);

  if (!userResult.recordset.length) {
    throw new Error("Invalid credentials");
  }

  const dbUser = userResult.recordset[0];

  // Compare password (plain for now)
  if (dbUser.usr_password_hash.trim() !== password.trim()) {
    throw new Error("Invalid credentials");
  }

  // Get default department
  const deptResult = await pool.request()
    .input("username", sql.VarChar(100), username)
    .query(`
      SELECT TOP 1
        d.dept_code,
        d.dept_name
      FROM dbo.user_department_access uda
      INNER JOIN dbo.departments d
        ON uda.fk_dept_code = d.dept_code
      WHERE uda.fk_username = @username
        AND uda.is_default = 1
    `);

  const defaultDepartment = deptResult.recordset.length
    ? deptResult.recordset[0].dept_code
    : null;

  return {
    id: dbUser.auto_id,
    username: dbUser.usr_username,
    fullName: `${dbUser.usr_last_name}, ${dbUser.usr_first_name}`,
    role: dbUser.fk_usr_group_code,
    status: dbUser.usr_status,
    defaultDepartment
  };
};

module.exports = {
  login
};

