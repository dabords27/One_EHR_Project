const express = require('express');
const cors = require('cors');
const path = require('path');
const { sql, config } = require('./config/db');

const app = express();   // ✅ app must be created first

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ✅ NOW you can use app
console.log("Uploads path:", path.join(__dirname, "uploads"));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../../uploads"))
);

const PORT = process.env.PORT || 5000;
let pool;

async function startServer() {
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to MSSQL Database');

    app.locals.pool = pool;

    app.use('/api/auth', require('./modules/auth/auth.routes'));
    app.use('/api/users', require('./modules/users/user.routes'));
    app.use('/api/departments', require('./modules/departments/department.routes'));
	app.use('/api/admissions', require('./modules/admissions/admissions.routes'));

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    process.exit(1);
  }
}

startServer();