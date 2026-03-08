import { defineEventHandler, setResponseStatus, setResponseHeader } from 'h3';
import { Pool } from 'pg';

// Build-time constants: replaced by nitro.replace (server bundle) and
// vite define (client bundle) in vite.config.ts. The typeof guard is a
// dev-mode fallback — in Vite dev the Nitro server runs without Rollup
// transforms, so the replace may not apply. In production the Nitro
// bundle always has these replaced at build time.
declare const __ANALOG_VERSION__: string;
declare const __BUILD_TIME__: string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ANALOG_VERSION: string = typeof __ANALOG_VERSION__ !== 'undefined'
  ? __ANALOG_VERSION__
  : 'dev';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BUILD_TIME: string = typeof __BUILD_TIME__ !== 'undefined'
  ? __BUILD_TIME__
  : new Date().toISOString();

// Singleton pool — created once per Nitro worker, reused across requests.
// Connects using Zerops-provided env vars (${db_hostname}, ${db_port}, etc.)
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env['DB_HOST'],
      port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
      user: process.env['DB_USER'],
      password: process.env['DB_PASS'],
      database: process.env['DB_NAME'],
    });
  }
  return pool;
}

export default defineEventHandler(async (event) => {
  let dbStatus = 'Connected';
  let greeting = 'Hello from Zerops!';
  let httpStatus = 200;

  try {
    // Query the greetings table seeded by migrate.cjs at deploy time.
    // Proves DB connectivity AND that idempotent migrations ran correctly.
    const result = await getPool().query<{ message: string }>(
      'SELECT message FROM greetings LIMIT 1'
    );
    if (result.rows.length > 0) {
      greeting = result.rows[0].message;
    }
  } catch (err) {
    dbStatus = `ERROR: ${(err as Error).message}`;
    httpStatus = 503;
  }

  // Return 503 on DB failure — still renders the UI to show specific error.
  setResponseStatus(event, httpStatus);
  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8');

  const isOk = httpStatus === 200;
  const env = process.env['NODE_ENV'] ?? 'unknown';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Analog SSR &middot; Zerops Hello World</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f1117;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #1a1d2e;
      border: 1px solid #2d3748;
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 540px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }
    .logos {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .sep { color: #4a5568; font-size: 1.4rem; font-weight: 300; }
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #f7fafc;
      margin-bottom: 0.4rem;
      line-height: 1.3;
    }
    .subtitle {
      color: #718096;
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }
    .rows {
      border: 1px solid #2d3748;
      border-radius: 8px;
      overflow: hidden;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.1rem;
      border-bottom: 1px solid #2d3748;
    }
    .row:last-child { border-bottom: none; }
    .label {
      color: #718096;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .value {
      color: #e2e8f0;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    }
    .ok  { color: #68d391; }
    .err { color: #fc8181; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logos">
      <!-- Analog logo (Angular-based, red triangle mark) -->
      <svg width="108" height="28" viewBox="0 0 108 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Analog">
        <polygon points="13,1 25,25 1,25" fill="#DD0031"/>
        <polygon points="13,1 25,25 13,25" fill="#C3002F"/>
        <polygon points="13,6 22,24 4,24" fill="#1a1d2e"/>
        <text x="30" y="20" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="15" font-weight="700" fill="#e2e8f0">Analog</text>
      </svg>
      <span class="sep">&times;</span>
      <!-- Zerops logo (diamond shape) -->
      <svg width="90" height="28" viewBox="0 0 90 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Zerops">
        <polygon points="11,2 20,14 11,26 2,14" fill="#6C63FF"/>
        <text x="26" y="20" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="15" font-weight="700" fill="#e2e8f0">Zerops</text>
      </svg>
    </div>

    <h1>${escapeHtml(greeting)}</h1>
    <p class="subtitle">Analog running on Zerops SSR &ndash; Node.js at runtime.</p>

    <div class="rows">
      <div class="row">
        <span class="label">Framework</span>
        <span class="value">Analog ${escapeHtml(ANALOG_VERSION)}</span>
      </div>
      <div class="row">
        <span class="label">Environment</span>
        <span class="value">${escapeHtml(env)}</span>
      </div>
      <div class="row">
        <span class="label">Build time</span>
        <span class="value">${escapeHtml(BUILD_TIME)}</span>
      </div>
      <div class="row">
        <span class="label">Database</span>
        <span class="value ${isOk ? 'ok' : 'err'}">${escapeHtml(dbStatus)}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
