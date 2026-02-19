const express = require('express');
const cors = require('cors');
const { sql, config } = require('./db/dbconfig');

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 5000;
let pool;

/* ================= DATABASE INIT ================= */

async function startServer() {
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to MSSQL Database');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    process.exit(1);
  }
}

/* ================= DEPARTMENTS ================= */

app.get('/api/departments', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT auto_id, dept_code, dept_name, dept_status
      FROM dbo.departments
      ORDER BY dept_name
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= CREATE USER ================= */

app.post('/api/users', async (req, res) => {
  const transaction = new sql.Transaction(pool);

  try {
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
      usr_status,
      departments = [],
      defaultDepartment,
      profileImage,
      eSignature
    } = req.body;

    if (!departments.length) {
      return res.status(400).json({ error: "At least one department required" });
    }

    await transaction.begin();

    await new sql.Request(transaction)
      .input('usr_last_name', sql.VarChar(100), usr_last_name)
      .input('usr_first_name', sql.VarChar(100), usr_first_name)
      .input('usr_middle_name', sql.VarChar(100), usr_middle_name)
      .input('usr_extension', sql.VarChar(20), usr_extension)
      .input('usr_username', sql.VarChar(100), usr_username)
      .input('usr_email', sql.VarChar(150), usr_email)
      .input('usr_password_hash', sql.VarChar(255), usr_password)
      .input('fk_usr_group_code', sql.VarChar(50), fk_usr_group_code)
      .input('fk_usr_type_code', sql.VarChar(50), fk_usr_type_code)
      .input('usr_status', sql.VarChar(20), usr_status)
      .input('usr_photo_path', sql.VarChar(sql.MAX), profileImage || null)
      .input('usr_signature_path', sql.VarChar(sql.MAX), eSignature || null)
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
          usr_status,
          usr_photo_path,
          usr_signature_path
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
          @usr_status,
          @usr_photo_path,
          @usr_signature_path
        )
      `);

    for (const deptCode of departments) {
      await new sql.Request(transaction)
        .input('fk_dept_code', sql.VarChar(50), deptCode)
        .input('fk_username', sql.VarChar(100), usr_username)
        .input('is_default', sql.Bit, deptCode === defaultDepartment ? 1 : 0)
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
    res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= LIST USERS ================= */

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
          u.auto_id,
          u.usr_username,
          u.usr_last_name + ', ' + u.usr_first_name AS full_name,
          u.fk_usr_group_code,
          u.fk_usr_type_code,
          u.usr_status,
          uda.fk_dept_code AS default_department
      FROM dbo.users u
      LEFT JOIN dbo.user_department_access uda
          ON u.usr_username = uda.fk_username
          AND uda.is_default = 1
      ORDER BY u.usr_last_name
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= GET SINGLE USER ================= */


app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM dbo.users WHERE auto_id = @id");

    if (!userResult.recordset.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.recordset[0];

    const deptResult = await pool.request()
      .input("username", sql.VarChar(100), user.usr_username)
      .query(`
        SELECT fk_dept_code, is_default
        FROM dbo.user_department_access
        WHERE fk_username = @username
      `);

    user.departments = deptResult.recordset.map(d => d.fk_dept_code);

    const defaultDept = deptResult.recordset.find(d => d.is_default === true);
    user.defaultDepartment = defaultDept ? defaultDept.fk_dept_code : null;

    res.json(user);

  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});


/* ================= UPDATE USER ================= */

app.put("/api/users/:id", async (req, res) => {
  const transaction = new sql.Transaction(pool);

  try {
    const { id } = req.params;
    const {
      usr_last_name,
      usr_first_name,
      usr_middle_name,
      usr_extension,
      usr_email,
      fk_usr_group_code,
      fk_usr_type_code,
      usr_status,
      departments = [],
      defaultDepartment,
      profileImage,
      eSignature,
      usr_password
    } = req.body;

    if (!departments.length) {
      return res.status(400).json({ error: "At least one department required" });
    }

    await transaction.begin();

    const usernameLookup = await new sql.Request(transaction)
      .input("id", sql.Int, id)
      .query(`SELECT usr_username FROM dbo.users WHERE auto_id = @id`);

    if (!usernameLookup.recordset.length) {
      throw new Error("User not found");
    }

    const username = usernameLookup.recordset[0].usr_username;

    let passwordUpdate = "";
    const request = new sql.Request(transaction)
      .input("id", sql.Int, id)
      .input("usr_last_name", sql.VarChar(100), usr_last_name)
      .input("usr_first_name", sql.VarChar(100), usr_first_name)
      .input("usr_middle_name", sql.VarChar(100), usr_middle_name)
      .input("usr_extension", sql.VarChar(20), usr_extension)
      .input("usr_email", sql.VarChar(150), usr_email)
      .input("fk_usr_group_code", sql.VarChar(50), fk_usr_group_code)
      .input("fk_usr_type_code", sql.VarChar(50), fk_usr_type_code)
      .input("usr_status", sql.VarChar(20), usr_status)
      .input("usr_photo_path", sql.VarChar(sql.MAX), profileImage || null)
      .input("usr_signature_path", sql.VarChar(sql.MAX), eSignature || null);

    if (usr_password && usr_password.trim() !== "") {
      passwordUpdate = ", usr_password_hash = @usr_password_hash";
      request.input("usr_password_hash", sql.VarChar(255), usr_password);
    }

    const result = await request.query(`
      UPDATE dbo.users
      SET
        usr_last_name = @usr_last_name,
        usr_first_name = @usr_first_name,
        usr_middle_name = @usr_middle_name,
        usr_extension = @usr_extension,
        usr_email = @usr_email,
        fk_usr_group_code = @fk_usr_group_code,
        fk_usr_type_code = @fk_usr_type_code,
        usr_status = @usr_status,
        usr_photo_path = @usr_photo_path,
        usr_signature_path = @usr_signature_path
        ${passwordUpdate}
      WHERE auto_id = @id
    `);

    if (result.rowsAffected[0] === 0) {
      throw new Error("Update failed. Invalid ID.");
    }

    await new sql.Request(transaction)
      .input("username", sql.VarChar(100), username)
      .query(`DELETE FROM dbo.user_department_access WHERE fk_username = @username`);

    for (const deptCode of departments) {
      await new sql.Request(transaction)
        .input("fk_dept_code", sql.VarChar(50), deptCode)
        .input("fk_username", sql.VarChar(100), username)
        .input(
  "is_default",
  sql.Bit,
  deptCode.toUpperCase() === defaultDepartment?.toUpperCase() ? 1 : 0
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
    res.json({ message: "User updated successfully" });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= UPDATE USER STATUS ================= */

app.put("/api/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.request()
      .input("id", sql.Int, id)
      .input("status", sql.VarChar(20), status)
      .query(`
        UPDATE dbo.users
        SET usr_status = @status
        WHERE auto_id = @id
      `);

    res.json({ message: "Status updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/* ================= LOGIN ================= */

app.post("/api/users/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const userResult = await pool.request()
      .input("username", sql.VarChar(100), username)
      .query(`SELECT * FROM dbo.users WHERE usr_username = @username`);

    if (!userResult.recordset.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const dbUser = userResult.recordset[0];

    if (dbUser.usr_password_hash !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ GET DEFAULT DEPARTMENT (CODE + NAME)
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

res.json({
  id: dbUser.auto_id,
  username: dbUser.usr_username,
  fullName: `${dbUser.usr_last_name}, ${dbUser.usr_first_name}`,
  role: dbUser.fk_usr_group_code,
  status: dbUser.usr_status,
  defaultDepartment
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
});


/* ================= START ================= */

startServer();
