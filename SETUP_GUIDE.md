# 🎮 Flattenhund Leaderboard Setup Guide

## 🔑 Step 1: Get Your Supabase Anon Key

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `rkvudsbyuzhyhznetoum`

2. **Get your API credentials:**
   - Go to **Settings** → **API**
   - Copy the **anon public** key (NOT the service_role key)
   - It should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (much longer)

## 🛠️ Step 2: Set Up Your Database

1. **Go to your Supabase SQL Editor:**
   - In your dashboard, click **SQL Editor**
   - Create a **New query**

2. **Run the database setup:**
   - Copy the contents of `database-setup.sql`
   - Paste it into the SQL Editor
   - Click **Run** to create the tables and policies

## ⚙️ Step 3: Configure Your Project

**Option A: Quick Test (Recommended for immediate testing)**
1. Open `js/netlify-env.js`
2. Replace `YOUR_ANON_KEY_HERE` with your actual anon key
3. Save the file
4. Test your game!

**Option B: Production Setup (For Netlify deployment)**
1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add these variables:
   ```
   SUPABASE_DATABASE_URL = https://rkvudsbyuzhyhznetoum.supabase.co
   SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdnVkc2J5dXpoeWh6bmV0b3VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NTgzNTksImV4cCI6MjA2MTAzNDM1OX0.RRyw8xt8FfDps7JvSMKEw7bYN_6LY-fga2fkj20hjTI
   ```
4. Redeploy your site

## 🧪 Step 4: Test Your Setup

1. **Open your game in a browser**
2. **Open browser console** (F12)
3. **Look for these messages:**
   - ✅ "Supabase configuration loaded successfully!"
   - ✅ "Supabase client initialized successfully"

4. **Test the connection:**
   ```javascript
   // Run this in browser console to test
   window.leaderboardDebug.testSupabaseConnection()
   ```

## 🎯 How It Works

### When Players Lose:
1. Game ends and shows final score
2. If it's a high score, nickname input appears
3. Player enters nickname (max 10 characters)
4. Score is saved to Supabase leaderboard
5. Leaderboard updates immediately

### Nickname Input Features:
- **Max 10 characters** (automatically enforced)
- **Auto-uppercase** for consistent styling
- **Enter key** to save quickly
- **Mobile-friendly** with proper keyboard
- **Offline detection** - shows "ONLINE REQUIRED" when no connection

## 🔧 Troubleshooting

### "LEADERBOARD OFFLINE" message:
- Check your anon key is correctly added
- Verify your internet connection
- Open browser console to see error details

### Scores not saving:
- Ensure database tables are created (Step 2)
- Check Row Level Security policies are in place
- Verify anon key has proper permissions

### Console commands for debugging:
```javascript
// Test Supabase connection
window.leaderboardDebug.testSupabaseConnection()

// Check current leaderboard
window.leaderboardDebug.getCurrentLeaderboard()

// Refresh leaderboard manually
window.leaderboardDebug.refreshLeaderboard()

// Set manual credentials for testing
window.setManualSupabaseCredentials('your_url', 'your_key')
```

## 🔒 Security Notes

- ✅ **Safe to use**: anon key (starts with `eyJ...`)
- ❌ **NEVER use**: service_role key or database password
- ✅ **Row Level Security**: Enabled to protect your data
- ✅ **Public access**: Only for reading/writing game scores

## 🚀 Ready to Play!

Once configured, your players can:
- 🎮 Play the game
- 💀 Lose and see their score
- ✏️ Enter their nickname
- 🏆 See their score on the global leaderboard
- 🔄 Leaderboard updates in real-time

---

**Need help?** Check the browser console for detailed error messages! 