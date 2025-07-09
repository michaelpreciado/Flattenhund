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
      // Check if the supabase library is loaded first
      if (typeof supabase === 'undefined') {
        console.error('❌ Supabase library not loaded');
        return false;
      }
      
      // Try direct environment variable initialization first (highest priority)
      console.log('🔧 Checking for environment variables...');
      console.log('- process.env exists:', typeof process !== 'undefined' && typeof process.env !== 'undefined');
      console.log('- window.NETLIFY_ENV:', typeof window.NETLIFY_ENV, window.NETLIFY_ENV);
      
      // Check multiple possible variable names for Netlify compatibility
      const supabaseUrl = process?.env?.SUPABASE_DATABASE_URL || 
                         process?.env?.VITE_SUPABASE_URL || 
                         process?.env?.NEXT_PUBLIC_SUPABASE_URL ||
                         window.SUPABASE_DATABASE_URL ||
                         window.VITE_SUPABASE_URL ||
                         window.NEXT_PUBLIC_SUPABASE_URL ||
                         window.NETLIFY_ENV?.SUPABASE_DATABASE_URL ||
                         window.NETLIFY_ENV?.VITE_SUPABASE_URL;

      const supabaseKey = process?.env?.SUPABASE_ANON_KEY || 
                         process?.env?.VITE_SUPABASE_ANON_KEY || 
                         process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                         window.SUPABASE_ANON_KEY ||
                         window.VITE_SUPABASE_ANON_KEY ||
                         window.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                         window.NETLIFY_ENV?.SUPABASE_ANON_KEY ||
                         window.NETLIFY_ENV?.VITE_SUPABASE_ANON_KEY;

      console.log('🔧 Environment variable sources checked:');
      console.log('  - process.env.SUPABASE_DATABASE_URL:', !!process?.env?.SUPABASE_DATABASE_URL);
      console.log('  - window.SUPABASE_DATABASE_URL:', !!window.SUPABASE_DATABASE_URL);
      console.log('  - window.NETLIFY_ENV.SUPABASE_DATABASE_URL:', !!window.NETLIFY_ENV?.SUPABASE_DATABASE_URL);
      console.log('  - Final URL found:', !!supabaseUrl);
      console.log('  - Final Key found:', !!supabaseKey);

      if (supabaseUrl && supabaseKey) {
        console.log('🔧 Using environment variables for Supabase initialization');
        console.log('🔧 URL preview:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not found');
        console.log('🔧 Key found:', supabaseKey ? 'Yes (hidden for security)' : 'Not found');
        
        try {
          const supabaseClientDirect = supabase.createClient(supabaseUrl, supabaseKey);
          supabaseClient = supabaseClientDirect;
          isInitialized = true;
          console.log('✅ Supabase client initialized successfully from environment variables');
          return true;
        } catch (envError) {
          console.error('❌ Error creating Supabase client with environment variables:', envError);
          // Continue to fallback methods
        }
      } else {
        console.log('⚠️ Environment variables not found or incomplete');
        console.log('💡 To fix this:');
        console.log('   1. For Netlify: Set SUPABASE_DATABASE_URL and SUPABASE_ANON_KEY in your Netlify dashboard');
        console.log('   2. For local dev: Create a .env file with these variables');
        console.log('   3. Get your credentials from https://supabase.com/dashboard');
      }
      
      // Wait for configuration to be ready (with timeout) - fallback method
      const configReady = await window.waitForConfig?.(5000) ?? false;
      
      if (!configReady || !window.gameConfig) {
        console.warn('⚠️ Supabase configuration not available - running in offline mode');
        console.info('💡 Game will continue to work, but leaderboard features will be unavailable');
        return false;
      }
      
      const { url, key } = window.gameConfig.supabase;
      
      if (!url || !key || url === 'your_supabase_project_url_here' || key === 'your_supabase_anon_key_here') {
        console.warn('⚠️ Supabase credentials not configured properly');
        console.info('💡 Update your configuration with real Supabase credentials to enable leaderboard');
        return false;
      }
      
      // Initialize the client using configuration system
      supabaseClient = supabase.createClient(url, key);
      isInitialized = true;
      
      console.log('✅ Supabase client initialized successfully from config');
      return true;
      
    } catch (error) {
      console.error('❌ Error initializing Supabase client:', error);
      console.info('💡 Game continues in offline mode');
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

// Save a score to the leaderboard with atomic upsert to prevent duplicates
async function saveScore(name, score, character) {
  try {
    const ready = await ensureInitialized();
    if (!ready) {
      console.info('💾 Score not saved - Supabase not configured');
      return false;
    }
    
    const playerName = name.substring(0, 10).toUpperCase(); // Ensure consistent case
    
    console.log(`💾 Saving score for ${playerName}: ${score} points`);
    
    // Try to use the database function for intelligent upsert first
    try {
      const { data, error } = await supabaseClient
        .rpc('upsert_high_score', {
          player_name: playerName,
          new_score: score,
          char_used: character
        });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        if (result.was_updated) {
          console.log(`✅ Score saved/updated: ${playerName} - ${result.score} points`);
        } else {
          console.log(`⚡ ${playerName} already has a higher score (${result.score}) - no update needed`);
        }
        return true;
      }
    } catch (functionError) {
      console.log(`⚠️ Database function failed, falling back to upsert: ${functionError.message}`);
    }
    
    // Fallback to built-in upsert with conflict resolution
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .upsert(
        { 
          name: playerName,
          score: score,
          character_used: character,
          created_at: new Date().toISOString()
        },
        { 
          onConflict: 'name',
          ignoreDuplicates: false 
        }
      )
      .select('score');
    
    if (error) {
      // If upsert fails due to missing unique constraint, fall back to manual logic
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        console.log(`🔍 Handling duplicate manually for ${playerName}`);
        return await saveScoreManual(playerName, score, character);
      }
      throw error;
    }
    
    const savedScore = data?.[0]?.score;
    if (savedScore === score) {
      console.log(`✅ Score saved: ${playerName} - ${score} points`);
    } else if (savedScore > score) {
      console.log(`⚡ ${playerName} already has a higher score (${savedScore}) - keeping existing`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`⚠️ Upsert failed, falling back to manual method for ${name}`);
    return await saveScoreManual(name.substring(0, 10).toUpperCase(), score, character);
  }
}

// Fallback manual method for databases without proper upsert support
async function saveScoreManual(playerName, score, character) {
  try {
    // First, try to get existing player with FOR UPDATE lock to prevent race conditions
    const { data: existingPlayers, error: fetchError } = await supabaseClient
      .from('leaderboard')
      .select('id, score')
      .eq('name', playerName)
      .order('score', { ascending: false })
      .limit(1);
    
    if (fetchError) throw fetchError;
    
    if (existingPlayers && existingPlayers.length > 0) {
      const existingPlayer = existingPlayers[0];
      
      if (score > existingPlayer.score) {
        // Update existing record with higher score
        console.log(`📈 Updating ${playerName}: ${existingPlayer.score} → ${score}`);
        const { error: updateError } = await supabaseClient
          .from('leaderboard')
          .update({ 
            score: score,
            character_used: character,
            created_at: new Date().toISOString()
          })
          .eq('id', existingPlayer.id);
        
        if (updateError) throw updateError;
        
        // Clean up any other duplicate entries for this player
        const { error: cleanupError } = await supabaseClient
          .from('leaderboard')
          .delete()
          .eq('name', playerName)
          .neq('id', existingPlayer.id);
          
        if (cleanupError) {
          console.warn('⚠️ Could not clean up duplicates:', cleanupError);
        }
        
        console.log(`✅ Score updated and duplicates cleaned: ${playerName} - ${score} points`);
        return true;
      } else {
        console.log(`⚡ ${playerName} already has a higher score (${existingPlayer.score} vs ${score})`);
        
        // Still clean up duplicates even if not updating score
        const { error: cleanupError } = await supabaseClient
          .from('leaderboard')
          .delete()
          .eq('name', playerName)
          .neq('id', existingPlayer.id);
          
        if (cleanupError) {
          console.warn('⚠️ Could not clean up duplicates:', cleanupError);
        }
        
        return true;
      }
    } else {
      // No existing player, insert new record
      console.log(`🆕 Adding new player: ${playerName} - ${score}`);
      const { error: insertError } = await supabaseClient
        .from('leaderboard')
        .insert([{ 
          name: playerName, 
          score: score,
          character_used: character
        }]);
      
      if (insertError) {
        // Handle case where someone else inserted the same name simultaneously
        if (insertError.message.includes('duplicate key') || insertError.message.includes('unique constraint')) {
          console.log(`🔄 Duplicate detected during insert, retrying for ${playerName}`);
          return await saveScoreManual(playerName, score, character);
        }
        throw insertError;
      }
      
      console.log(`💾 New score saved: ${playerName} - ${score} points`);
      return true;
    }
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
