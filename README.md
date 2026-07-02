# Flattenhund

Retro browser game inspired by Flappy Bird, rebuilt with a dog-powered pixel-art vibe, a zero-dependency local setup, and a SQLite-backed online leaderboard.

## Overview

Flattenhund is a lightweight JavaScript canvas game designed to be easy to run, easy to share, and fun to play. It includes character selection, keyboard and touch controls, retro audio, dark mode with a parallax night scene, service-worker support, and a leaderboard served by a small built-in Node/SQLite server.

## Features

- Retro pixel-art browser gameplay with parallax day/night scenery
- Keyboard and touch controls
- Character selection
- Local high-score flow with persistent nicknames
- SQLite-backed online leaderboard (zero external services)
- PWA/service worker support
- Static-hosting friendly (game runs anywhere; leaderboard needs the Node server)
- No frontend framework, no npm dependencies

## Tech Stack

- HTML5 Canvas
- Vanilla JavaScript
- CSS
- Node.js built-in `node:sqlite` for leaderboard storage
- Vercel/Netlify-compatible static deployment

## Getting Started

### Prerequisites

- Node.js 22.5+ (for the built-in `node:sqlite` module)

### Run locally

```bash
npm start
```

Then open:

```text
http://localhost:8000
```

This serves the game **and** the leaderboard API from one process. The SQLite
database is created automatically at `data/flattenhund.db` on first run. See
[LOCAL_DATABASE.md](LOCAL_DATABASE.md) for the API and schema details.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` / `npm run dev` | Run the game + SQLite leaderboard server on port 8000 |
| `npm run start:static` | Serve the game only (python static server; leaderboard offline) |

## Project Structure

```text
Flattenhund/
├── assets/            # Fonts and game assets
├── css/               # Stylesheets
├── js/                # Game logic, leaderboard, audio, effects
├── server/            # Node/SQLite leaderboard server + schema
├── temp/              # Source art/assets used during development
├── index.html         # App entry point
├── style.css          # Main styling
├── manifest.json      # PWA manifest
├── sw.js              # Service worker
├── vercel.json        # Vercel static deployment config
└── netlify.toml       # Netlify deployment config
```

## Leaderboard

The leaderboard is stored in a local SQLite database and served by
`server/server.js`. There is nothing to configure: no accounts, no API keys,
no environment variables. Delete the `data/` directory to reset it.

When the game is served without the API (e.g. a static host), leaderboard
features disable themselves gracefully and gameplay is unaffected.

## Deployment

The game itself is fully static and deploys as-is to Vercel (see
`vercel.json`) or Netlify. On static hosts the leaderboard runs in offline
mode; to have a live leaderboard, run `npm start` on any host that can run a
Node process.

## License

MIT License
