import pg from 'pg';

const { Pool } = pg;

const rawConnectionString =
  process.env.DATABASE_URL ||
  'postgres://avnadmin:CHANGE_ME@pg-1866e92d-jacquyngonga-6292.g.aivencloud.com:28415/defaultdb?sslmode=require';

function sanitizeConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('sslcert');
    url.searchParams.delete('sslkey');
    url.searchParams.delete('sslrootcert');
    return url.toString();
  } catch {
    return connectionString;
  }
}

const connectionString = sanitizeConnectionString(rawConnectionString);

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_revenues (
      id SERIAL PRIMARY KEY,
      entry_date DATE NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      expense_date DATE NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
      label TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS credits (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
      credit_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
