// PostgreSQL connection pool (node-postgres).
//
// Replaces the Supabase SDK as the single data-access entry point. Every
// service imports the helpers here instead of building its own client.
//
// Connection comes from DATABASE_URL, e.g.
//   postgres://user:pwd@host.postgres.database.azure.com:5432/db?sslmode=require
//
// The pool is created lazily on first use so that simply importing this module
// never throws — unit tests that mock the DB (and suites skipped in CI) can load
// it without DATABASE_URL being set.
require('dotenv').config();
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL in your environment');
  }

  // Azure Database for PostgreSQL requires TLS. We don't ship the Azure CA
  // bundle, so verification is relaxed (the connection is still encrypted).
  // Set DATABASE_SSL=disable for a local Postgres without TLS.
  const ssl =
    process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false };

  pool = new Pool({
    connectionString,
    ssl,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Surface unexpected pool errors instead of crashing silently.
  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
  });

  return pool;
}

// Run a parameterised query. `params` uses $1, $2, ... placeholders.
function query(text, params) {
  return getPool().query(text, params);
}

// Return the first row, or null when there are none.
async function one(text, params) {
  const { rows } = await getPool().query(text, params);
  return rows[0] || null;
}

// Return all rows (possibly empty).
async function many(text, params) {
  const { rows } = await getPool().query(text, params);
  return rows;
}

// Run `fn` inside a transaction. `fn` receives a dedicated client whose
// `.query()` participates in the transaction; it is committed on success and
// rolled back on any thrown error.
async function tx(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Close the pool (used by tests / graceful shutdown).
async function end() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, one, many, tx, end };
