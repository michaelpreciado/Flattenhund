-- SQLite schema for Flattenhund
-- Applied automatically by server/server.js on startup.

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(name) <= 10),
  score INTEGER NOT NULL,
  character_used TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Create game sessions table (optional - for analytics)
CREATE TABLE IF NOT EXISTS game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_used TEXT,
  is_night_mode INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  boost_used_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ended_at TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS leaderboard_score_idx ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS leaderboard_created_at_idx ON leaderboard(created_at DESC);
