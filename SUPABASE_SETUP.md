# Supabase Setup Guide for Flattenhund

Your game is currently running in offline mode because Supabase credentials are not configured. Here's how to fix it:

## 🎯 Quick Fix Options

### Option 1: Netlify Deployment (Recommended)
1. Go to your Netlify dashboard
2. Find your Flattenhund site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:
   - `SUPABASE_DATABASE_URL` = Your Supabase project URL
   - `SUPABASE_ANON_KEY` = Your Supabase anonymous key

### Option 2: Local Development
1. Create a `.env` file in your project root
2. Add these lines (replace with your actual values):
   ```
   SUPABASE_DATABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

## 📋 Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (if you don't have one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → use as `SUPABASE_DATABASE_URL`
   - **anon/public key** → use as `SUPABASE_ANON_KEY`

## 🗄️ Database Setup

You'll need to create a `leaderboard` table in your Supabase database:

```sql
CREATE TABLE leaderboard (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(10) NOT NULL,
  score INTEGER NOT NULL,
  character_used VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for better performance
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the leaderboard
CREATE POLICY "Allow read access to leaderboard" ON leaderboard
FOR SELECT USING (true);

-- Allow anyone to insert scores
CREATE POLICY "Allow insert to leaderboard" ON leaderboard
FOR INSERT WITH CHECK (true);
```

## 🔧 Testing Your Setup

1. Open the test page: `test-env.html` in your browser
2. Click "Load Environment Scripts"
3. Click "Check All Variables" - should show ✅ for URL and Key
4. Click "Test Supabase" - should connect successfully

## ❌ Troubleshooting

### "No environment variables found"
- Check that variables are set in Netlify dashboard
- For local dev, ensure `.env` file exists and has correct format
- Run `npm run build:env` after setting variables

### "Supabase library not loaded"
- Check internet connection
- Ensure CDN links are working in your HTML

### "Connection failed"
- Verify your Supabase project URL and key are correct
- Check that your Supabase project is active
- Ensure database table exists

## 🚀 After Setup

Once configured, your game will:
- ✅ Save high scores to online leaderboard
- ✅ Display global leaderboard
- ✅ Work in full online mode

The game will continue to work offline but leaderboard features will be disabled when there's no internet connection. 