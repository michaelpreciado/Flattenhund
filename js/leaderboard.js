// Leaderboard system for Flappy 8-Bit
// Handles high score tracking and display

// Dummy leaderboard data
const dummyLeaderboard = [
    { name: "TAZ", score: 42 },
    { name: "CHLOE", score: 37 },
    { name: "PIXEL", score: 31 },
    { name: "RETRO", score: 28 },
    { name: "8BIT", score: 25 },
    { name: "ARCADE", score: 22 },
    { name: "MARIO", score: 19 },
    { name: "FLAPPY", score: 16 },
    { name: "GAMER", score: 13 },
    { name: "NOOB", score: 8 }
];

// Initialize leaderboard
let leaderboard = [];

// DOM elements
let leaderboardEntries;
let newHighScoreForm;
let playerNameInput;
let saveScoreButton;

// Initialize the leaderboard system
function initLeaderboard() {
    // Get DOM elements
    leaderboardEntries = document.getElementById('leaderboard-entries');
    newHighScoreForm = document.getElementById('new-high-score-form');
    playerNameInput = document.getElementById('player-name');
    saveScoreButton = document.getElementById('save-score-button');
    
    // Load leaderboard from localStorage or use dummy data
    loadLeaderboard();
    
    // Render the leaderboard
    renderLeaderboard();
    
    // Add event listener for save button
    saveScoreButton.addEventListener('click', saveHighScore);
}

// Load leaderboard from localStorage or use dummy data
function loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem('flatterhundLeaderboard');
    
    if (savedLeaderboard) {
        leaderboard = JSON.parse(savedLeaderboard);
    } else {
        // Use dummy data for first-time users
        leaderboard = [...dummyLeaderboard];
        saveLeaderboardToStorage();
    }
}

// Save leaderboard to localStorage
function saveLeaderboardToStorage() {
    localStorage.setItem('flatterhundLeaderboard', JSON.stringify(leaderboard));
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
    // Get the current high score from localStorage
    const currentHighScore = parseInt(localStorage.getItem('highScore')) || 0;
    
    // Sort leaderboard by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Limit leaderboard to top 10
    leaderboard = leaderboard.slice(0, 10);
    
    // Check if current score beats any leaderboard entry
    const lowestScore = leaderboard.length < 10 ? 0 : leaderboard[leaderboard.length - 1].score;
    const qualifiesForLeaderboard = currentScore > lowestScore || leaderboard.length < 10;
    
    // Only show the high score form if the player beats their personal high score
    if (currentScore > currentHighScore && qualifiesForLeaderboard) {
        // Show the high score form
        newHighScoreForm.classList.remove('hidden');
        return true;
    } else {
        // Hide the form
        newHighScoreForm.classList.add('hidden');
    }
    
    return qualifiesForLeaderboard;
}

// Save high score to leaderboard
function saveHighScore() {
    const playerName = playerNameInput.value.trim().toUpperCase() || 'PLAYER';
    const currentScore = score; // Global score variable from game.js
    
    // Add new entry to leaderboard
    leaderboard.push({
        name: playerName.substring(0, 10), // Limit to 10 characters
        score: currentScore
    });
    
    // Sort and trim leaderboard
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    // Save to localStorage
    saveLeaderboardToStorage();
    
    // Re-render the leaderboard
    renderLeaderboard();
    
    // Hide the form
    newHighScoreForm.classList.add('hidden');
    
    // Clear the input
    playerNameInput.value = '';
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLeaderboard();
    updateGameEndWithLeaderboard();
});
