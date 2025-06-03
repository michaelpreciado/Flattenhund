// Environment variable loader for browser applications
// This script loads .env variables and makes them available to the application

/**
 * Load environment variables from .env file
 * Since browsers can't read .env files directly, this provides a bridge
 */
async function loadEnvironmentVariables() {
  try {
    // Try to fetch the .env file (this will work in development)
    const response = await fetch('.env');
    
    if (!response.ok) {
      console.log('📝 .env file not accessible via HTTP, using fallback configuration');
      return false;
    }
    
    const envContent = await response.text();
    const envVars = {};
    
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
    
    // Make variables available globally
    if (!window.process) window.process = {};
    if (!window.process.env) window.process.env = {};
    
    Object.assign(window.process.env, envVars);
    
    console.log('✅ Environment variables loaded from .env file');
    console.log('🔧 Available variables:', Object.keys(envVars));
    
    return true;
  } catch (error) {
    console.log('📝 Could not load .env file, using fallback configuration');
    return false;
  }
}

// Initialize environment variables when the script loads
loadEnvironmentVariables(); 