-- Supabase Database Setup for Flattenhund Game
-- Run this SQL in your Supabase SQL Editor

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id SERIAL PRIMARY KEY,
  name VARCHAR(10) NOT NULL,
  score INTEGER NOT NULL,
  character_used VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create game sessions table (optional - for analytics)
CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  character_used VARCHAR(50),
  is_night_mode BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  boost_used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access for game functionality
-- Allow anyone to read leaderboard
CREATE POLICY "Allow public read access to leaderboard" 
ON leaderboard FOR SELECT 
USING (true);

-- Allow anyone to insert new scores
CREATE POLICY "Allow public insert to leaderboard" 
ON leaderboard FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read game sessions
CREATE POLICY "Allow public read access to game_sessions" 
ON game_sessions FOR SELECT 
USING (true);

-- Allow anyone to insert game sessions
CREATE POLICY "Allow public insert to game_sessions" 
ON game_sessions FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update their own game session
CREATE POLICY "Allow public update to game_sessions" 
ON game_sessions FOR UPDATE 
USING (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS leaderboard_score_idx ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS leaderboard_created_at_idx ON leaderboard(created_at DESC);

-- Insert some test data (optional)
INSERT INTO leaderboard (name, score, character_used) VALUES 
('DEV', 100, 'taz'),
('TEST', 50, 'chloe')
ON CONFLICT DO NOTHING; 