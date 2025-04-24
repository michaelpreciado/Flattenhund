-- Flattenhund Game Database Setup
-- Run this script in your Supabase SQL Editor to set up the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    character_used VARCHAR(20) NOT NULL, -- 'taz' or 'chloe'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0,
    boost_used_count INTEGER DEFAULT 0,
    is_night_mode BOOLEAN DEFAULT false
);

-- Leaderboard Table
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    character_used VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL
);

-- Game Settings Table
CREATE TABLE IF NOT EXISTS game_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    pipe_gap INTEGER DEFAULT 190,
    gravity DECIMAL(4,2) DEFAULT 0.25,
    flap_force DECIMAL(4,2) DEFAULT -6.0,
    boost_force DECIMAL(4,2) DEFAULT -10.0,
    boost_forward DECIMAL(4,2) DEFAULT 3.0,
    boost_duration INTEGER DEFAULT 60,
    boost_cooldown INTEGER DEFAULT 180,
    pipe_spawn_interval INTEGER DEFAULT 2200,
    CHECK (id = 1) -- Ensures only one settings record
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_character ON leaderboard(character_used);

-- Insert default game settings
INSERT INTO game_settings (
    pipe_gap, gravity, flap_force, boost_force, 
    boost_forward, boost_duration, boost_cooldown, pipe_spawn_interval
) VALUES (
    190, 0.25, -6.0, -10.0, 
    3.0, 60, 180, 2200
) ON CONFLICT (id) DO NOTHING;

-- Insert some dummy leaderboard data
INSERT INTO leaderboard (name, score, character_used) VALUES
('TAZ', 42, 'taz'),
('CHLOE', 37, 'chloe'),
('PIXEL', 31, 'taz'),
('RETRO', 28, 'chloe'),
('8BIT', 25, 'taz'),
('ARCADE', 22, 'chloe'),
('MARIO', 19, 'taz'),
('FLAPPY', 16, 'chloe'),
('GAMER', 13, 'taz'),
('NOOB', 8, 'chloe');

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access where needed
-- Public read access for leaderboard
CREATE POLICY "Public leaderboard access" 
ON leaderboard FOR SELECT USING (true);

-- Public read access for game settings
CREATE POLICY "Public game settings access" 
ON game_settings FOR SELECT USING (true);

-- Public insert access for leaderboard (anonymous users can add scores)
CREATE POLICY "Anyone can add scores" 
ON leaderboard FOR INSERT WITH CHECK (true);

-- Public insert access for game sessions (anonymous users can create sessions)
CREATE POLICY "Anyone can create game sessions" 
ON game_sessions FOR INSERT WITH CHECK (true);

-- Public update access for game sessions (anonymous users can update their sessions)
CREATE POLICY "Anyone can update their game sessions" 
ON game_sessions FOR UPDATE USING (true);

-- Notify when setup is complete
DO $$
BEGIN
    RAISE NOTICE 'Flattenhund database setup complete!';
END $$;
