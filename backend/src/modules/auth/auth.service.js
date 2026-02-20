const { sql } = require('../../config/db');

const login = async (pool, { username, password }) => {

  // 🔎 Find user (case-insensitive)
  const userResult = await pool.request()
    .input("username", sql.VarChar(100), username.trim())
    .query(`
      SELECT *
      FROM dbo.users
      WHERE LOWER(usr_username) = LOWER(@username)
    `);

  if (!userResult.recordset.length) {
    throw new Error("Invalid credentials");
  }

  const dbUser = userResult.recordset[0];

  // 🔐 Password check
  if (
    String(dbUser.usr_password_hash).trim() !==
    String(password).trim()
  ) {
    throw new Error("Invalid credentials");
  }

  // 🚫 Block deactivated users (BIT column safe check)
  if (Number(dbUser.usr_status_active) === 0) {
    throw new Error("Account is deactivated. Please contact administrator.");
  }

  // 📌 Get default department
  const deptResult = await pool.request()
    .input("username", sql.VarChar(100), username.trim())
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

  // ✅ Return clean user object
  return {
    id: dbUser.auto_id,
    username: dbUser.usr_username,
    fullName: `${dbUser.usr_last_name}, ${dbUser.usr_first_name}`,
    role: dbUser.fk_usr_group_code,
    status: dbUser.usr_status_active, // boolean/bit
    defaultDepartment,
    photo: dbUser.usr_photo_path || null
  };
};

module.exports = {
  login
};