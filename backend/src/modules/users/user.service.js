const sql = require("mssql");
const bcrypt = require("bcrypt");
const getUsers = async (pool) => {
const result = await pool.request().query(`
  SELECT 
    u.auto_id,
    u.usr_username,
    u.usr_last_name + ', ' + u.usr_first_name AS full_name,
    u.fk_usr_group_code,
    u.fk_usr_type_code,
    u.usr_status_active,
    ug.group_color,  -- ✅ ADD THIS
    d.dept_name AS default_department_name,
    uda.fk_dept_code AS default_department

  FROM dbo.users u

  LEFT JOIN dbo.user_groups ug   -- ✅ JOIN GROUP TABLE
    ON u.fk_usr_group_code = ug.usr_group_code

  LEFT JOIN dbo.user_department_access uda
    ON u.usr_username = uda.fk_username
    AND uda.is_default = 1

  LEFT JOIN dbo.departments d
    ON uda.fk_dept_code = d.dept_code

  ORDER BY u.usr_last_name
`);;

  return result.recordset;
};

const getUserById = async (pool, id) => {

  // 1️⃣ Get user
  const userResult = await pool.request()
    .input("id", sql.Int, id)
    .query(`
      SELECT *
      FROM dbo.users
      WHERE auto_id = @id
    `);

  if (!userResult.recordset.length) {
    throw new Error("User not found");
  }

  const user = userResult.recordset[0];

  // 2️⃣ Get departments
  const deptResult = await pool.request()
    .input("username", sql.VarChar(100), user.usr_username)
    .query(`
    SELECT 
  uda.fk_dept_code,
  uda.is_default,
  d.dept_name
FROM dbo.user_department_access uda
INNER JOIN dbo.departments d
  ON uda.fk_dept_code = d.dept_code
WHERE uda.fk_username = @username
    `);

  // 3️⃣ Map departments
user.departments = deptResult.recordset.map(d => d.fk_dept_code);

  // 4️⃣ Detect default
const defaultDept = deptResult.recordset.find(
  d => d.is_default === true || d.is_default === 1
);

user.defaultDepartment = defaultDept
  ? defaultDept.fk_dept_code
  : null;
user.defaultDepartmentName = defaultDept
  ? defaultDept.dept_name
  : null;

  return user;
};
const updateUser = async (pool, id, data) => {
  const transaction = pool.transaction();

  try {
    await transaction.begin();

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
      usr_password
    } = data;

    if (!departments.length) {
      throw new Error("At least one department required");
    }

    // Get username first
  const usernameLookup = await transaction.request()
  .input("id", sql.Int, id)
  .query(`
    SELECT usr_username
    FROM dbo.users
    WHERE auto_id = @id
  `);

    if (!usernameLookup.recordset.length) {
      throw new Error("User not found");
    }

    const username = usernameLookup.recordset[0].usr_username;

   // Update user table
const request = transaction.request()
  .input("id", id)
  .input("usr_last_name", usr_last_name)
  .input("usr_first_name", usr_first_name)
  .input("usr_middle_name", usr_middle_name)
  .input("usr_extension", usr_extension)
  .input("usr_email", usr_email)
  .input("fk_usr_group_code", fk_usr_group_code)
  .input("fk_usr_type_code", fk_usr_type_code)
  .input("usr_status_active", usr_status_active)
  .input("usr_photo_path", usr_photo_path || null);

let signatureUpdate = "";
if (usr_signature_path !== undefined) {
  signatureUpdate = ", usr_signature_path = @usr_signature_path";
  request.input("usr_signature_path", usr_signature_path);
}

let passwordUpdate = "";
if (usr_password && usr_password.trim() !== "") {
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
    usr_photo_path = @usr_photo_path
    ${signatureUpdate}
    ${passwordUpdate}
  WHERE auto_id = @id
`);
// DELETE old departments
await transaction.request()
  .input("username", sql.VarChar(100), username)
  .query(`
    DELETE FROM dbo.user_department_access
    WHERE fk_username = @username
  `);

// INSERT new departments
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

const updateUserStatus = async (pool, id, usr_status_active) => {
  await pool.request()
    .input("id", sql.Int, id)
    .input("usr_status_active", sql.Bit, usr_status_active ? 1 : 0)
    .query(`
      UPDATE dbo.users
      SET usr_status_active = @usr_status_active
      WHERE auto_id = @id
    `);

  return { message: "Status updated successfully" };
};

const createUser = async (pool, data) => {
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
    usr_associate_doctor_name
  } = data;

  const transaction = pool.transaction();

  try {
    await transaction.begin();

    const request = transaction.request()
      .input("usr_last_name", usr_last_name)
      .input("usr_first_name", usr_first_name)
      .input("usr_middle_name", usr_middle_name)
      .input("usr_extension", usr_extension)
      .input("usr_username", usr_username)
      .input("usr_email", usr_email)
      .input("usr_password_hash", hashedPassword)
      .input("fk_usr_group_code", fk_usr_group_code)
      .input("fk_usr_type_code", fk_usr_type_code)
      .input("usr_status_active", usr_status_active ? 1 : 0)
      .input("usr_photo_path", usr_photo_path || null)
      .input("usr_associate_doctor_name", usr_associate_doctor_name || null);

    if (usr_signature_path !== undefined) {
      request.input("usr_signature_path", usr_signature_path);
    } else {
      request.input("usr_signature_path", null);
    }

    await request.query(`
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
        usr_associate_doctor_name
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
        @usr_associate_doctor_name
      )
    `);

    await transaction.commit();

    return { message: "User created successfully" };

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
module.exports = {
  getUsers,
  getUserById,
createUser, 
  updateUser,
  updateUserStatus
};



