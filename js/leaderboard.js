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
    
    // Add keyboard support for name input (Enter key to save)
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveHighScore();
            }
        });
        
        // Clear input when it gets focus
        playerNameInput.addEventListener('focus', function() {
            this.select(); // Select all text when focused
        });
    }
}

// Load leaderboard exclusively from Supabase
async function loadLeaderboard() {
    console.log('Loading leaderboard from Supabase...');
    leaderboard = []; // Default to empty if Supabase fails or is unavailable
    try {
        if (window.supabaseHelpers && typeof window.supabaseHelpers.getLeaderboard === 'function') {
            console.log('Supabase helpers available, fetching leaderboard...');
            const supabaseData = await window.supabaseHelpers.getLeaderboard(10);
            console.log('Supabase leaderboard data received:', supabaseData);
            
            if (Array.isArray(supabaseData) && supabaseData.length > 0) {
                leaderboard = supabaseData; 
                console.log(`Loaded ${leaderboard.length} leaderboard entries from Supabase`);
            } else if (Array.isArray(supabaseData) && supabaseData.length === 0) {
                console.log("Supabase returned empty leaderboard - no scores yet");
                leaderboard = [];
            } else {
                console.warn("Supabase data was not an array or was null/undefined. Leaderboard will be empty.");
                leaderboard = [];
            }
        } else {
            console.warn("Supabase helpers or getLeaderboard function not available. Leaderboard will be empty.");
            leaderboard = [];
        }
    } catch (err) {
        console.error('Error loading leaderboard from Supabase:', err);
        leaderboard = [];
    }
    
    console.log('Final leaderboard data:', leaderboard);
    return leaderboard;
}

// Save leaderboard to localStorage
function saveLeaderboardToStorage() {
    localStorage.setItem('flattenhundLeaderboard', JSON.stringify(leaderboard));
}

// Render the leaderboard in the DOM
function renderLeaderboard() {
    console.log('Rendering leaderboard with data:', leaderboard);
    
    // Clear existing entries
    if (leaderboardEntries) {
        leaderboardEntries.innerHTML = '';
    } else {
        console.error('Leaderboard entries element not found!');
        return;
    }
    
    // Check if we have data to display
    if (!leaderboard || leaderboard.length === 0) {
        // Show empty state message
        const emptyRow = document.createElement('div');
        emptyRow.className = 'leaderboard-row';
        emptyRow.style.textAlign = 'center';
        emptyRow.style.fontStyle = 'italic';
        emptyRow.style.color = '#999';
        emptyRow.innerHTML = `
            <div style="width: 100%; padding: 10px;">
                No scores yet. Be the first to play!
            </div>
        `;
        leaderboardEntries.appendChild(emptyRow);
        return;
    }
    
    // Create and append leaderboard rows
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        
        const rankDiv = document.createElement('div');
        rankDiv.className = 'rank';
        rankDiv.textContent = (index + 1);
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = entry.name || 'ANONYMOUS';
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score';
        scoreDiv.textContent = entry.score || 0;
        
        row.appendChild(rankDiv);
        row.appendChild(nameDiv);
        row.appendChild(scoreDiv);
        
        leaderboardEntries.appendChild(row);
    });
    
    console.log(`Rendered ${leaderboard.length} leaderboard entries`);
}

// Check if current score is a new personal best OR qualifies for leaderboard to prompt for name
function checkAndPromptForPersonalBest(currentScore) {
    const personalHighScore = parseInt(localStorage.getItem('flattenhundHighScore')) || 0;
    
    // Check if it's a new personal best
    const isPersonalBest = currentScore > personalHighScore;
    
    // Check if it qualifies for the leaderboard (top 10)
    let qualifiesForLeaderboard = false;
    if (leaderboard && leaderboard.length > 0) {
        // If leaderboard has less than 10 entries, any score qualifies
        if (leaderboard.length < 10) {
            qualifiesForLeaderboard = currentScore > 0;
        } else {
            // Check if score is higher than the lowest score in top 10
            const lowestScore = leaderboard[leaderboard.length - 1].score;
            qualifiesForLeaderboard = currentScore > lowestScore;
        }
    } else {
        // If no leaderboard data, any score > 0 qualifies
        qualifiesForLeaderboard = currentScore > 0;
    }

    if (isPersonalBest || qualifiesForLeaderboard) {
        let message = '';
        if (isPersonalBest && qualifiesForLeaderboard) {
            message = 'NEW PERSONAL BEST & TOP 10!';
        } else if (isPersonalBest) {
            message = 'NEW PERSONAL BEST!';
        } else {
            message = 'YOU MADE THE TOP 10!';
        }
        
        console.log(`${message} Score: ${currentScore}. Showing form.`);
        if (newHighScoreForm) {
            // Update the form message
            const formMessage = newHighScoreForm.querySelector('p');
            if (formMessage) {
                formMessage.textContent = message;
            }
            newHighScoreForm.classList.remove('hidden');
        }
        if (playerNameInput) {
            playerNameInput.value = ''; // Clear any previous input
            playerNameInput.focus(); // Focus on the input field
        }
        return true; // Indicates should show form
    } else {
        console.log(`No high score achievement: ${currentScore}. Personal best: ${personalHighScore}, Leaderboard qualification: ${qualifiesForLeaderboard}. Hiding form.`);
        if (newHighScoreForm) {
            newHighScoreForm.classList.add('hidden');
        }
    }
    return false; // Not a high score
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

    // Show saving state
    const originalButtonText = saveScoreButton.textContent;
    saveScoreButton.textContent = 'SAVING...';
    saveScoreButton.disabled = true;
    playerNameInput.disabled = true;

    try {
        if (window.supabaseHelpers && typeof window.supabaseHelpers.saveScore === 'function') {
            console.log(`Attempting to save to Supabase: ${playerName}, ${currentScore}, ${character}`);
            await window.supabaseHelpers.saveScore(playerName, currentScore, character);
            console.log("Score saved to Supabase successfully.");
            
            // Show success feedback
            saveScoreButton.textContent = 'SAVED!';
            setTimeout(() => {
                saveScoreButton.textContent = originalButtonText;
            }, 1000);
        } else {
            console.error("Supabase helpers or saveScore function not available. Cannot save score.");
            saveScoreButton.textContent = 'ERROR - TRY AGAIN';
            setTimeout(() => {
                saveScoreButton.textContent = originalButtonText;
                saveScoreButton.disabled = false;
                playerNameInput.disabled = false;
                return; // Don't hide form if there was an error
            }, 2000);
            return;
        }
    } catch (err) {
        console.error('Error saving score to Supabase:', err);
        saveScoreButton.textContent = 'ERROR - TRY AGAIN';
        setTimeout(() => {
            saveScoreButton.textContent = originalButtonText;
            saveScoreButton.disabled = false;
            playerNameInput.disabled = false;
            return; // Don't hide form if there was an error  
        }, 2000);
        return;
    }
    
    // Only hide form and reset if save was successful
    setTimeout(() => {
        // Hide the form and clear input
        if (newHighScoreForm) {
            newHighScoreForm.classList.add('hidden');
        }
        if (playerNameInput) {
            playerNameInput.value = '';
            playerNameInput.disabled = false;
        }
        saveScoreButton.disabled = false;
        
        // After attempting to save, reload the leaderboard from Supabase to reflect any changes
        // (including the newly saved score if it makes the top 10).
        console.log("Reloading leaderboard from Supabase after save attempt.");
        loadLeaderboard().then(() => {
            renderLeaderboard();
        });
    }, 1000); // Wait 1 second to show "SAVED!" message
}

// Update the game end function to check for high scores
function updateGameEndWithLeaderboard() {
    const originalGameEnd = window.gameEnd;
    
    window.gameEnd = async function() {
        // Call the original gameEnd function
        originalGameEnd.apply(this, arguments);
        
        // Hide the form by default before checking for new personal best
        if (newHighScoreForm) {
             newHighScoreForm.classList.add('hidden');
        }
        
        // Refresh leaderboard data when game ends to show latest scores
        console.log('Game ended, refreshing leaderboard...');
        await loadLeaderboard();
        renderLeaderboard();
        
        // Check if current score is a new personal best and show form if it is
        checkAndPromptForPersonalBest(window.score); // window.score from game.js
    };
}

// Add periodic refresh of leaderboard data
function startLeaderboardRefresh() {
    // Refresh leaderboard every 30 seconds when not in a game
    setInterval(async () => {
        // Only refresh if game is not currently running
        if (!window.gameStarted || window.gameOver) {
            console.log('Periodic leaderboard refresh...');
            await loadLeaderboard();
            renderLeaderboard();
        }
    }, 30000); // 30 seconds
}

// Function to manually refresh leaderboard (can be called externally)
async function refreshLeaderboard() {
    console.log('Manual leaderboard refresh requested...');
    await loadLeaderboard();
    renderLeaderboard();
    return leaderboard;
}

// Test Supabase connection for debugging
async function testSupabaseConnection() {
    console.log('Testing Supabase connection...');
    try {
        if (!window.supabaseHelpers) {
            console.error('❌ Supabase helpers not available');
            return false;
        }
        
        console.log('✅ Supabase helpers available');
        
        if (typeof window.supabaseHelpers.getLeaderboard !== 'function') {
            console.error('❌ getLeaderboard function not available');
            return false;
        }
        
        console.log('✅ getLeaderboard function available');
        
        const testData = await window.supabaseHelpers.getLeaderboard(5);
        console.log('✅ Successfully fetched test data:', testData);
        
        return true;
    } catch (error) {
        console.error('❌ Error testing Supabase connection:', error);
        return false;
    }
}

// Expose functions globally for debugging
window.leaderboardDebug = {
    refreshLeaderboard,
    testSupabaseConnection,
    getCurrentLeaderboard: () => leaderboard,
    renderLeaderboard,
    loadLeaderboard
};

// Initialize when DOM is loaded (now with async handling)
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time to ensure Supabase is initialized (if needed by supabaseHelpers)
    setTimeout(async () => { // Make the callback async
        await initLeaderboard(); // Await initLeaderboard to complete data loading and initial render
        updateGameEndWithLeaderboard();
        startLeaderboardRefresh();
    }, 500);
});
