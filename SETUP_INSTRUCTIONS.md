# Fix Supabase Connection - Environment Variables Setup

## The Problem
Your game can't save scores to Supabase because the environment variables are not configured in Netlify.

## The Solution
Add these environment variables in your Netlify dashboard:

### Step 1: Get Your Supabase Credentials
From your Supabase dashboard:
- **Project URL**: `https://rkvudsbyuzhyhznetoum.supabase.co` (visible in your screenshot)
- **Anon Key**: Get this from Supabase → Settings → API → Project API keys → `anon` `public`

### Step 2: Add Environment Variables in Netlify
Go to: **Netlify Dashboard** → **Your Site** → **Site configuration** → **Environment variables**

Add these variables:

```
VITE_SUPABASE_URL = https://rkvudsbyuzhyhznetoum.supabase.co
VITE_SUPABASE_ANON_KEY = [YOUR_ANON_KEY_FROM_SUPABASE]
```

**OR** (alternative naming):

```
NEXT_PUBLIC_SUPABASE_URL = https://rkvudsbyuzhyhznetoum.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [YOUR_ANON_KEY_FROM_SUPABASE]
```

### Step 3: Redeploy Your Site
After adding the environment variables, trigger a new deployment in Netlify.

### Step 4: Verify the Fix
After redeployment, check the browser console. You should see:
- `✅ Supabase client initialized successfully`
- No more "Supabase not configured" errors

## How to Get Your Supabase Anon Key

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Select your **Flattenhund** project
3. Go to **Settings** → **API**
4. Copy the **anon** **public** key (not the service_role key!)

## Testing
Once configured, your game should successfully save high scores to the leaderboard! 