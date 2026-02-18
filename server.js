
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306')
};

let pool;

async function initDB() {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('Connected to MySQL Database');

    // Create Table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS operative_technique_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        last_name VARCHAR(100) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        birthdate DATE NOT NULL,
        age INT NOT NULL,
        sex VARCHAR(10) NOT NULL,
        mrn VARCHAR(50) NOT NULL UNIQUE,
        date_of_operation DATE NOT NULL,
        pre_operative_diagnosis TEXT,
        post_operative_diagnosis TEXT,
        technique LONGTEXT,
        operative_findings LONGTEXT,
        reportable_events BOOLEAN DEFAULT FALSE,
        estimated_blood_loss VARCHAR(50),
        urine_output VARCHAR(50),
        attending_surgeon_name VARCHAR(150),
        anesthesiologist_name VARCHAR(150),
        record_datetime DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.query(createTableQuery);
    console.log('Database table verified/created successfully');
  } catch (error) {
    console.error('Database Initialization Error:', error);
  }
}

// Routes
app.get('/api/records', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM operative_technique_records ORDER BY record_datetime DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const { 
      last_name, first_name, middle_name, birthdate, age, sex, mrn, 
      date_of_operation, pre_operative_diagnosis, post_operative_diagnosis, 
      technique, operative_findings, reportable_events, estimated_blood_loss, 
      urine_output, attending_surgeon_name, anesthesiologist_name 
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO operative_technique_records 
      (last_name, first_name, middle_name, birthdate, age, sex, mrn, date_of_operation, pre_operative_diagnosis, post_operative_diagnosis, technique, operative_findings, reportable_events, estimated_blood_loss, urine_output, attending_surgeon_name, anesthesiologist_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [last_name, first_name, middle_name, birthdate, age, sex, mrn, date_of_operation, pre_operative_diagnosis, post_operative_diagnosis, technique, operative_findings, reportable_events, estimated_blood_loss, urine_output, attending_surgeon_name, anesthesiologist_name]
    );

    res.status(201).json({ id: result.insertId, message: 'Record created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await pool.query('UPDATE operative_technique_records SET ? WHERE id = ?', [updates, id]);
    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM operative_technique_records WHERE id = ?', [id]);
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
initDB().then(() => {
  app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
});
