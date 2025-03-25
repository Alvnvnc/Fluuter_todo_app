const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const dbName = 'todoapp';

// STEP 1: Connect to default 'postgres' DB
const postgresPool = new Pool({
  user: 'pincent',
  host: 'localhost',
  database: 'postgres',
  password: '12345678',
  port: 5432,
});

// STEP 2: Create DB if it doesn't exist
const ensureDatabase = async () => {
  const result = await postgresPool.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );

  if (result.rowCount === 0) {
    await postgresPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database '${dbName}' created.`);
  } else {
    console.log(`ℹ️ Database '${dbName}' already exists.`);
  }
};

// STEP 3: After DB exists, connect to it
let pool;

const connectToMainDb = () => {
  pool = new Pool({
    user: 'pincent',
    host: 'localhost',
    database: dbName,
    password: '12345678',
    port: 5432,
  });

  return pool;
};

// STEP 4: Init table
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL
    );
  `);
  console.log("✅ Table 'tasks' ensured.");
};

// Express routes
app.get('/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY id');
  res.json(result.rows);
});

app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  const result = await pool.query('INSERT INTO tasks (title) VALUES ($1) RETURNING *', [title]);
  res.json(result.rows[0]);
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  await pool.query('UPDATE tasks SET title = $1 WHERE id = $2', [title, id]);
  res.sendStatus(200);
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  res.sendStatus(200);
});

// Init all
(async () => {
  try {
    await ensureDatabase();
    pool = connectToMainDb();
    await initDb();

    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('💥 Startup Error:', err);
  }
})();
