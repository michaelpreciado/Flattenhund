# Flattenhund

Retro browser game inspired by Flappy Bird, rebuilt with a dog-powered pixel-art vibe, local-friendly setup, and optional online leaderboard support through Supabase.

## Overview

Flattenhund is a lightweight JavaScript canvas game designed to be easy to run, easy to share, and fun to play. It includes character selection, keyboard and touch controls, retro audio, dark mode, service-worker support, and an optional hosted leaderboard.

## Features

- Retro pixel-art browser gameplay
- Keyboard and touch controls
- Character selection
- Local high-score flow
- Optional Supabase-backed online leaderboard
- PWA/service worker support
- Netlify-friendly deployment setup
- Lightweight static architecture with no frontend framework required

## Tech Stack

- HTML5 Canvas
- Vanilla JavaScript
- CSS
- Supabase for leaderboard storage
- Netlify for static deployment

## Getting Started

### Prerequisites

- Python 3, or any static file server
- Optional: Supabase project for leaderboard functionality

### Run locally

```bash
npm run dev
```

Then open:

```text
http://localhost:8000
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start a local static server on port 8000 |
| `npm run start` | Same as dev, for simple hosting/testing |
| `npm run build:env` | Generate deployment environment config |

## Project Structure

```text
Flattenhund/
├── assets/            # Fonts and game assets
├── css/               # Stylesheets
├── js/                # Game logic, config, leaderboard, audio, effects
├── scripts/           # Small build helpers
├── temp/              # Source art/assets used during development
├── index.html         # App entry point
├── style.css          # Main styling
├── manifest.json      # PWA manifest
├── sw.js              # Service worker
└── netlify.toml       # Netlify deployment config
```

## Leaderboard Setup

Leaderboard support is optional. If Supabase credentials are not configured, the game still runs locally in offline mode.

Create environment variables for deployment or local injection:

```bash
SUPABASE_DATABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_public_anon_key
```

You can use the included SQL file as a starting point for database setup:

- `database-setup.sql`

## Deployment

This repo is configured to work well as a static deployment target.

### Netlify

1. Connect the repository to Netlify.
2. Set the required Supabase environment variables if you want the online leaderboard.
3. Deploy the site.

## Notes

- If Supabase is not configured, online leaderboard actions safely fall back instead of breaking gameplay.
- Some development/demo files remain in the repo for iteration and testing.

## License

MIT License
