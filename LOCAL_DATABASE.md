# Local SQLite Database

The Supabase cloud backend has been recreated locally using SQLite, so the game's
leaderboard and game-session tracking work fully offline with **zero external
services and zero npm dependencies** (it uses Node's built-in `node:sqlite` module).

## Quick start

```bash
npm start          # or: node server/server.js
```

Then open http://localhost:8000 — the server hosts both the game and the database API.

Requires **Node.js 22.5+** (for the built-in `node:sqlite` module).

## What was recreated

| Supabase (cloud) | Local equivalent |
|---|---|
| Postgres `leaderboard` table | SQLite `leaderboard` table ([server/schema.sql](server/schema.sql)) |
| Postgres `game_sessions` table | SQLite `game_sessions` table |
| `@supabase/supabase-js` CDN client + [js/supabase.js](js/supabase.js) | [js/local-db.js](js/local-db.js) (same `window.supabaseHelpers` interface) |
| Supabase REST API | JSON API in [server/server.js](server/server.js) |
| `database-setup.sql` (Postgres) | [server/schema.sql](server/schema.sql) (SQLite dialect, applied automatically) |

`js/local-db.js` exposes the identical `window.supabaseHelpers` interface
(`getLeaderboard`, `saveScore`, `createGameSession`, `updateGameSession`,
`isSupabaseAvailable`, `initSupabase`), so `game.js` and `leaderboard.js`
required no changes. The "keep only each player's highest score" duplicate
prevention from the original `saveScore` now runs server-side.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Availability check (used by the client on load) |
| GET | `/api/leaderboard?limit=10` | Top scores, ordered by score descending |
| POST | `/api/scores` | Save `{ name, score, character }`; updates only if higher |
| POST | `/api/sessions` | Create a game session `{ character, isNightMode }` |
| PATCH | `/api/sessions/:id` | End a session with `{ score, boostUsedCount }` |

## Database file

The database is created automatically at `data/flattenhund.db` on first run and
seeded with the same test data as `database-setup.sql` (`DEV`/100, `TEST`/50).
It is gitignored. To reset the leaderboard, stop the server and delete the
`data/` directory.

## Switching back to Supabase

The original Supabase integration is untouched. In `index.html`, swap the
`js/local-db.js` script tag back to the Supabase CDN + `js/supabase.js` pair
(the comment there shows the exact lines), and use `npm run start:static`.
