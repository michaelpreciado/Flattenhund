
// Environment variables injected by Netlify build process
// This file is auto-generated - do not edit manually

// This file will be automatically populated by the build process
// Set SUPABASE_DATABASE_URL and SUPABASE_ANON_KEY in your Netlify environment variables

// Default empty configuration - will be populated by build script
const NETLIFY_ENV_CONFIG = {
  SUPABASE_DATABASE_URL: '',
  SUPABASE_ANON_KEY: ''
};

// This will be populated by scripts/build-env.js during Netlify build
// The build script reads environment variables and injects them here
window.NETLIFY_ENV = NETLIFY_ENV_CONFIG;

// Check if we have valid configuration after build
const hasValidConfig = window.NETLIFY_ENV.SUPABASE_ANON_KEY && 
                      window.NETLIFY_ENV.SUPABASE_ANON_KEY.length > 50;

if (hasValidConfig) {
  // Set up environment variables with multiple naming conventions for compatibility
  window.NETLIFY_ENV = {
    SUPABASE_DATABASE_URL: window.NETLIFY_ENV.SUPABASE_DATABASE_URL,
    SUPABASE_ANON_KEY: window.NETLIFY_ENV.SUPABASE_ANON_KEY,
    VITE_SUPABASE_URL: window.NETLIFY_ENV.SUPABASE_DATABASE_URL,
    VITE_SUPABASE_ANON_KEY: window.NETLIFY_ENV.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: window.NETLIFY_ENV.SUPABASE_DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: window.NETLIFY_ENV.SUPABASE_ANON_KEY
  };

  // Also set individual globals for compatibility
  window.SUPABASE_DATABASE_URL = window.NETLIFY_ENV.SUPABASE_DATABASE_URL;
  window.SUPABASE_ANON_KEY = window.NETLIFY_ENV.SUPABASE_ANON_KEY;
  window.VITE_SUPABASE_URL = window.NETLIFY_ENV.SUPABASE_DATABASE_URL;
  window.VITE_SUPABASE_ANON_KEY = window.NETLIFY_ENV.SUPABASE_ANON_KEY;
  window.NEXT_PUBLIC_SUPABASE_URL = window.NETLIFY_ENV.SUPABASE_DATABASE_URL;
  window.NEXT_PUBLIC_SUPABASE_ANON_KEY = window.NETLIFY_ENV.SUPABASE_ANON_KEY;

  console.log('✅ Supabase configuration loaded successfully from environment variables!');
  console.log('🌐 Project URL:', window.NETLIFY_ENV.SUPABASE_DATABASE_URL);
  console.log('🔑 Anon key:', window.NETLIFY_ENV.SUPABASE_ANON_KEY ? 'Configured' : 'Missing');
} else {
  window.NETLIFY_ENV = {};
  console.warn('⚠️ SUPABASE CONFIGURATION NEEDED!');
  console.warn('📝 Please set environment variables in your Netlify dashboard:');
  console.warn('   - SUPABASE_DATABASE_URL');
  console.warn('   - SUPABASE_ANON_KEY');
  console.warn('🔑 Get them from: https://supabase.com/dashboard → Your Project → Settings → API');
}

console.log('🚀 Netlify environment variables loaded:', Object.keys(window.NETLIFY_ENV || {}));
