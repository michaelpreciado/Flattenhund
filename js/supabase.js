// Supabase integration for Flattenhund
// This file handles the connection to the Supabase backend

// Initialize with your Supabase project details from config.js
// This keeps sensitive credentials out of your source code
let supabaseUrl = 'https://rkvudsbyuzhyznetoum.supabase.co';
let supabaseKey = ''; // Will be populated from config or Netlify environment variables

// Load configuration from config.js if available
function loadConfig() {
  if (window.gameConfig && window.gameConfig.supabase) {
    supabaseUrl = window.gameConfig.supabase.url;
    supabaseKey = window.gameConfig.supabase.key;
    console.log('Loaded Supabase configuration from config.js');
  }
}

// Initialize the Supabase client
let supabaseClient;

// Wait for the Supabase client to be available
function initSupabase() {
  try {
    // Load configuration first
    loadConfig();
    
    // Check if the supabase library is loaded
    if (typeof supabaseClient === 'undefined' && typeof supabase !== 'undefined') {
      // Initialize the client using the createClient method
      supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized with Netlify integration');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return false;
  }
}

// Fallback function for when Supabase is not available
function handleSupabaseError(error) {
  console.error('Supabase error:', error);
  return null;
}

// Get top scores from the leaderboard
async function getLeaderboard(limit = 10) {
  try {
    if (!initSupabase()) return null;
    
    const { data, error } = await supabaseClient
      .from('leaderboard')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    return null;
  }
}

// Save a score to the leaderboard
async function saveScore(name, score, character) {
  try {
    if (!initSupabase()) return false;
    
    const { error } = await supabaseClient
      .from('leaderboard')
      .insert([{ 
        name: name.substring(0, 10), 
        score: score,
        character_used: character
      }]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    handleSupabaseError(error);
    return false;
  }
}

// Create a game session
async function createGameSession(character, isDarkMode) {
  try {
    if (!initSupabase()) return null;
    
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
    handleSupabaseError(error);
    return null;
  }
}

// Update a game session
async function updateGameSession(sessionId, score, boostUsedCount) {
  try {
    if (!initSupabase() || !sessionId) return false;
    
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
    handleSupabaseError(error);
    return false;
  }
}

// Make functions available globally
window.supabaseHelpers = {
  getLeaderboard,
  saveScore,
  createGameSession,
  updateGameSession
};

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', initSupabase);
