
// Environment variables injected by Netlify build process
// This file is auto-generated - do not edit manually

// Temporary configuration - ADD YOUR ANON KEY HERE
// Get your anon key from: https://supabase.com/dashboard → Your Project → Settings → API
const TEMP_SUPABASE_CONFIG = {
  SUPABASE_DATABASE_URL: 'https://rkvudsbyuzhyhznetoum.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdnVkc2J5dXpoeWh6bmV0b3VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NTgzNTksImV4cCI6MjA2MTAzNDM1OX0.RRyw8xt8FfDps7JvSMKEw7bYN_6LY-fga2fkj20hjTI' // ← REPLACE THIS WITH YOUR ACTUAL ANON KEY
};

// Check if we have a valid anon key
const hasValidConfig = TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY_HERE' && 
                      TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY.length > 50;

if (hasValidConfig) {
  // Set up environment variables
  window.NETLIFY_ENV = {
    SUPABASE_DATABASE_URL: TEMP_SUPABASE_CONFIG.SUPABASE_DATABASE_URL,
    SUPABASE_ANON_KEY: TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY,
    VITE_SUPABASE_URL: TEMP_SUPABASE_CONFIG.SUPABASE_DATABASE_URL,
    VITE_SUPABASE_ANON_KEY: TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: TEMP_SUPABASE_CONFIG.SUPABASE_DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY
  };

  // Also set individual globals for compatibility
  window.SUPABASE_DATABASE_URL = TEMP_SUPABASE_CONFIG.SUPABASE_DATABASE_URL;
  window.SUPABASE_ANON_KEY = TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY;
  window.VITE_SUPABASE_URL = TEMP_SUPABASE_CONFIG.SUPABASE_DATABASE_URL;
  window.VITE_SUPABASE_ANON_KEY = TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY;
  window.NEXT_PUBLIC_SUPABASE_URL = TEMP_SUPABASE_CONFIG.SUPABASE_DATABASE_URL;
  window.NEXT_PUBLIC_SUPABASE_ANON_KEY = TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY;

  console.log('✅ Supabase configuration loaded successfully!');
  console.log('🌐 Project URL:', TEMP_SUPABASE_CONFIG.SUPABASE_DATABASE_URL);
  console.log('🔑 Anon key:', TEMP_SUPABASE_CONFIG.SUPABASE_ANON_KEY ? 'Configured' : 'Missing');
} else {
  window.NETLIFY_ENV = {};
  console.warn('⚠️ SUPABASE CONFIGURATION NEEDED!');
  console.warn('📝 Please add your anon key to js/netlify-env.js');
  console.warn('🔑 Get it from: https://supabase.com/dashboard → Your Project → Settings → API');
}

console.log('🚀 Netlify environment variables loaded:', Object.keys(window.NETLIFY_ENV || {}));
