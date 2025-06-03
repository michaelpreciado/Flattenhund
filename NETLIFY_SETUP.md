# 🚀 Netlify + Supabase Setup for Flattenhund

## Quick Setup Guide

### 1. 🔑 Set Up Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to **Settings** → **API**
4. Copy your:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIs...`

### 2. 📁 Local Development Setup

Create a `.env` file in your project root:

```bash
# For local development - use EITHER format:

# Option A: Vite/Netlify format (recommended)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Option B: Next.js format (also supported)  
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 🌐 Netlify Deployment Setup

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Netlify configuration"
git push origin main
```

#### Step 2: Connect to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Connect your GitHub repo
4. **Build settings**:
   - Build command: `npm run build:env`
   - Publish directory: `.` (root)

#### Step 3: Add Environment Variables in Netlify
1. Go to **Site Settings** → **Environment Variables**
2. Add these variables:
   ```
   VITE_SUPABASE_URL = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key-here
   ```

### 4. 🗄️ Set Up Database Tables (Optional)

If you want the leaderboard to work, run these SQL commands in your Supabase SQL editor:

```sql
-- Leaderboard table
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  name VARCHAR(10) NOT NULL,
  score INTEGER NOT NULL,
  character_used VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game sessions table (optional analytics)
CREATE TABLE game_sessions (
  id SERIAL PRIMARY KEY,
  character_used VARCHAR(50),
  is_night_mode BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  boost_used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboard
CREATE POLICY "Allow public read access" ON leaderboard FOR SELECT TO public USING (true);

-- Allow public insert to leaderboard  
CREATE POLICY "Allow public insert" ON leaderboard FOR INSERT TO public WITH CHECK (true);
```

### 5. 🧪 Testing

#### Local Testing:
```bash
npm run dev
# Opens on http://localhost:8000
```

#### Production Testing:
1. Deploy to Netlify
2. Check browser console for:
   - ✅ "Netlify environment variables loaded"
   - ✅ "Supabase client initialized successfully"

### 6. 🔍 Troubleshooting

#### If Supabase isn't working:

1. **Check Netlify Build Logs**:
   - Look for environment variable injection errors
   - Verify build script ran successfully

2. **Check Browser Console**:
   ```javascript
   // Run in browser console to debug:
   console.log('Config:', window.gameConfig);
   console.log('Env vars:', window.NETLIFY_ENV);
   ```

3. **Common Issues**:
   - Environment variables not set in Netlify UI
   - Wrong variable names (use `VITE_` prefix)
   - Missing build command in netlify.toml

#### Environment Variable Priority:
1. 🥇 Netlify environment variables (production)
2. 🥈 Local `.env` file (development)  
3. 🥉 Graceful fallback (offline mode)

### 7. 🎯 What Works Now:

✅ **Automatic environment detection**  
✅ **Local development with .env file**  
✅ **Netlify deployment with env vars**  
✅ **Graceful offline fallback**  
✅ **Cross-compatible env var formats**  
✅ **Helpful console logging**  

Your game will work perfectly whether you:
- Run locally with `.env` file
- Deploy to Netlify with environment variables
- Run without any configuration (offline mode)

## 🚀 Deploy Command:
```bash
git add . && git commit -m "Ready for Netlify" && git push
```

Then your Netlify site will auto-deploy with Supabase configured! 🎉 