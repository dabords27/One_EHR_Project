const sql = require("mssql");
const bcrypt = require("bcrypt");
const toUpper = (value) =>
  typeof value === "string" ? value.toUpperCase() : value;



/* =====================================================
   GET ALL USERS
===================================================== */
const getUsers = async (pool) => {
  const result = await pool.request().query(`
    SELECT 
      u.auto_id,
      u.usr_username,
      u.usr_last_name + ', ' + u.usr_first_name AS full_name,
      u.fk_usr_group_code,
      u.fk_usr_type_code,
      u.usr_status_active,
      ug.group_color,
      d.dept_name AS default_department_name,
      uda.fk_dept_code AS default_department
    FROM dbo.users u
    LEFT JOIN dbo.user_groups ug
      ON u.fk_usr_group_code = ug.usr_group_code
    LEFT JOIN dbo.user_department_access uda
      ON u.usr_username = uda.fk_username
      AND uda.is_default = 1
    LEFT JOIN dbo.departments d
      ON uda.fk_dept_code = d.dept_code
    ORDER BY u.usr_last_name
  `);

  return result.recordset;
};



/* =====================================================
   GET USER BY ID
===================================================== */
const getUserById = async (pool, id) => {

  const userResult = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM dbo.users WHERE auto_id = @id`);

  if (!userResult.recordset.length)
    throw new Error("User not found");

  const user = userResult.recordset[0];

  const deptResult = await pool.request()
    .input("username", sql.VarChar(100), user.usr_username)
    .query(`
      SELECT fk_dept_code, is_default
      FROM dbo.user_department_access
      WHERE fk_username = @username
    `);

  user.departments = deptResult.recordset.map(d => d.fk_dept_code);

  const defaultDept = deptResult.recordset.find(d => d.is_default === true || d.is_default === 1);
  user.defaultDepartment = defaultDept ? defaultDept.fk_dept_code : null;

  return user;
};



/* =====================================================
   CREATE USER
===================================================== */
const createUser = async (pool, data, currentUser) => {
console.log("CURRENT USER:", currentUser);

  const {
    usr_last_name,
    usr_first_name,
    usr_middle_name,
    usr_extension,
    usr_username,
    usr_email,
    usr_password,
    fk_usr_group_code,
    fk_usr_type_code,
    usr_status_active,
    usr_photo_path,
    usr_signature_path,
    usr_associate_doctor_name,
    departments = [],
    defaultDepartment
  } = data;

  if (!usr_password || !usr_password.trim())
    throw new Error("Password is required");

  if (!departments.length)
    throw new Error("At least one department required");

  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(usr_password, 10);

    // 🔎 Check username uniqueness
    const existing = await transaction.request()
      .input("usr_username", sql.VarChar(100), usr_username)
      .query(`SELECT 1 FROM dbo.users WHERE usr_username = @usr_username`);

    if (existing.recordset.length)
      throw new Error("Username already exists");
let createdBy = "SYSTEM";

if (currentUser?.id) {
  const userLookup = await transaction.request()
    .input("id", sql.Int, currentUser.id)
    .query(`
      SELECT usr_username 
      FROM dbo.users 
      WHERE auto_id = @id
    `);

  if (userLookup.recordset.length) {
    createdBy = userLookup.recordset[0].usr_username;
  }
}
    // 👤 Insert user
    await transaction.request()
      .input("usr_last_name", toUpper(usr_last_name))
      .input("usr_first_name", toUpper(usr_first_name))
      .input("usr_middle_name", toUpper(usr_middle_name))
      .input("usr_extension", toUpper(usr_extension))
      .input("usr_username", usr_username)
      .input("usr_email", usr_email)
      .input("usr_password_hash", hashedPassword)
      .input("fk_usr_group_code", fk_usr_group_code)
      .input("fk_usr_type_code", fk_usr_type_code)
      .input("usr_status_active", usr_status_active ? 1 : 0)
      .input("usr_photo_path", usr_photo_path || null)
      .input("usr_signature_path", usr_signature_path || null)
      .input("usr_associate_doctor_name", usr_associate_doctor_name || null)
.input("usr_created_by", createdBy || "SYSTEM")
.input("usr_date_created", new Date())
      .query(`
        INSERT INTO dbo.users (
          usr_last_name,
          usr_first_name,
          usr_middle_name,
          usr_extension,
          usr_username,
          usr_email,
          usr_password_hash,
          fk_usr_group_code,
          fk_usr_type_code,
          usr_status_active,
          usr_photo_path,
          usr_signature_path,
          usr_associate_doctor_name,
usr_created_by,
usr_date_created
        )
        VALUES (
          @usr_last_name,
          @usr_first_name,
          @usr_middle_name,
          @usr_extension,
          @usr_username,
          @usr_email,
          @usr_password_hash,
          @fk_usr_group_code,
          @fk_usr_type_code,
          @usr_status_active,
          @usr_photo_path,
          @usr_signature_path,
          @usr_associate_doctor_name,
@usr_created_by,
@usr_date_created
        )
      `);

    // 🏥 Insert department access
    for (const deptCode of departments) {
      await transaction.request()
        .input("fk_dept_code", sql.VarChar(50), deptCode)
        .input("fk_username", sql.VarChar(100), usr_username)
        .input(
          "is_default",
          sql.Bit,
          deptCode?.toUpperCase() === defaultDepartment?.toUpperCase() ? 1 : 0
        )
        .query(`
          INSERT INTO dbo.user_department_access (
            fk_dept_code,
            fk_username,
            is_default
          )
          VALUES (
            @fk_dept_code,
            @fk_username,
            @is_default
          )
        `);
    }

    await transaction.commit();
    return { message: "User created successfully" };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};



/* =====================================================
   UPDATE USER
===================================================== */
const updateUser = async (pool, id, data) => {

  const {
    usr_last_name,
    usr_first_name,
    usr_middle_name,
    usr_extension,
    usr_email,
    fk_usr_group_code,
    fk_usr_type_code,
    usr_status_active,
    departments = [],
    defaultDepartment,
    usr_photo_path,
    usr_signature_path,
    usr_password,
    usr_associate_doctor_name,
    usr_updated_by
  } = data;

  if (!departments.length)
    throw new Error("At least one department required");

  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // 🔎 Get username
    const lookup = await transaction.request()
      .input("id", sql.Int, id)
      .query(`SELECT usr_username FROM dbo.users WHERE auto_id = @id`);

    if (!lookup.recordset.length)
      throw new Error("User not found");

    const username = lookup.recordset[0].usr_username;

    const request = transaction.request()
      .input("id", id)
      .input("usr_last_name", toUpper(usr_last_name))
      .input("usr_first_name", toUpper(usr_first_name))
      .input("usr_middle_name", toUpper(usr_middle_name))
      .input("usr_extension", toUpper(usr_extension))
      .input("usr_email", usr_email)
      .input("fk_usr_group_code", fk_usr_group_code)
      .input("fk_usr_type_code", fk_usr_type_code)
      .input("usr_status_active", usr_status_active ? 1 : 0)
      .input("usr_photo_path", usr_photo_path || null)
      .input("usr_signature_path", usr_signature_path || null)
      .input("usr_associate_doctor_name", usr_associate_doctor_name || null)
      .input("usr_updated_by", usr_updated_by || "SYSTEM")
      .input("usr_date_updated", new Date());

    let passwordUpdate = "";
    if (usr_password && usr_password.trim()) {
      const hashedPassword = await bcrypt.hash(usr_password, 10);
      passwordUpdate = ", usr_password_hash = @usr_password_hash";
      request.input("usr_password_hash", hashedPassword);
    }

    await request.query(`
      UPDATE dbo.users
      SET
        usr_last_name = @usr_last_name,
        usr_first_name = @usr_first_name,
        usr_middle_name = @usr_middle_name,
        usr_extension = @usr_extension,
        usr_email = @usr_email,
        fk_usr_group_code = @fk_usr_group_code,
        fk_usr_type_code = @fk_usr_type_code,
        usr_status_active = @usr_status_active,
        usr_photo_path = @usr_photo_path,
        usr_signature_path = @usr_signature_path,
        usr_associate_doctor_name = @usr_associate_doctor_name,
        usr_updated_by = @usr_updated_by,
        usr_date_updated = @usr_date_updated
        ${passwordUpdate}
      WHERE auto_id = @id
    `);

    // 🔁 Reset departments
    await transaction.request()
      .input("username", sql.VarChar(100), username)
      .query(`DELETE FROM dbo.user_department_access WHERE fk_username = @username`);

    for (const deptCode of departments) {
      await transaction.request()
        .input("fk_dept_code", sql.VarChar(50), deptCode)
        .input("fk_username", sql.VarChar(100), username)
        .input(
          "is_default",
          sql.Bit,
          deptCode?.toUpperCase() === defaultDepartment?.toUpperCase() ? 1 : 0
        )
        .query(`
          INSERT INTO dbo.user_department_access (
            fk_dept_code,
            fk_username,
            is_default
          )
          VALUES (
            @fk_dept_code,
            @fk_username,
            @is_default
          )
        `);
    }

    await transaction.commit();
    return { message: "User updated successfully" };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};


/* =====================================================
   UPDATE STATUS
===================================================== */
const updateUserStatus = async (pool, id, usr_status_active, usr_updated_by) => {
  await pool.request()
    .input("id", sql.Int, id)
    .input("usr_status_active", sql.Bit, usr_status_active ? 1 : 0)
    .input("usr_updated_by", sql.VarChar(100), usr_updated_by || "SYSTEM")
    .input("usr_date_updated", new Date())
    .query(`
      UPDATE dbo.users
      SET 
        usr_status_active = @usr_status_active,
        usr_updated_by = @usr_updated_by,
        usr_date_updated = @usr_date_updated
      WHERE auto_id = @id
    `);

  return { message: "Status updated successfully" };
};



module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus
};