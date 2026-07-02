// Local SQLite backend integration for Flattenhund
// Drop-in replacement for js/supabase.js: exposes the exact same
// window.supabaseHelpers interface, but talks to the local Node/SQLite
// server (server/server.js) instead of the Supabase cloud.

let isInitialized = false;
let initializationPromise = null;

const API_BASE = '/api';

/**
 * Initialize the local backend connection (pings the health endpoint)
 */
async function initSupabase() {
  // Return existing promise if already initializing
  if (initializationPromise) {
    return initializationPromise;
  }

  // Return success if already initialized
  if (isInitialized) {
    return true;
  }

  initializationPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      const status = await response.json();
      isInitialized = status.ok === true;

      if (isInitialized) {
        console.log(`✅ Local ${status.backend} backend connected`);
      }
      return isInitialized;
    } catch (error) {
      console.warn('⚠️ Local database server not reachable - running in offline mode');
      console.info('💡 Start it with `npm start` (node server/server.js) to enable the leaderboard');
      return false;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

// Helper function to ensure the backend is initialized before use
async function ensureInitialized() {
  if (!isInitialized) {
    await initSupabase();
  }
  return isInitialized;
}

// Fallback function for when the local backend is not available
function handleBackendError(error, operation = 'operation') {
  console.warn(`⚠️ Local database ${operation} failed:`, error.message || error);
  console.info('💡 Game continues in offline mode - scores won\'t be saved to leaderboard');
  return null;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// Get top scores from the leaderboard
async function getLeaderboard(limit = 10) {
  try {
    const ready = await ensureInitialized();
    if (!ready) {
      console.info('📊 Leaderboard unavailable - local database server not running');
      return null;
    }

    const data = await apiRequest(`/leaderboard?limit=${limit}`);
    console.log(`📊 Loaded ${data?.length || 0} leaderboard entries`);
    return data;
  } catch (error) {
    return handleBackendError(error, 'leaderboard fetch');
  }
}

// Save a score to the leaderboard (server keeps only each player's highest)
async function saveScore(name, score, character) {
  try {
    const ready = await ensureInitialized();
    if (!ready) {
      console.info('💾 Score not saved - local database server not running');
      return false;
    }

    const playerName = name.substring(0, 10);
    const result = await apiRequest('/scores', {
      method: 'POST',
      body: JSON.stringify({ name: playerName, score, character }),
    });

    if (result.updated) {
      console.log(`✅ Score updated: ${playerName} - ${score} points (improved by ${score - result.previousScore})`);
    } else if (result.previousScore !== null && result.previousScore !== undefined) {
      console.log(`⚡ ${playerName} already has a higher score (${result.previousScore} vs ${score}) - no update needed`);
    } else {
      console.log(`💾 New score saved: ${playerName} - ${score} points`);
    }
    return true;
  } catch (error) {
    handleBackendError(error, 'score save');
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

    return await apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify({ character, isNightMode: isDarkMode }),
    });
  } catch (error) {
    return handleBackendError(error, 'game session creation');
  }
}

// Update a game session
async function updateGameSession(sessionId, score, boostUsedCount) {
  try {
    const ready = await ensureInitialized();
    if (!ready || !sessionId) {
      return false;
    }

    await apiRequest(`/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ score, boostUsedCount: boostUsedCount || 0 }),
    });
    return true;
  } catch (error) {
    handleBackendError(error, 'game session update');
    return false;
  }
}

// Check if the backend features are available
function isSupabaseAvailable() {
  return isInitialized;
}

// Make functions available globally under the same name the rest of the
// game code (leaderboard.js, game.js) already uses
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
  console.warn('⚠️ Local database initialization failed, continuing in offline mode:', error);
});
