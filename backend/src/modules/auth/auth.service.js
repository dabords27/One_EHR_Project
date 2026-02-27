const { sql } = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
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
const isMatch = await bcrypt.compare(
  password,
  dbUser.usr_password_hash
);

if (!isMatch) {
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
  ? {
      code: deptResult.recordset[0].dept_code,
      description: deptResult.recordset[0].dept_name
    }
  : null;

  // ✅ Return clean user object
// 🔐 Generate JWT
console.log("JWT_SECRET IN LOGIN:", process.env.JWT_SECRET);
const token = jwt.sign(
  {
    id: dbUser.auto_id,
    username: dbUser.usr_username,
    role: dbUser.fk_usr_group_code
  },
  process.env.JWT_SECRET,
  { expiresIn: "8h" }
);

// ✅ Return token + user data
return {
  token,
  user: {
    id: dbUser.auto_id,
    username: dbUser.usr_username,
    fullName: `${dbUser.usr_last_name}, ${dbUser.usr_first_name}`,
    role: String(dbUser.fk_usr_group_code).toUpperCase(),
    status: dbUser.usr_status_active,
    defaultDepartment,
    photo: dbUser.usr_photo_path || null
  }
};
};

const verifyUser = async (pool, data) => {
  const { username, password } = data;

  const result = await pool.request()
    .input('username', username)
    .query(`
      SELECT 
        auto_id,
        usr_username,
        usr_password_hash,
        usr_status_active
      FROM dbo.users
      WHERE usr_username = @username
    `);

  if (result.recordset.length === 0) {
    throw new Error('Invalid username or password');
  }

  const user = result.recordset[0];

  if (!user.usr_status_active) {
    throw new Error('User is inactive');
  }

  const match = await bcrypt.compare(
    password,
    user.usr_password_hash
  );

  if (!match) {
    throw new Error('Invalid username or password');
  }

  return {
    success: true,
    user: {
      id: user.auto_id,
      username: user.usr_username
    }
  };
};

module.exports = {
  login,
verifyUser
};