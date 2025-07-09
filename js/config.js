// Configuration file for Flattenhund
// This loads environment variables for the browser environment

// Safe environment variable access
const config = {
  // Supabase configuration - loaded from environment variables
  supabase: {
    url: '', // Will be loaded from .env
    key: ''  // Will be loaded from .env
  },
  
  // Game configuration
  game: {
    title: 'FLAPPY DOG',
    version: '1.0.0'
  },
  
  // Configuration status
  _loaded: false,
  _loading: false
};

// Function to load configuration from environment variables
async function loadSupabaseConfig() {
  if (config._loading) return; // Prevent multiple simultaneous loads
  config._loading = true;
  
  try {
    // Wait a bit for env-loader.js to complete if it's still loading
    let retries = 0;
    while (retries < 50) { // Max 5 seconds wait
      // Try to get from environment variables (loaded by env-loader.js)
      if (typeof window !== 'undefined' && window.process && window.process.env) {
        const url = window.process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (url && key && url !== 'your_supabase_project_url_here' && key !== 'your_supabase_anon_key_here') {
          config.supabase.url = url;
          config.supabase.key = key;
          config._loaded = true;
          console.log('✅ Supabase configuration loaded successfully from environment variables!');
          config._loading = false;
          return true;
        }
      }
      
      // Fallback for Netlify deployment environment variables
      if (typeof window !== 'undefined' && window.ENV) {
        const url = window.ENV.SUPABASE_URL;
        const key = window.ENV.SUPABASE_KEY;
        
        if (url && key) {
          config.supabase.url = url;
          config.supabase.key = key;
          config._loaded = true;
          console.log('✅ Supabase configuration loaded from deployment environment!');
          config._loading = false;
          return true;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    // If we get here, configuration failed to load
    console.log('🔧 Supabase Configuration Status:');
    console.log('URL:', config.supabase.url ? '✅ Loaded' : '❌ Missing');
    console.log('Key:', config.supabase.key ? '✅ Loaded' : '❌ Missing');
    
    console.warn('⚠️ SUPABASE CONFIGURATION INCOMPLETE!');
    console.warn('📝 To enable database features, create a .env file in your project root with:');
    console.warn('   NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co');
    console.warn('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key');
    console.warn('🎮 Game will work locally but leaderboard features won\'t work until configured.');
    console.warn('🔗 Get your Supabase credentials from: https://supabase.com/dashboard');
    
    config._loading = false;
    return false;
    
  } catch (error) {
    console.error('❌ Error loading Supabase configuration:', error);
    config._loading = false;
    return false;
  }
}

// Function to check if configuration is ready
function isConfigReady() {
  return config._loaded && config.supabase.url && config.supabase.key;
}

// Function to wait for configuration to be ready
function waitForConfig(maxWaitMs = 10000) {
  return new Promise((resolve) => {
    if (isConfigReady()) {
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isConfigReady()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > maxWaitMs) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

// Load configuration when script loads
loadSupabaseConfig();

// Export the configuration and helper functions
window.gameConfig = config;
window.isConfigReady = isConfigReady;
window.waitForConfig = waitForConfig;
window.loadSupabaseConfig = loadSupabaseConfig;
