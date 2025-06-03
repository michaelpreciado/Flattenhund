// Environment variable loader for browser applications
// This script loads .env variables and makes them available to the application
// Works with both local .env files and Netlify environment variables

/**
 * Load environment variables from multiple sources
 * Priority: Netlify env vars > .env file > fallback
 */
async function loadEnvironmentVariables() {
  const envVars = {};
  
  // 1. First, try Netlify build-time environment variables
  // Netlify injects these at build time as global variables
  if (typeof window !== 'undefined') {
    // Check for Netlify's injected environment variables
    if (window.NETLIFY_ENV) {
      Object.assign(envVars, window.NETLIFY_ENV);
      console.log('✅ Loaded environment variables from Netlify build');
    }
    
    // Check for Netlify's Supabase integration variables and other naming patterns
    const netlifyVars = {
      // Netlify's Supabase integration variables (correct names)
      SUPABASE_DATABASE_URL: window.SUPABASE_DATABASE_URL,
      SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY,
      // Other common naming patterns
      VITE_SUPABASE_URL: window.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: window.VITE_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_URL: window.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: window.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    
    Object.keys(netlifyVars).forEach(key => {
      if (netlifyVars[key]) {
        envVars[key] = netlifyVars[key];
        console.log(`✅ Found ${key} from global variable`);
      }
    });
  }
  
  // 2. If no Netlify vars found, try to fetch the .env file (local development)
  if (Object.keys(envVars).length === 0) {
    try {
      const response = await fetch('.env');
      
      if (response.ok) {
        const envContent = await response.text();
        
        // Parse the .env file content
        envContent.split('\n').forEach(line => {
          line = line.trim();
          if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              envVars[key.trim()] = valueParts.join('=').trim();
            }
          }
        });
        
        console.log('✅ Environment variables loaded from .env file');
      } else {
        console.log('📝 No .env file found, this is normal for Netlify deployment');
      }
    } catch (error) {
      console.log('📝 Could not load .env file, using deployment configuration');
    }
  }
  
  // 3. Make variables available globally with all naming conventions
  if (!window.process) window.process = {};
  if (!window.process.env) window.process.env = {};
  
  // Support multiple naming conventions and cross-compatibility
  Object.keys(envVars).forEach(key => {
    window.process.env[key] = envVars[key];
    
    // Handle Netlify's Supabase integration variables
    if (key === 'SUPABASE_DATABASE_URL') {
      window.process.env.VITE_SUPABASE_URL = envVars[key];
      window.process.env.NEXT_PUBLIC_SUPABASE_URL = envVars[key];
    }
    
    if (key === 'SUPABASE_ANON_KEY') {
      window.process.env.VITE_SUPABASE_ANON_KEY = envVars[key];
      window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = envVars[key];
    }
    
    // Cross-compatibility: if we have VITE_ prefix, also set others
    if (key.startsWith('VITE_SUPABASE_URL')) {
      window.process.env.NEXT_PUBLIC_SUPABASE_URL = envVars[key];
      window.process.env.SUPABASE_DATABASE_URL = envVars[key];
    }
    
    if (key.startsWith('VITE_SUPABASE_ANON_KEY')) {
      window.process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = envVars[key];
      window.process.env.SUPABASE_ANON_KEY = envVars[key];
    }
    
    // Handle NEXT_PUBLIC_ prefix
    if (key.startsWith('NEXT_PUBLIC_SUPABASE_URL')) {
      window.process.env.VITE_SUPABASE_URL = envVars[key];
      window.process.env.SUPABASE_DATABASE_URL = envVars[key];
    }
    
    if (key.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      window.process.env.VITE_SUPABASE_ANON_KEY = envVars[key];
      window.process.env.SUPABASE_ANON_KEY = envVars[key];
    }
  });
  
  // Debug logging to help diagnose issues
  console.log('🔧 Environment variable check:');
  console.log('- SUPABASE_DATABASE_URL:', window.process.env.SUPABASE_DATABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_ANON_KEY:', window.process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('- All loaded vars:', Object.keys(envVars));
  
  if (Object.keys(envVars).length > 0) {
    console.log('🔧 Environment variables loaded successfully');
    return true;
  } else {
    console.log('📝 No environment variables loaded - using default configuration');
    return false;
  }
}

// Initialize environment variables when the script loads
loadEnvironmentVariables().then(loaded => {
  if (loaded) {
    // Dispatch event to notify other scripts that env vars are ready
    window.dispatchEvent(new CustomEvent('envVarsLoaded'));
  }
}); 