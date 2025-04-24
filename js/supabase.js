// Supabase integration for Flattenhund
// This file handles the connection to the Supabase backend

// Initialize with your Supabase project details
// These should be updated with your actual Supabase project URL and anon key
const supabaseUrl = 'https://flattenhund.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYXR0ZW5odW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODIzNDU2NzgsImV4cCI6MTk5NzkyMTY3OH0.dummy_key';

// Initialize the Supabase client
let supabaseClient;

// Wait for the Supabase client to be available
function initSupabase() {
  try {
    // Check if the supabase library is loaded
    if (typeof supabaseClient === 'undefined' && typeof supabase !== 'undefined') {
      // Initialize the client
      supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized');
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
