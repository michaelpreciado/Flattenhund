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

// Load leaderboard exclusively from Supabase
async function loadLeaderboard() {
    leaderboard = []; // Default to empty if Supabase fails or is unavailable
    try {
        if (window.supabaseHelpers && typeof window.supabaseHelpers.getLeaderboard === 'function') {
            const supabaseData = await window.supabaseHelpers.getLeaderboard(10);
            if (Array.isArray(supabaseData)) {
                leaderboard = supabaseData; 
            } else {
                console.warn("Supabase data was not an array or was null/undefined. Leaderboard will be empty.");
            }
        } else {
            console.warn("Supabase helpers or getLeaderboard function not available. Leaderboard will be empty.");
        }
    } catch (err) {
        console.error('Error loading leaderboard from Supabase:', err);
        // Leaderboard remains empty on error
    }
    // No localStorage fallback for loading the public leaderboard display.
    // Personal high score is still managed by game.js in localStorage.
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

// Check if current score is a new personal best to prompt for name
function checkAndPromptForPersonalBest(currentScore) {
    const personalHighScore = parseInt(localStorage.getItem('flattenhundHighScore')) || 0;

    if (currentScore > personalHighScore) {
        console.log(`New personal best: ${currentScore} > ${personalHighScore}. Showing form.`);
        if (newHighScoreForm) {
            newHighScoreForm.classList.remove('hidden');
        }
        if (playerNameInput) {
            playerNameInput.focus(); // Focus on the input field
        }
        return true; // Indicates a new personal best, form should be shown
    } else {
        console.log(`Not a new personal best: ${currentScore} <= ${personalHighScore}. Hiding form.`);
        if (newHighScoreForm) {
            newHighScoreForm.classList.add('hidden');
        }
    }
    return false; // Not a new personal best
}

// Save high score exclusively to Supabase
async function saveHighScore() {
    const playerName = playerNameInput.value.trim().toUpperCase() || 'PLAYER';
    const currentScore = window.score; // Global score variable from game.js
    const character = window.selectedCharacter || 'taz'; // Get selected character from game.js

    if (typeof currentScore === 'undefined') {
        console.error("Score is undefined in saveHighScore. Aborting saving to Supabase.");
        if (newHighScoreForm) newHighScoreForm.classList.add('hidden');
        return;
    }

    try {
        if (window.supabaseHelpers && typeof window.supabaseHelpers.saveScore === 'function') {
            console.log(`Attempting to save to Supabase: ${playerName}, ${currentScore}, ${character}`);
            await window.supabaseHelpers.saveScore(playerName, currentScore, character);
            console.log("Score saved to Supabase successfully.");
        } else {
            console.error("Supabase helpers or saveScore function not available. Cannot save score.");
            // Optionally, inform the user score couldn't be saved online
        }
    } catch (err) {
        console.error('Error saving score to Supabase:', err);
        // Optionally, inform the user score couldn't be saved online
    }
    
    // Hide the form and clear input
    if (newHighScoreForm) {
        newHighScoreForm.classList.add('hidden');
    }
    if (playerNameInput) {
        playerNameInput.value = '';
    }
    
    // After attempting to save, reload the leaderboard from Supabase to reflect any changes
    // (including the newly saved score if it makes the top 10).
    console.log("Reloading leaderboard from Supabase after save attempt.");
    await loadLeaderboard(); 
    renderLeaderboard();     
}

// Update the game end function to check for high scores
function updateGameEndWithLeaderboard() {
    const originalGameEnd = window.gameEnd;
    
    window.gameEnd = function() {
        // Call the original gameEnd function
        originalGameEnd.apply(this, arguments);
        
        // Hide the form by default before checking for new personal best
        if (newHighScoreForm) {
             newHighScoreForm.classList.add('hidden');
        }
        
        // Check if current score is a new personal best and show form if it is
        checkAndPromptForPersonalBest(window.score); // window.score from game.js
        
        // Always render the leaderboard (it will have been loaded in initLeaderboard or after a save)
        // To ensure it's the absolute latest from Supabase, especially if game was long:
        // await loadLeaderboard(); // Consider if needed; saveHighScore also reloads.
        // For now, rely on saveHighScore's reload or initial load.
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
