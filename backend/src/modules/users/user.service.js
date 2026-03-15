const sql = require("mssql");
const bcrypt = require("bcrypt");

const toUpper = (value) =>
  typeof value === "string" ? value.toUpperCase() : value;
  
  /* =====================================================
   SAFE STRING FOR AUDIT VALUES
===================================================== */
const safeString = (val) => {
  if (val === undefined || val === null) return null;
  return String(val);
};

/* =====================================================
   FIELD LABELS FOR AUDIT
===================================================== */
const FIELD_LABELS = {
  usr_last_name: "Last Name",
  usr_first_name: "First Name",
  usr_middle_name: "Middle Name",
  usr_extension: "Extension",
  usr_custom_name: "Display Name",
  usr_email: "Email Address",

  fk_usr_group_code: "User Group",
  fk_usr_type_code: "User Type",

  usr_status_active: "User Status",

  usr_associate_doctor_name: "Associate Doctor",

  usr_photo_path: "Profile Photo",
  usr_signature_path: "E-Signature"
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
    .input("module", sql.VarChar(100), "USER_MGMT")
    .input("username", sql.VarChar(100), data.username || "SYSTEM")
    .input("pc_name", sql.VarChar(100), data.pcName || "UNKNOWN")
    .execute("sp_insert_audit");
};

/* =====================================================
   GET USERS
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
   GET USER
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

  const defaultDept = deptResult.recordset.find(
    d => d.is_default === true || d.is_default === 1
  );

  user.defaultDepartment = defaultDept
    ? defaultDept.fk_dept_code
    : null;

  return user;
};

/* =====================================================
   CREATE USER
===================================================== */
const createUser = async (pool, data, currentUser) => {

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
    usr_custom_name,
    departments = [],
    defaultDepartment,
    pc_name
  } = data;

  const transaction = pool.transaction();

  try {

    await transaction.begin();

    const hashedPassword = await bcrypt.hash(usr_password, 10);
    const createdBy = currentUser?.username || "SYSTEM";

    await transaction.request()
      .input("usr_last_name", toUpper(usr_last_name))
      .input("usr_first_name", toUpper(usr_first_name))
      .input("usr_middle_name", toUpper(usr_middle_name))
      .input("usr_extension", toUpper(usr_extension))
      .input("usr_custom_name", toUpper(usr_custom_name))
      .input("usr_username", usr_username)
      .input("usr_email", usr_email)
      .input("usr_password_hash", hashedPassword)
      .input("fk_usr_group_code", fk_usr_group_code)
      .input("fk_usr_type_code", fk_usr_type_code)
      .input("usr_status_active", usr_status_active ? 1 : 0)
      .input("usr_photo_path", usr_photo_path || null)
      .input("usr_signature_path", usr_signature_path || null)
      .input("usr_associate_doctor_name", usr_associate_doctor_name || null)
      .input("usr_created_by", createdBy)
      .input("usr_date_created", new Date())
.query(`
INSERT INTO dbo.users (
usr_last_name,
usr_first_name,
usr_middle_name,
usr_extension,
usr_custom_name,
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
@usr_custom_name,
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

// AUDIT: USER CREATED
await logAudit(transaction,{
  table: "users",
  recordId: usr_username,
  transaction: "Create User",
  type: "ADD",
  newValue: JSON.stringify({
    username: usr_username,
    name: `${usr_last_name}, ${usr_first_name}`,
    group: fk_usr_group_code,
    type: fk_usr_type_code
  }),
  username: createdBy,
  pcName: pc_name
});
    for (const deptCode of departments) {

      await transaction.request()
        .input("fk_dept_code", deptCode)
        .input("fk_username", usr_username)
        .input("is_default", deptCode === defaultDepartment ? 1 : 0)
        .query(`
          INSERT INTO dbo.user_department_access
          (fk_dept_code,fk_username,is_default)
          VALUES (@fk_dept_code,@fk_username,@is_default)
        `);

 await logAudit(transaction,{
  table:"user_department_access",
  recordId:usr_username,
  transaction:"Add Department Access",
  type:"ADD",
  newValue:deptCode,
  username:createdBy,
  pcName:pc_name
});

    }

    await transaction.commit();

    return { message:"User created successfully"};

  } catch(err){

    await transaction.rollback();
    throw err;

  }

};

/* =====================================================
   UPDATE USER
===================================================== */
const updateUser = async (pool,id,data,currentUser)=>{

const transaction = pool.transaction();

try{

await transaction.begin();

/* GET OLD USER */

const oldUserResult = await transaction.request()
.input("id",id)
.query(`SELECT * FROM dbo.users WHERE auto_id=@id`);

if(!oldUserResult.recordset.length)
throw new Error("User not found");

const oldUser = oldUserResult.recordset[0];
const username = oldUser.usr_username;

/* UPDATE USERS */

await transaction.request()
.input("id",id)
.input("usr_last_name",toUpper(data.usr_last_name))
.input("usr_first_name",toUpper(data.usr_first_name))
.input("usr_middle_name",toUpper(data.usr_middle_name))
.input("usr_extension",toUpper(data.usr_extension))
.input("usr_custom_name",toUpper(data.usr_custom_name))
.input("usr_email",data.usr_email)
.input("fk_usr_group_code",data.fk_usr_group_code)
.input("fk_usr_type_code",data.fk_usr_type_code)
.input("usr_associate_doctor_name",data.usr_associate_doctor_name||null)
.input("usr_photo_path",data.usr_photo_path||oldUser.usr_photo_path)
.input("usr_signature_path",data.usr_signature_path||oldUser.usr_signature_path)
.input("usr_updated_by",data.usr_updated_by)
.input("usr_date_updated",new Date())
.query(`UPDATE dbo.users
SET
usr_last_name=@usr_last_name,
usr_first_name=@usr_first_name,
usr_middle_name=@usr_middle_name,
usr_extension=@usr_extension,
usr_custom_name=@usr_custom_name,
usr_email=@usr_email,
fk_usr_group_code=@fk_usr_group_code,
fk_usr_type_code=@fk_usr_type_code,
usr_associate_doctor_name=@usr_associate_doctor_name,
usr_photo_path=@usr_photo_path,
usr_signature_path=@usr_signature_path,
usr_updated_by=@usr_updated_by,
usr_date_updated=@usr_date_updated
WHERE auto_id=@id`);

/* FIELD CHANGE AUDIT */
const normalize = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

for (const field of Object.keys(FIELD_LABELS)) {

  if (!Object.prototype.hasOwnProperty.call(data, field)) continue;

  const oldValRaw = oldUser[field];
  const newValRaw = data[field];

  let oldVal = oldValRaw;
  let newVal = newValRaw;

  if (field === "usr_status_active") {
    oldVal = oldValRaw ? "ACTIVE" : "DEACTIVATED";
    newVal = newValRaw ? "ACTIVE" : "DEACTIVATED";
  }

  const oldNorm = normalize(oldVal);
  const newNorm = normalize(newVal);

  if (oldNorm === newNorm) continue;

  await logAudit(transaction, {
    table: "users",
    recordId: username,
    transaction: `Update ${FIELD_LABELS[field]}`,
    type: "UPDATE",
    oldValue: oldNorm,
    newValue: newNorm,
    username: data.usr_updated_by,
    pcName: data.pc_name
  });
}

/* ===============================
   DEPARTMENT SYNC
================================ */

const oldDept = await transaction.request()
.input("username",username)
.query(`SELECT fk_dept_code,is_default FROM user_department_access WHERE fk_username=@username`);

const oldDepartments = oldDept.recordset.map(d => String(d.fk_dept_code));

const newDepartments =
  (data.departments || data["departments[]"] || oldDepartments)
  .map(d => String(d));

/* DEFAULT DEPARTMENT CHECK */

const oldDefaultDept =
  oldDept.recordset.find(d => d.is_default === 1)?.fk_dept_code || null;

const newDefaultDept =
  data.defaultDepartment !== undefined
    ? String(data.defaultDepartment)
    : String(oldDefaultDept);

/* NORMALIZE DEPARTMENT VALUES */
const normalizeDept = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};
const oldDef = normalizeDept(oldDefaultDept);
const newDef = normalizeDept(newDefaultDept);

const defaultChanged =
  oldDef !== newDef &&
  newDepartments.includes(String(newDef));

/* REMOVE OLD */

await transaction.request()
.input("username",username)
.query(`DELETE FROM dbo.user_department_access WHERE fk_username=@username`);

/* INSERT NEW */

for(const deptCode of newDepartments){

await transaction.request()
.input("fk_dept_code",deptCode)
.input("fk_username",username)
.input("is_default", String(deptCode) === String(newDefaultDept) ? 1 : 0)
.query(`INSERT INTO dbo.user_department_access (fk_dept_code,fk_username,is_default) VALUES (@fk_dept_code,@fk_username,@is_default)`);

if(!oldDepartments.includes(String(deptCode))){

await logAudit(transaction,{
table:"user_department_access",
recordId:username,
transaction:"Add Department Access",
type:"ADD",
newValue:deptCode,
username:data.usr_updated_by,
pcName:data.pc_name
});

}

}

if (defaultChanged) {


  await logAudit(transaction,{
    table:"user_department_access",
    recordId:username,
    transaction:"Change Default Department",
    type:"UPDATE",
    oldValue:oldDef,
    newValue:newDef,
    username:data.usr_updated_by,
    pcName:data.pc_name
  });

}

/* REMOVE DEPARTMENTS */

for(const dept of oldDepartments){

if(!newDepartments.includes(String(dept))){

await logAudit(transaction,{
table:"user_department_access",
recordId:username,
transaction:"Remove Department Access",
type:"DELETE",
oldValue:dept,
username:data.usr_updated_by,
pcName:data.pc_name
});

}

}

await transaction.commit();

return {message:"User updated successfully"};

}catch(err){

await transaction.rollback();
throw err;

}

};


/* =====================================================
   UPDATE USER STATUS
===================================================== */
const updateUserStatus = async (pool, id, status, updatedBy, pc_name) => {

  const transaction = pool.transaction();

  try {

    await transaction.begin();

    const oldUser = await transaction.request()
      .input("id", id)
      .query(`SELECT * FROM dbo.users WHERE auto_id=@id`);

    if (!oldUser.recordset.length)
      throw new Error("User not found");

    const username = oldUser.recordset[0].usr_username;

    await transaction.request()
      .input("id", id)
      .input("usr_status_active", status ? 1 : 0)
      .input("usr_updated_by", updatedBy)
      .input("usr_date_updated", new Date())
      .query(`
        UPDATE dbo.users
        SET
          usr_status_active=@usr_status_active,
          usr_updated_by=@usr_updated_by,
          usr_date_updated=@usr_date_updated
        WHERE auto_id=@id
      `);

    await logAudit(transaction, {
      table: "users",
      recordId: username,
      transaction: "Update User Status",
      type: "UPDATE",
      oldValue: oldUser.recordset[0].usr_status_active ? "ACTIVE" : "INACTIVE",
      newValue: status ? "ACTIVE" : "INACTIVE",
      username: updatedBy,
      pcName: pc_name
    });

    await transaction.commit();

    return { message: "Status updated successfully" };

  } catch (err) {

    await transaction.rollback();
    throw err;

  }

};

module.exports={
getUsers,
getUserById,
createUser,
updateUser,
updateUserStatus
}