#!/usr/bin/env node
// Simple migration runner using pg. Usage:
//   node scripts/apply_migration.js path/to/file.sql [DATABASE_URL]

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const sqlFile = process.argv[2] || path.join(__dirname, '..', 'migrations', '0001_create_user_stats.sql');
  const dbUrl = process.argv[3] || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('DATABASE_URL not provided. Pass as 2nd arg or set DATABASE_URL in backend/.env');
    process.exit(2);
  }

  if (!fs.existsSync(sqlFile)) {
    console.error('SQL file not found:', sqlFile);
    process.exit(3);
  }

  const sql = fs.readFileSync(sqlFile, 'utf8');

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to DB. Running migration:', sqlFile);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
