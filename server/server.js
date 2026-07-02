// Local development server for Flattenhund
// Recreates the Supabase backend locally using SQLite (node:sqlite, zero dependencies).
//
// Serves the static game files AND a small JSON API that js/local-db.js talks to:
//   GET    /api/health          - availability check
//   GET    /api/leaderboard     - top scores (?limit=10)
//   POST   /api/scores          - save a score (keeps the player's highest)
//   POST   /api/sessions        - create a game session
//   PATCH  /api/sessions/:id    - finish a game session
//
// Usage: node server/server.js   (or: npm start)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 8000;
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'flattenhund.db');

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------

fs.mkdirSync(DATA_DIR, { recursive: true });
const isNewDatabase = !fs.existsSync(DB_PATH);

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// Seed the same optional test data as database-setup.sql, only on first run
if (isNewDatabase) {
  const seed = db.prepare(
    'INSERT INTO leaderboard (name, score, character_used) VALUES (?, ?, ?)'
  );
  seed.run('DEV', 100, 'taz');
  seed.run('TEST', 50, 'chloe');
  console.log('🌱 New database created and seeded with test data');
}

const statements = {
  topScores: db.prepare(
    'SELECT name, score FROM leaderboard ORDER BY score DESC LIMIT ?'
  ),
  findPlayer: db.prepare(
    'SELECT id, score FROM leaderboard WHERE name = ? LIMIT 1'
  ),
  insertScore: db.prepare(
    'INSERT INTO leaderboard (name, score, character_used) VALUES (?, ?, ?)'
  ),
  updateScore: db.prepare(
    "UPDATE leaderboard SET score = ?, character_used = ?, created_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?"
  ),
  createSession: db.prepare(
    'INSERT INTO game_sessions (character_used, is_night_mode) VALUES (?, ?)'
  ),
  getSession: db.prepare('SELECT * FROM game_sessions WHERE id = ?'),
  endSession: db.prepare(
    "UPDATE game_sessions SET ended_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), score = ?, boost_used_count = ? WHERE id = ?"
  ),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function isValidScore(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

// ---------------------------------------------------------------------------
// API routes (mirror the operations in js/supabase.js)
// ---------------------------------------------------------------------------

async function handleApi(req, res, url) {
  const { pathname } = url;

  // GET /api/health
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, backend: 'sqlite' });
  }

  // GET /api/leaderboard?limit=10
  if (req.method === 'GET' && pathname === '/api/leaderboard') {
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get('limit'), 10) || 10, 1),
      100
    );
    const rows = statements.topScores.all(limit);
    return sendJson(res, 200, rows);
  }

  // POST /api/scores { name, score, character }
  // Same duplicate-prevention logic as saveScore() in js/supabase.js:
  // one row per player name, only updated when the new score is higher.
  if (req.method === 'POST' && pathname === '/api/scores') {
    const body = await readJsonBody(req);
    const name = typeof body.name === 'string' ? body.name.trim().substring(0, 10) : '';
    const character = typeof body.character === 'string' ? body.character.substring(0, 50) : null;

    if (!name || !isValidScore(body.score)) {
      return sendJson(res, 400, { error: 'name (string) and score (non-negative integer) are required' });
    }

    const existing = statements.findPlayer.get(name);
    if (existing) {
      if (body.score > existing.score) {
        statements.updateScore.run(body.score, character, existing.id);
        return sendJson(res, 200, { saved: true, updated: true, previousScore: existing.score });
      }
      return sendJson(res, 200, { saved: true, updated: false, previousScore: existing.score });
    }

    statements.insertScore.run(name, body.score, character);
    return sendJson(res, 201, { saved: true, updated: false, previousScore: null });
  }

  // POST /api/sessions { character, isNightMode }
  if (req.method === 'POST' && pathname === '/api/sessions') {
    const body = await readJsonBody(req);
    const character = typeof body.character === 'string' ? body.character.substring(0, 50) : null;
    const result = statements.createSession.run(character, body.isNightMode ? 1 : 0);
    const session = statements.getSession.get(result.lastInsertRowid);
    return sendJson(res, 201, session);
  }

  // PATCH /api/sessions/:id { score, boostUsedCount }
  const sessionMatch = pathname.match(/^\/api\/sessions\/(\d+)$/);
  if (req.method === 'PATCH' && sessionMatch) {
    const id = Number(sessionMatch[1]);
    const body = await readJsonBody(req);
    const score = isValidScore(body.score) ? body.score : 0;
    const boosts = isValidScore(body.boostUsedCount) ? body.boostUsedCount : 0;
    const result = statements.endSession.run(score, boosts, id);
    if (result.changes === 0) {
      return sendJson(res, 404, { error: 'Session not found' });
    }
    return sendJson(res, 200, { updated: true });
  }

  return sendJson(res, 404, { error: 'Not found' });
}

// ---------------------------------------------------------------------------
// Static file serving (replaces `python3 -m http.server`)
// ---------------------------------------------------------------------------

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function serveStatic(res, pathname) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.join(ROOT_DIR, relativePath);

  // Prevent path traversal outside the project root
  if (!filePath.startsWith(ROOT_DIR + path.sep) && filePath !== path.join(ROOT_DIR, 'index.html')) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      serveStatic(res, decodeURIComponent(url.pathname));
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
    if (!res.headersSent) {
      sendJson(res, 500, { error: error.message });
    }
  }
});

server.listen(PORT, () => {
  console.log(`🎮 Flattenhund local server running at http://localhost:${PORT}`);
  console.log(`💾 SQLite database: ${DB_PATH}`);
});
