// Configuration file for Flattenhund
// This loads environment variables for the browser environment

// Safe environment variable access
const config = {
  // Supabase configuration
  supabase: {
    url: 'https://rkvudsbyuzhyznetoum.supabase.co',
    key: '' // The key will be set by Netlify environment variables
  },
  
  // Game configuration
  game: {
    title: 'FLATTENHUND',
    version: '1.0.0'
  }
};

// For Netlify deployment, environment variables will be injected
// during the build process via the NETLIFY_ENV_ prefix
if (typeof window !== 'undefined' && window.ENV) {
  // If Netlify injected environment variables
  config.supabase.url = window.ENV.SUPABASE_URL || config.supabase.url;
  config.supabase.key = window.ENV.SUPABASE_KEY || config.supabase.key;
}

// Export the configuration
window.gameConfig = config;
