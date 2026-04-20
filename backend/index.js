import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { endOfWeek, formatISO, startOfWeek } from 'date-fns';
import { initializeDatabase, pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../frontend/dist');
const isVercel = Boolean(process.env.VERCEL);
const dbReady = initializeDatabase();

app.use(cors());
app.use(express.json());
app.use(async (_request, _response, next) => {
  try {
    await dbReady;
    next();
  } catch (error) {
    next(error);
  }
});

function toNumber(value) {
  return Number(value || 0);
}

function sanitizeOptionalText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function validateAmount(amount) {
  return Number.isFinite(amount) && amount >= 0;
}

app.get('/api/health', async (_request, response) => {
  const result = await pool.query('SELECT NOW() AS now');
  response.json({ ok: true, now: result.rows[0].now });
});

app.get('/api/revenues', async (_request, response) => {
  const result = await pool.query(
    'SELECT id, entry_date::text, amount, note, created_at FROM daily_revenues ORDER BY entry_date DESC, id DESC'
  );
  response.json(result.rows.map((row) => ({ ...row, amount: toNumber(row.amount) })));
});

app.post('/api/revenues', async (request, response) => {
  const { entry_date, amount, note } = request.body;
  const numericAmount = Number(amount);

  if (!entry_date || !validateAmount(numericAmount)) {
    return response.status(400).json({ error: 'Date ou montant invalide.' });
  }

  const result = await pool.query(
    `INSERT INTO daily_revenues (entry_date, amount, note)
     VALUES ($1, $2, $3)
     RETURNING id, entry_date::text, amount, note, created_at`,
    [entry_date, numericAmount, sanitizeOptionalText(note)]
  );

  return response.status(201).json({ ...result.rows[0], amount: toNumber(result.rows[0].amount) });
});

app.put('/api/revenues/:id', async (request, response) => {
  const { id } = request.params;
  const { entry_date, amount, note } = request.body;
  const numericAmount = Number(amount);

  if (!entry_date || !validateAmount(numericAmount)) {
    return response.status(400).json({ error: 'Date ou montant invalide.' });
  }

  const result = await pool.query(
    `UPDATE daily_revenues
     SET entry_date = $1, amount = $2, note = $3
     WHERE id = $4
     RETURNING id, entry_date::text, amount, note, created_at`,
    [entry_date, numericAmount, sanitizeOptionalText(note), id]
  );

  if (!result.rowCount) {
    return response.status(404).json({ error: 'Revenu introuvable.' });
  }

  return response.json({ ...result.rows[0], amount: toNumber(result.rows[0].amount) });
});

app.delete('/api/revenues/:id', async (request, response) => {
  const result = await pool.query('DELETE FROM daily_revenues WHERE id = $1', [request.params.id]);

  if (!result.rowCount) {
    return response.status(404).json({ error: 'Revenu introuvable.' });
  }

  return response.json({ success: true });
});

app.get('/api/expenses', async (_request, response) => {
  const result = await pool.query(
    'SELECT id, expense_date::text, amount, label, note, created_at FROM expenses ORDER BY expense_date DESC, id DESC'
  );
  response.json(result.rows.map((row) => ({ ...row, amount: toNumber(row.amount) })));
});

app.post('/api/expenses', async (request, response) => {
  const { expense_date, amount, label, note } = request.body;
  const numericAmount = Number(amount);

  if (!expense_date || !label?.trim() || !validateAmount(numericAmount)) {
    return response.status(400).json({ error: 'Depense invalide.' });
  }

  const result = await pool.query(
    `INSERT INTO expenses (expense_date, amount, label, note)
     VALUES ($1, $2, $3, $4)
     RETURNING id, expense_date::text, amount, label, note, created_at`,
    [expense_date, numericAmount, label.trim(), sanitizeOptionalText(note)]
  );

  return response.status(201).json({ ...result.rows[0], amount: toNumber(result.rows[0].amount) });
});

app.put('/api/expenses/:id', async (request, response) => {
  const { expense_date, amount, label, note } = request.body;
  const numericAmount = Number(amount);

  if (!expense_date || !label?.trim() || !validateAmount(numericAmount)) {
    return response.status(400).json({ error: 'Depense invalide.' });
  }

  const result = await pool.query(
    `UPDATE expenses
     SET expense_date = $1, amount = $2, label = $3, note = $4
     WHERE id = $5
     RETURNING id, expense_date::text, amount, label, note, created_at`,
    [expense_date, numericAmount, label.trim(), sanitizeOptionalText(note), request.params.id]
  );

  if (!result.rowCount) {
    return response.status(404).json({ error: 'Depense introuvable.' });
  }

  return response.json({ ...result.rows[0], amount: toNumber(result.rows[0].amount) });
});

app.delete('/api/expenses/:id', async (request, response) => {
  const result = await pool.query('DELETE FROM expenses WHERE id = $1', [request.params.id]);

  if (!result.rowCount) {
    return response.status(404).json({ error: 'Depense introuvable.' });
  }

  return response.json({ success: true });
});

app.get('/api/credits', async (_request, response) => {
  const result = await pool.query(
    'SELECT id, customer_name, amount, credit_date::text, status, note, created_at FROM credits ORDER BY credit_date DESC, id DESC'
  );
  response.json(result.rows.map((row) => ({ ...row, amount: toNumber(row.amount) })));
});

app.post('/api/credits', async (request, response) => {
  const { customer_name, amount, credit_date, status, note } = request.body;
  const numericAmount = Number(amount);

  if (!customer_name?.trim() || !credit_date || !validateAmount(numericAmount)) {
    return response.status(400).json({ error: 'Credit invalide.' });
  }

  const safeStatus = status === 'paid' ? 'paid' : 'pending';
  const result = await pool.query(
    `INSERT INTO credits (customer_name, amount, credit_date, status, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, customer_name, amount, credit_date::text, status, note, created_at`,
    [customer_name.trim(), numericAmount, credit_date, safeStatus, sanitizeOptionalText(note)]
  );

  return response.status(201).json({ ...result.rows[0], amount: toNumber(result.rows[0].amount) });
});

app.put('/api/credits/:id', async (request, response) => {
  const { customer_name, amount, credit_date, status, note } = request.body;
  const numericAmount = Number(amount);

  if (!customer_name?.trim() || !credit_date || !validateAmount(numericAmount)) {
    return response.status(400).json({ error: 'Credit invalide.' });
  }

  const safeStatus = status === 'paid' ? 'paid' : 'pending';
  const result = await pool.query(
    `UPDATE credits
     SET customer_name = $1, amount = $2, credit_date = $3, status = $4, note = $5
     WHERE id = $6
     RETURNING id, customer_name, amount, credit_date::text, status, note, created_at`,
    [
      customer_name.trim(),
      numericAmount,
      credit_date,
      safeStatus,
      sanitizeOptionalText(note),
      request.params.id,
    ]
  );

  if (!result.rowCount) {
    return response.status(404).json({ error: 'Credit introuvable.' });
  }

  return response.json({ ...result.rows[0], amount: toNumber(result.rows[0].amount) });
});

app.delete('/api/credits/:id', async (request, response) => {
  const result = await pool.query('DELETE FROM credits WHERE id = $1', [request.params.id]);

  if (!result.rowCount) {
    return response.status(404).json({ error: 'Credit introuvable.' });
  }

  return response.json({ success: true });
});

app.get('/api/summary', async (_request, response) => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [revenueResult, expenseResult, creditResult, countResult] = await Promise.all([
    pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM daily_revenues WHERE entry_date BETWEEN $1 AND $2',
      [formatISO(weekStart, { representation: 'date' }), formatISO(weekEnd, { representation: 'date' })]
    ),
    pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE expense_date BETWEEN $1 AND $2',
      [formatISO(weekStart, { representation: 'date' }), formatISO(weekEnd, { representation: 'date' })]
    ),
    pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM credits WHERE status = 'pending'"),
    pool.query(
      'SELECT COUNT(*) AS total FROM daily_revenues WHERE entry_date BETWEEN $1 AND $2',
      [formatISO(weekStart, { representation: 'date' }), formatISO(weekEnd, { representation: 'date' })]
    ),
  ]);

  const weeklyRevenue = toNumber(revenueResult.rows[0].total);
  const weeklyExpenses = toNumber(expenseResult.rows[0].total);
  const pendingCredits = toNumber(creditResult.rows[0].total);

  response.json({
    weekStart: formatISO(weekStart, { representation: 'date' }),
    weekEnd: formatISO(weekEnd, { representation: 'date' }),
    weeklyRevenue,
    weeklyExpenses,
    weeklyProfit: weeklyRevenue - weeklyExpenses,
    pendingCredits,
    dailyCount: Number(countResult.rows[0].total || 0),
  });
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/')) {
      return next();
    }

    return response.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Une erreur serveur est survenue.' });
});

if (!isVercel) {
  dbReady
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export default app;
