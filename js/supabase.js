// Supabase integration for Flattenhund
// This file handles the connection to the Supabase backend

// Initialize with your Supabase project details from environment variables
// This keeps sensitive credentials out of your source code

let supabaseClient;
let isInitialized = false;
let initializationPromise = null;

/**
 * Initialize the Supabase client with proper async configuration loading
 */
async function initSupabase() {
  // Return existing promise if already initializing
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Return success if already initialized
  if (isInitialized && supabaseClient) {
    return true;
  }
  
  initializationPromise = (async () => {
    try {
      // Wait for configuration to be ready (with timeout)
      const configReady = await window.waitForConfig?.(5000) ?? false;
      
      if (!configReady || !window.gameConfig) {
        console.warn('⚠️ Supabase configuration not available - running in offline mode');
        return false;
      }
      
      const { url, key } = window.gameConfig.supabase;
      
      if (!url || !key || url === 'your_supabase_project_url_here' || key === 'your_supabase_anon_key_here') {
        console.warn('⚠️ Supabase credentials not configured - leaderboard features disabled');
        console.info('💡 To enable leaderboard, create a .env file with your Supabase credentials');
        return false;
      }
      
      // Check if the supabase library is loaded
      if (typeof supabase === 'undefined') {
        console.error('❌ Supabase library not loaded');
        return false;
      }
      
      // Initialize the client
      supabaseClient = supabase.createClient(url, key);
      isInitialized = true;
      
      console.log('✅ Supabase client initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error initializing Supabase client:', error);
      return false;
    } finally {
      initializationPromise = null;
    }
  })();
  
  return initializationPromise;
}

// Helper function to ensure Supabase is initialized before use
async function ensureInitialized() {
  if (!isInitialized) {
    await initSupabase();
  }
  return isInitialized && supabaseClient;
}

// Fallback function for when Supabase is not available
function handleSupabaseError(error, operation = 'operation') {
  console.warn(`⚠️ Supabase ${operation} failed:`, error.message || error);
  console.info('💡 Game continues in offline mode - scores won\'t be saved to leaderboard');
  return null;
}

// Get top scores from the leaderboard
async function getLeaderboard(limit = 10) {
  try {
    const ready = await ensureInitialized();
    if (!ready) {
      console.info('📊 Leaderboard unavailable - Supabase not configured');
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    console.log(`📊 Loaded ${data?.length || 0} leaderboard entries`);
    return data;
  } catch (error) {
    return handleSupabaseError(error, 'leaderboard fetch');
  }
}

// Save a score to the leaderboard
async function saveScore(name, score, character) {
  try {
    const ready = await ensureInitialized();
    if (!ready) {
      console.info('💾 Score not saved - Supabase not configured');
      return false;
    }
    
    const { error } = await supabaseClient
      .from('leaderboard')
      .insert([{ 
        name: name.substring(0, 10), 
        score: score,
        character_used: character
      }]);
      
    if (error) throw error;
    console.log(`💾 Score saved: ${name} - ${score} points`);
    return true;
  } catch (error) {
    handleSupabaseError(error, 'score save');
    return false;
  }
}

// Create a game session
async function createGameSession(character, isDarkMode) {
  try {
    const ready = await ensureInitialized();
    if (!ready) {
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('game_sessions')
      .insert([{ 
        character_used: character,
        is_night_mode: isDarkMode
      }])
      .select();
      
    if (error) throw error;
    return data[0];
  } catch (error) {
    return handleSupabaseError(error, 'game session creation');
  }
}

// Update a game session
async function updateGameSession(sessionId, score, boostUsedCount) {
  try {
    const ready = await ensureInitialized();
    if (!ready || !sessionId) {
      return false;
    }
    
    const { error } = await supabaseClient
      .from('game_sessions')
      .update({ 
        ended_at: new Date(),
        score: score,
        boost_used_count: boostUsedCount || 0
      })
      .eq('id', sessionId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error, 'game session update');
    return false;
  }
}

// Check if Supabase features are available
function isSupabaseAvailable() {
  return isInitialized && supabaseClient;
}

// Make functions available globally
window.supabaseHelpers = {
  getLeaderboard,
  saveScore,
  createGameSession,
  updateGameSession,
  isSupabaseAvailable,
  initSupabase
};

// Initialize when the script loads, but don't block if it fails
initSupabase().catch(error => {
  console.warn('⚠️ Supabase initialization failed, continuing in offline mode:', error);
});
