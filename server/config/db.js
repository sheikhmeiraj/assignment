const mysql = require('mysql2/promise');
require('dotenv').config();

// Fail fast with a clear message (avoids confusing MySQL "Access denied for user ''@'localhost'")
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key] || !String(process.env[key]).trim());

if (missing.length > 0) {
  console.error('\n[team-task-manager] Missing or empty required environment variables:\n');
  missing.forEach((key) => console.error(`  • ${key}`));
  console.error(
    '\nFix: copy `server/.env.example` to `server/.env`, fill in MySQL + JWT values, then restart.\n' +
      'Run `npm run dev` from the `server/` folder so dotenv loads `.env` next to `package.json`.\n'
  );
  process.exit(1);
}

const dbPassword =
  process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== null
    ? String(process.env.DB_PASSWORD)
    : '';

// Connection pool for MySQL (used by all controllers)
const pool = mysql.createPool({
  host: String(process.env.DB_HOST).trim(),
  user: String(process.env.DB_USER).trim(),
  password: dbPassword,
  database: String(process.env.DB_NAME).trim(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
