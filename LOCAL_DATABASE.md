# SQLite Database

The game's leaderboard and game-session tracking are backed by SQLite with
**zero external services and zero npm dependencies** (it uses Node's built-in
`node:sqlite` module).

## Quick start

```bash
npm start          # or: node server/server.js
```

Then open http://localhost:8000 — the server hosts both the game and the database API.

Requires **Node.js 22.5+** (for the built-in `node:sqlite` module).

## Architecture

| Piece | Role |
|---|---|
| [server/server.js](server/server.js) | Serves the static game files and the JSON API |
| [server/schema.sql](server/schema.sql) | SQLite schema, applied automatically on startup |
| [js/local-db.js](js/local-db.js) | Browser client exposing `window.gameDB` |

`js/local-db.js` exposes the `window.gameDB` interface (`getLeaderboard`,
`saveScore`, `createGameSession`, `updateGameSession`, `isAvailable`, `init`)
consumed by `game.js` and `leaderboard.js`. The "keep only each player's
highest score" duplicate prevention runs server-side.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Availability check (used by the client on load) |
| GET | `/api/leaderboard?limit=10` | Top scores, ordered by score descending |
| POST | `/api/scores` | Save `{ name, score, character }`; updates only if higher |
| POST | `/api/sessions` | Create a game session `{ character, isNightMode }` |
| PATCH | `/api/sessions/:id` | End a session with `{ score, boostUsedCount }` |

## Database file

The database is created automatically at `data/flattenhund.db` on first run
and seeded with two sample rows (`DEV`/100, `TEST`/50). It is gitignored. To
reset the leaderboard, stop the server and delete the `data/` directory.

## Static hosting

When the game is served without the API (e.g. Vercel/Netlify static hosting,
or `npm run start:static`), the client's health check fails and leaderboard
features disable themselves gracefully — gameplay is unaffected.
