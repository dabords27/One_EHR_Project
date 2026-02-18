const express = require('express');
const cors = require('cors');
const { sql, config } = require('./db/dbconfig');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let pool;

/* ================= DATABASE INIT ================= */

async function startServer() {
  try {
    pool = await sql.connect(config);
    console.log('Connected to MSSQL Database');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('DB Connection Error:', err);
    process.exit(1); // stop if DB fails
  }
}

/* ================= ROUTES ================= */

app.get('/api/departments', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database not connected' });

    const result = await pool.request().query(`
      SELECT auto_id, dept_code, dept_name, dept_status, dept_created_by
      FROM departments
      ORDER BY dept_name
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error('GET ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database not connected' });

    const { dept_code, dept_name, dept_status } = req.body;
    const defaultUser = 'SYSTEM_ADMIN';

    await pool.request()
      .input('dept_code', sql.VarChar(50), dept_code)
      .input('dept_name', sql.VarChar(150), dept_name)
      .input('dept_status', sql.VarChar(20), dept_status)
      .input('dept_created_by', sql.VarChar(100), defaultUser)
      .query(`
        INSERT INTO departments 
        (dept_code, dept_name, dept_status, dept_created_by)
        VALUES (@dept_code, @dept_name, @dept_status, @dept_created_by)
      `);

    res.status(201).json({ message: 'Department created successfully' });

  } catch (error) {
    console.error('INSERT ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/departments/:id', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database not connected' });

    const { id } = req.params;
    const { dept_name, dept_status } = req.body;

    const result = await pool.request()
      .input('auto_id', sql.Int, parseInt(id))
      .input('dept_name', sql.VarChar(150), dept_name)
      .input('dept_status', sql.VarChar(20), dept_status)
      .query(`
        UPDATE departments
        SET dept_name = @dept_name,
            dept_status = @dept_status
        WHERE auto_id = @auto_id
      `);

    res.json({ message: 'Department updated successfully' });

  } catch (error) {
    console.error('UPDATE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

/* ================= START ================= */

startServer();


/* ================= USERLIST API================= */
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
      departments,
      defaultDepartment
    } = req.body;

    await transaction.begin();

    /* ================= GET DEFAULT DEPARTMENT ID ================= */

    const deptResult = await new sql.Request(transaction)
      .input('dept_code', sql.VarChar(50), defaultDepartment)
      .query(`
        SELECT auto_id 
        FROM dbo.departments 
        WHERE dept_code = @dept_code
      `);

    if (deptResult.recordset.length === 0) {
      throw new Error("Default department not found.");
    }

    const defaultDeptId = deptResult.recordset[0].auto_id;

    /* ================= INSERT USER ================= */

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
      .input('fk_usr_default_dept_code', sql.Int, defaultDeptId)
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
          fk_usr_default_dept_code
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
          @fk_usr_default_dept_code
        )
      `);

    /* ================= INSERT MULTI DEPARTMENT ACCESS ================= */

    for (const deptCode of departments) {

      const deptLookup = await new sql.Request(transaction)
        .input('dept_code', sql.VarChar(50), deptCode)
        .query(`
          SELECT auto_id 
          FROM dbo.departments 
          WHERE dept_code = @dept_code
        `);

      if (deptLookup.recordset.length === 0) continue;

      const deptId = deptLookup.recordset[0].auto_id;

      await new sql.Request(transaction)
        .input('fk_dept_code', sql.Int, deptId)
        .input('fk_username', sql.VarChar(100), usr_username)
        .input('fk_usr_default_dept_code', sql.Int, defaultDeptId)
        .query(`
          INSERT INTO dbo.user_department_access (
            fk_dept_code,
            fk_username,
            fk_usr_default_dept_code
          )
          VALUES (
            @fk_dept_code,
            @fk_username,
            @fk_usr_default_dept_code
          )
        `);
    }

    await transaction.commit();

    res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    await transaction.rollback();
    console.error("CREATE USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        u.auto_id,
        u.usr_username,
        u.usr_last_name + ', ' + u.usr_first_name AS full_name,
        u.fk_usr_group_code,
        u.usr_status,
        d.dept_name AS department_name
      FROM dbo.users u
      LEFT JOIN dbo.departments d
        ON u.fk_usr_default_dept_code = d.auto_id
      ORDER BY u.usr_last_name
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

