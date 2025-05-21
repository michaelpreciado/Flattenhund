// Leaderboard system for Flappy 8-Bit
// Handles high score tracking and display

// Dummy leaderboard data has been removed to prioritize Supabase.

// Initialize leaderboard
let leaderboard = [];

// DOM elements
let leaderboardEntries;
let newHighScoreForm;
let playerNameInput;
let saveScoreButton;

// Initialize the leaderboard system (now async)
async function initLeaderboard() {
    // Get DOM elements
    leaderboardEntries = document.getElementById('leaderboard-entries');
    newHighScoreForm = document.getElementById('new-high-score-form');
    playerNameInput = document.getElementById('player-name');
    saveScoreButton = document.getElementById('save-score-button');
    
    // Load leaderboard data (awaiting the async operation)
    await loadLeaderboard(); 
    
    // Render the leaderboard with the fetched or default data
    renderLeaderboard(); 
    
    // Add event listener for save button
    if (saveScoreButton) {
        saveScoreButton.addEventListener('click', saveHighScore);
    } else {
        console.warn("Save score button not found in initLeaderboard.");
    }
}

// Load leaderboard from Supabase, falling back to localStorage
async function loadLeaderboard() {
    try {
        if (window.supabaseHelpers && typeof window.supabaseHelpers.getLeaderboard === 'function') {
            const supabaseData = await window.supabaseHelpers.getLeaderboard(10);
            // supabaseData could be an array (empty or with scores) or null/undefined
            if (Array.isArray(supabaseData)) { 
                leaderboard = supabaseData; 
                saveLeaderboardToStorage(); // Cache Supabase response (even if empty array)
                return; // Successfully processed Supabase response
            } else {
                console.warn("Supabase data was not an array or was null/undefined. Falling back to localStorage.");
            }
        } else {
            console.warn("Supabase helpers or getLeaderboard function not available. Falling back to localStorage.");
        }
    } catch (err) {
        console.error('Error loading from Supabase:', err);
        // Proceed to localStorage fallback on error
    }
    
    // Fallback: Load from localStorage if Supabase failed, was not available, or didn't return a valid array
    const savedLeaderboard = localStorage.getItem('flattenhundLeaderboard');
    if (savedLeaderboard) {
        try {
            const parsedData = JSON.parse(savedLeaderboard);
            if (Array.isArray(parsedData)) {
                leaderboard = parsedData;
            } else {
                console.warn("localStorage leaderboard data was not an array. Resetting to empty.");
                leaderboard = [];
            }
        } catch (e) {
            console.error("Error parsing leaderboard from localStorage:", e);
            leaderboard = []; // Reset to empty on parsing error
        }
    } else {
        // No Supabase data and no localStorage data, ensure leaderboard is empty.
        leaderboard = []; 
    }
}

// Save leaderboard to localStorage
function saveLeaderboardToStorage() {
    localStorage.setItem('flattenhundLeaderboard', JSON.stringify(leaderboard));
}

// Render the leaderboard in the DOM
function renderLeaderboard() {
    // Clear existing entries
    leaderboardEntries.innerHTML = '';
    
    // Create and append leaderboard rows
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        
        const rankDiv = document.createElement('div');
        rankDiv.className = 'rank';
        rankDiv.textContent = (index + 1);
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = entry.name;
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score';
        scoreDiv.textContent = entry.score;
        
        row.appendChild(rankDiv);
        row.appendChild(nameDiv);
        row.appendChild(scoreDiv);
        
        leaderboardEntries.appendChild(row);
    });
}

// Check if current score qualifies for leaderboard
function checkHighScore(currentScore) {
    // Get the current personal high score from localStorage (key used by game.js)
    const personalHighScore = parseInt(localStorage.getItem('flattenhundHighScore')) || 0;

    // Sort leaderboard by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);

    // Limit leaderboard to top 10
    leaderboard = leaderboard.slice(0, 10);

    // Check if current score beats any leaderboard entry or if there's space
    const lowestScoreOnLeaderboard = leaderboard.length < 10 ? 0 : leaderboard[leaderboard.length - 1].score;
    const qualifiesForLeaderboard = currentScore > lowestScoreOnLeaderboard || leaderboard.length < 10;

    // Show the high score form if the player beats their personal high score
    // AND their score qualifies for the overall leaderboard.
    if (currentScore > personalHighScore && qualifiesForLeaderboard) {
        if (newHighScoreForm) {
            newHighScoreForm.classList.remove('hidden');
        }
        if (playerNameInput) {
            playerNameInput.focus(); // Focus on the input field
        }
        return true; // Indicates it's a new qualifying personal high score
    } else {
        if (newHighScoreForm) {
            newHighScoreForm.classList.add('hidden');
        }
    }

    // Returns true if the score is high enough for the leaderboard,
    // false otherwise. The form display is a side-effect based on personal best too.
    return qualifiesForLeaderboard;
}

// Save high score to leaderboard (now ensures proper reload and render)
async function saveHighScore() {
    const playerName = playerNameInput.value.trim().toUpperCase() || 'PLAYER';
    const currentScore = window.score; // Global score variable from game.js, ensure window scope if needed
    const character = window.selectedCharacter || 'taz'; // Get the selected character from game.js scope

    if (typeof currentScore === 'undefined') {
        console.error("Score is undefined in saveHighScore. Aborting.");
        if (newHighScoreForm) newHighScoreForm.classList.add('hidden'); // Hide form if error
        return;
    }

    try {
        // Try to save to Supabase if available
        if (window.supabaseHelpers && typeof window.supabaseHelpers.saveScore === 'function') {
            await window.supabaseHelpers.saveScore(playerName, currentScore, character);
        }
    } catch (err) {
        console.error('Error saving to Supabase:', err);
        // Continue to save to localStorage as a backup
    }
    
    // Update local leaderboard array and save to localStorage as a fallback/immediate update
    const newEntry = {
        name: playerName.substring(0, 10), // Limit to 10 characters
        score: currentScore
        // If your Supabase schema includes 'character', add it here too for local consistency:
        // character: character 
    };
    leaderboard.push(newEntry);
    
    // Sort and trim leaderboard
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Keep only top 10
    
    saveLeaderboardToStorage(); // Save the updated local list to localStorage
    
    // Hide the form and clear input
    if (newHighScoreForm) {
        newHighScoreForm.classList.add('hidden');
    }
    if (playerNameInput) {
        playerNameInput.value = '';
    }
    
    // Now, reload the definitive state from Supabase (or localStorage if Supabase fails)
    // and then re-render the UI with it.
    await loadLeaderboard(); // This updates the global `leaderboard` array from the source of truth
    renderLeaderboard();     // This renders the updated global `leaderboard`
}

// Update the game end function to check for high scores
function updateGameEndWithLeaderboard() {
    const originalGameEnd = window.gameEnd;
    
    window.gameEnd = function() {
        // Call the original gameEnd function
        originalGameEnd.apply(this, arguments);
        
        // Hide the form by default
        newHighScoreForm.classList.add('hidden');
        
        // Check if current score qualifies for leaderboard
        checkHighScore(score);
        
        // Always render the leaderboard
        renderLeaderboard();
    };
}

// Initialize when DOM is loaded (now with async handling)
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time to ensure Supabase is initialized (if needed by supabaseHelpers)
    setTimeout(async () => { // Make the callback async
        await initLeaderboard(); // Await initLeaderboard to complete data loading and initial render
        updateGameEndWithLeaderboard();
    }, 500);
});
