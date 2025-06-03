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

// Rendering state management
let isRendering = false;
let renderTimeout = null;
let isLoading = false;

// Initialize the leaderboard system (now async)
async function initLeaderboard() {
    // Get DOM elements
    leaderboardEntries = document.getElementById('leaderboard-entries');
    newHighScoreForm = document.getElementById('new-high-score-form');
    playerNameInput = document.getElementById('player-name');
    saveScoreButton = document.getElementById('save-score-button');
    
    // Check leaderboard mode and show status
    const isOnlineMode = window.supabaseHelpers && 
                        window.supabaseHelpers.isSupabaseAvailable &&
                        window.supabaseHelpers.isSupabaseAvailable();
    
    if (isOnlineMode) {
        console.log('🌐 Leaderboard: Online mode - scores will be saved to cloud database');
        if (window.showMobileHint) {
            window.showMobileHint('🌐 Online leaderboard active!', 2000);
        }
    } else {
        console.log('📱 Leaderboard: Offline mode - scores will be saved locally only');
        if (window.showMobileHint) {
            window.showMobileHint('📱 Offline mode - scores saved locally', 3000);
        }
    }
    
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

// Load leaderboard from Supabase with localStorage fallback
async function loadLeaderboard() {
    console.log('Loading leaderboard...');
    leaderboard = []; // Default to empty if both sources fail
    
    try {
        // First, try to load from Supabase
        if (window.supabaseHelpers && 
            typeof window.supabaseHelpers.getLeaderboard === 'function' &&
            window.supabaseHelpers.isSupabaseAvailable()) {
            
            console.log('Supabase helpers available, fetching leaderboard...');
            const supabaseData = await window.supabaseHelpers.getLeaderboard(10);
            console.log('Supabase leaderboard data received:', supabaseData);
            
            if (Array.isArray(supabaseData) && supabaseData.length > 0) {
                leaderboard = supabaseData; 
                console.log(`✅ Loaded ${leaderboard.length} leaderboard entries from Supabase`);
                return leaderboard;
            } else if (Array.isArray(supabaseData) && supabaseData.length === 0) {
                console.log("Supabase returned empty leaderboard - no scores yet");
                leaderboard = [];
                return leaderboard;
            } else {
                console.warn("Supabase data was not valid, falling back to localStorage");
            }
        } else {
            console.warn("Supabase not configured, using localStorage for leaderboard");
        }
        
        // Fallback to localStorage if Supabase is not available or failed
        console.log('Loading leaderboard from localStorage...');
        const localData = localStorage.getItem('flattenhundLeaderboard');
        
        if (localData) {
            try {
                const parsedData = JSON.parse(localData);
                if (Array.isArray(parsedData)) {
                    leaderboard = parsedData;
                    console.log(`📱 Loaded ${leaderboard.length} leaderboard entries from localStorage`);
                    return leaderboard;
                }
            } catch (parseError) {
                console.error('Error parsing localStorage leaderboard data:', parseError);
            }
        }
        
        console.log("No leaderboard data found in localStorage either");
        leaderboard = [];
        
    } catch (err) {
        console.error('Error loading leaderboard:', err);
        
        // Final fallback to localStorage
        try {
            const localData = localStorage.getItem('flattenhundLeaderboard');
            if (localData) {
                const parsedData = JSON.parse(localData);
                if (Array.isArray(parsedData)) {
                    leaderboard = parsedData;
                    console.log(`📱 Fallback: Loaded ${leaderboard.length} entries from localStorage`);
                    return leaderboard;
                }
            }
        } catch (fallbackError) {
            console.error('Error loading fallback localStorage data:', fallbackError);
        }
        
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
    // Debounce rendering to prevent duplicates
    if (renderTimeout) {
        clearTimeout(renderTimeout);
    }
    
    renderTimeout = setTimeout(() => {
        actuallyRenderLeaderboard();
    }, 50); // 50ms debounce
}

// The actual rendering function
function actuallyRenderLeaderboard() {
    if (isRendering) {
        console.log('⏸️ Leaderboard render already in progress, skipping...');
        return;
    }
    
    isRendering = true;
    console.log('🎨 Rendering leaderboard with data:', leaderboard);
    
    try {
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
        
        console.log(`✅ Rendered ${leaderboard.length} leaderboard entries`);
    } catch (error) {
        console.error('❌ Error rendering leaderboard:', error);
    } finally {
        isRendering = false;
    }
}

// Check if current score is a new personal best OR qualifies for leaderboard to prompt for name
function checkAndPromptForPersonalBest(currentScore) {
    try {
        console.log('🎯 === HIGH SCORE CHECK START ===');
        console.log('🎯 Checking high score qualification for score:', currentScore);
        console.log('📊 Current leaderboard data:', leaderboard);
        console.log('📊 Leaderboard length:', leaderboard ? leaderboard.length : 'null/undefined');
        
        // Ensure currentScore is a valid number
        if (typeof currentScore !== 'number' || isNaN(currentScore) || currentScore < 0) {
            console.warn('❌ Invalid score provided to checkAndPromptForPersonalBest:', currentScore);
            return false;
        }
        
        const personalHighScore = parseInt(localStorage.getItem('flattenhundHighScore')) || 0;
        console.log('📈 Personal high score from localStorage:', personalHighScore);
        
        // Check if it's a new personal best
        const isPersonalBest = currentScore > personalHighScore;
        console.log('🏆 Is personal best?', isPersonalBest, `(${currentScore} > ${personalHighScore})`);
        
        // Check if it qualifies for the leaderboard (top 10)
        let qualifiesForLeaderboard = false;
        
        // Ensure leaderboard is valid before checking
        if (leaderboard && Array.isArray(leaderboard)) {
            console.log('📋 Leaderboard is valid array with', leaderboard.length, 'entries');
            if (leaderboard.length < 10) {
                qualifiesForLeaderboard = currentScore > 0;
                console.log('📋 Leaderboard has < 10 entries, any score > 0 qualifies. Result:', qualifiesForLeaderboard);
            } else {
                // Check if score is higher than the lowest score in top 10
                const lowestEntry = leaderboard[leaderboard.length - 1];
                console.log('📋 Lowest leaderboard entry:', lowestEntry);
                if (lowestEntry && typeof lowestEntry.score === 'number') {
                    const lowestScore = lowestEntry.score;
                    qualifiesForLeaderboard = currentScore > lowestScore;
                    console.log('📋 Checking against lowest leaderboard score:', lowestScore, 'Qualifies?', qualifiesForLeaderboard, `(${currentScore} > ${lowestScore})`);
                } else {
                    console.warn('⚠️ Invalid leaderboard entry structure, defaulting to qualification');
                    qualifiesForLeaderboard = currentScore > 0;
                }
            }
        } else {
            console.log('📋 No valid leaderboard data (null/undefined/not array), any score > 0 qualifies');
            qualifiesForLeaderboard = currentScore > 0;
        }

        console.log('🎖️ === QUALIFICATION RESULTS ===');
        console.log('🎖️ Personal Best:', isPersonalBest);
        console.log('🎖️ Leaderboard Qualification:', qualifiesForLeaderboard);
        console.log('🎖️ Overall Qualification:', isPersonalBest || qualifiesForLeaderboard);

        if (isPersonalBest || qualifiesForLeaderboard) {
            let message = '';
            if (isPersonalBest && qualifiesForLeaderboard) {
                message = 'NEW PERSONAL BEST & TOP 10!';
            } else if (isPersonalBest) {
                message = 'NEW PERSONAL BEST!';
            } else {
                message = 'YOU MADE THE TOP 10!';
            }
            
            console.log(`🎉 ${message} Score: ${currentScore}. Attempting to show form...`);
            
            // Check if form elements exist before trying to use them
            console.log('🔍 Checking for form elements...');
            console.log('🔍 newHighScoreForm element:', newHighScoreForm);
            console.log('🔍 playerNameInput element:', playerNameInput);
            
            if (newHighScoreForm) {
                console.log('✅ High score form found, updating and showing...');
                
                // Update the form message
                const formMessage = newHighScoreForm.querySelector('p');
                if (formMessage) {
                    formMessage.textContent = message;
                    console.log('✅ Form message updated to:', message);
                } else {
                    console.warn('⚠️ Form message element not found');
                }
                
                // Show the form
                newHighScoreForm.classList.remove('hidden');
                console.log('✅ High score form classList after showing:', newHighScoreForm.classList.toString());
                console.log('✅ High score form style.display:', newHighScoreForm.style.display);
                
                // Mobile hint
                if (window.showMobileHint) {
                    window.showMobileHint('Enter your name for the leaderboard!', 3000);
                }
            } else {
                console.error('❌ High score form element not found! DOM element is null/undefined');
                return false;
            }
            
            if (playerNameInput) {
                console.log('✅ Player name input found, clearing and focusing...');
                playerNameInput.value = ''; // Clear any previous input
                // Use setTimeout to prevent blocking
                setTimeout(() => {
                    if (playerNameInput) {
                        playerNameInput.focus(); // Focus on the input field
                        console.log('✅ Player name input focused');
                    }
                }, 100);
            } else {
                console.error('❌ Player name input element not found!');
            }
            
            console.log('🎯 === HIGH SCORE CHECK END (SUCCESS) ===');
            return true; // Indicates should show form
        } else {
            console.log(`ℹ️ No high score achievement: ${currentScore}. Personal best: ${personalHighScore}, Leaderboard qualification: ${qualifiesForLeaderboard}. Hiding form.`);
            if (newHighScoreForm) {
                newHighScoreForm.classList.add('hidden');
            }
        }
        
        console.log('🎯 === HIGH SCORE CHECK END (NO QUALIFICATION) ===');
        return false; // Not a high score
    } catch (error) {
        console.error('❌ Error in checkAndPromptForPersonalBest:', error);
        console.error('❌ Stack trace:', error.stack);
        // Always hide form on error to prevent UI issues
        if (newHighScoreForm) {
            newHighScoreForm.classList.add('hidden');
        }
        console.log('🎯 === HIGH SCORE CHECK END (ERROR) ===');
        return false;
    }
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

    console.log(`💾 Saving high score: ${playerName} - ${currentScore} (${character})`);

    // Show saving state
    const originalButtonText = saveScoreButton.textContent;
    saveScoreButton.textContent = 'SAVING...';
    saveScoreButton.disabled = true;
    playerNameInput.disabled = true;

    try {
        // Check if Supabase is configured and available
        if (!window.supabaseHelpers) {
            throw new Error('Supabase helpers not available - database not configured');
        }
        
        if (typeof window.supabaseHelpers.saveScore !== 'function') {
            throw new Error('Save score function not available');
        }
        
        // Check if Supabase is properly initialized
        if (!window.supabaseHelpers.isSupabaseAvailable()) {
            throw new Error('Supabase not configured - missing database credentials');
        }

        console.log(`Attempting to save to Supabase: ${playerName}, ${currentScore}, ${character}`);
        const saveResult = await window.supabaseHelpers.saveScore(playerName, currentScore, character);
        
        if (saveResult) {
            console.log("✅ Score saved to Supabase successfully.");
            
            // Show success feedback
            saveScoreButton.textContent = 'SAVED!';
            
            // Mobile haptic feedback for success
            if (window.triggerHaptic) {
                window.triggerHaptic('success');
            }
            
            // Mobile hint for success
            if (window.showMobileHint) {
                window.showMobileHint('Score saved to leaderboard!', 2000);
            }
            
            setTimeout(() => {
                saveScoreButton.textContent = originalButtonText;
            }, 1000);
        } else {
            throw new Error('Save operation returned false - database save failed');
        }
    } catch (err) {
        console.error('Error saving score to Supabase:', err);
        
        // Provide specific error messages based on the type of error
        let errorMessage = 'ERROR - TRY AGAIN';
        let userMessage = 'Failed to save score. Please try again.';
        
        if (err.message.includes('not configured') || err.message.includes('not available')) {
            errorMessage = 'OFFLINE MODE';
            userMessage = 'Score saved locally only. Database not configured.';
            
            // Save to localStorage as fallback
            const personalHighScore = parseInt(localStorage.getItem('flattenhundHighScore')) || 0;
            if (currentScore > personalHighScore) {
                localStorage.setItem('flattenhundHighScore', currentScore.toString());
                localStorage.setItem('flattenhundHighScoreName', playerName);
                console.log('💾 Saved personal high score to localStorage:', playerName, currentScore);
            }
            
            // Save to local leaderboard
            const localLeaderboard = JSON.parse(localStorage.getItem('flattenhundLeaderboard') || '[]');
            localLeaderboard.push({ name: playerName, score: currentScore, character: character });
            localLeaderboard.sort((a, b) => b.score - a.score);
            localLeaderboard.splice(10); // Keep only top 10
            localStorage.setItem('flattenhundLeaderboard', JSON.stringify(localLeaderboard));
            
            // Update display with local data
            leaderboard = localLeaderboard;
            renderLeaderboard();
        }
        
        saveScoreButton.textContent = errorMessage;
        
        // Mobile hint for error
        if (window.showMobileHint) {
            window.showMobileHint(userMessage, 3000);
        }
        
        setTimeout(() => {
            saveScoreButton.textContent = originalButtonText;
            saveScoreButton.disabled = false;
            playerNameInput.disabled = false;
            
            // Only hide form if it was successfully saved locally in offline mode
            if (errorMessage === 'OFFLINE MODE') {
                if (newHighScoreForm) {
                    newHighScoreForm.classList.add('hidden');
                }
                if (playerNameInput) {
                    playerNameInput.value = '';
                    playerNameInput.disabled = false;
                }
                saveScoreButton.disabled = false;
            }
            return; // Don't hide form if there was a real error
        }, 2000);
        return;
    }
    
    // Only hide form and reset if save was successful
    setTimeout(async () => {
        // Hide the form and clear input
        if (newHighScoreForm) {
            newHighScoreForm.classList.add('hidden');
        }
        if (playerNameInput) {
            playerNameInput.value = '';
            playerNameInput.disabled = false;
        }
        saveScoreButton.disabled = false;
        
        // IMPORTANT: Immediately refresh the leaderboard to show the new score
        console.log("🔄 Refreshing leaderboard after successful save...");
        try {
            if (!isLoading) {
                isLoading = true;
                await loadLeaderboard();
                renderLeaderboard();
                console.log("✅ Leaderboard refreshed successfully after save");
            } else {
                console.log("⏸️ Leaderboard refresh skipped (already loading)");
            }
        } catch (err) {
            console.error("❌ Error refreshing leaderboard:", err);
        } finally {
            isLoading = false;
        }
    }, 1000); // Wait 1 second to show "SAVED!" message
}

// Update the game end function to check for high scores
function updateGameEndWithLeaderboard() {
    // Instead of overriding gameEnd, we'll use the existing integration in game.js
    // The game.js file now properly calls checkAndPromptForPersonalBest
    console.log('🎮 Leaderboard integration ready - game.js will handle high score checks');
}

// Add periodic refresh of leaderboard data
function startLeaderboardRefresh() {
    // Refresh leaderboard every 30 seconds when not in a game
    setInterval(async () => {
        // Only refresh if game is not currently running and not already loading
        if ((!window.gameStarted || window.gameOver) && !isLoading) {
            console.log('⏰ Periodic leaderboard refresh...');
            try {
                isLoading = true;
                await loadLeaderboard();
                renderLeaderboard();
                console.log('✅ Periodic leaderboard refresh completed');
            } catch (error) {
                console.error('❌ Error in periodic refresh:', error);
            } finally {
                isLoading = false;
            }
        }
    }, 30000); // 30 seconds
}

// Function to manually refresh leaderboard (can be called externally)
async function refreshLeaderboard() {
    if (isLoading) {
        console.log('⏸️ Leaderboard refresh already in progress, skipping...');
        return leaderboard;
    }
    
    console.log('🔄 Manual leaderboard refresh requested...');
    
    try {
        isLoading = true;
        await loadLeaderboard();
        renderLeaderboard();
        console.log('✅ Manual leaderboard refresh completed');
        return leaderboard;
    } catch (error) {
        console.error('❌ Error in manual leaderboard refresh:', error);
        return leaderboard;
    } finally {
        isLoading = false;
    }
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

// Expose functions globally for debugging AND for game integration
window.leaderboardDebug = {
    refreshLeaderboard,
    testSupabaseConnection,
    getCurrentLeaderboard: () => leaderboard,
    renderLeaderboard,
    loadLeaderboard,
    // Add test functions for debugging
    testHighScoreFlow: (testScore) => {
        console.log('🧪 Testing high score flow with score:', testScore);
        return checkAndPromptForPersonalBest(testScore);
    },
    // Test saving a score locally
    testLocalSave: (name = 'TEST', score = 99) => {
        console.log('🧪 Testing local save...');
        const localLeaderboard = JSON.parse(localStorage.getItem('flattenhundLeaderboard') || '[]');
        localLeaderboard.push({ name: name, score: score, character: 'taz' });
        localLeaderboard.sort((a, b) => b.score - a.score);
        localLeaderboard.splice(10); // Keep only top 10
        localStorage.setItem('flattenhundLeaderboard', JSON.stringify(localLeaderboard));
        console.log('✅ Test score saved locally');
        
        // Refresh display
        leaderboard = localLeaderboard;
        renderLeaderboard();
        return localLeaderboard;
    },
    // Clear local leaderboard
    clearLocal: () => {
        localStorage.removeItem('flattenhundLeaderboard');
        localStorage.removeItem('flattenhundHighScore');
        localStorage.removeItem('flattenhundHighScoreName');
        console.log('✅ Local leaderboard data cleared');
        
        // Refresh display
        leaderboard = [];
        renderLeaderboard();
    },
    // Check current mode
    getMode: () => {
        const isOnline = window.supabaseHelpers && 
                        window.supabaseHelpers.isSupabaseAvailable &&
                        window.supabaseHelpers.isSupabaseAvailable();
        return isOnline ? 'online' : 'offline';
    },
    // Show status
    showStatus: () => {
        const mode = window.leaderboardDebug.getMode();
        const localData = JSON.parse(localStorage.getItem('flattenhundLeaderboard') || '[]');
        
        console.log('🎯 LEADERBOARD STATUS:');
        console.log(`Mode: ${mode.toUpperCase()}`);
        console.log(`Current leaderboard entries: ${leaderboard.length}`);
        console.log(`Local storage entries: ${localData.length}`);
        console.log('Current data:', leaderboard);
        
        if (window.showMobileHint) {
            window.showMobileHint(`Mode: ${mode} | Entries: ${leaderboard.length}`, 3000);
        }
    }
};

// Add helpful console message
console.log('🎮 Leaderboard Debug Commands Available:');
console.log('  window.leaderboardDebug.showStatus() - Show current status');
console.log('  window.leaderboardDebug.testLocalSave() - Test local save');
console.log('  window.leaderboardDebug.clearLocal() - Clear local data');
console.log('  window.leaderboardDebug.getMode() - Check if online/offline');

// Export main functions for other scripts
window.checkAndPromptForPersonalBest = checkAndPromptForPersonalBest;
window.initLeaderboard = initLeaderboard;

// Initialize leaderboard system manually (to be called by game.js)
window.initializeLeaderboardSystem = async function() {
    console.log('🎯 Initializing leaderboard system...');
    try {
        await initLeaderboard();
        updateGameEndWithLeaderboard();
        startLeaderboardRefresh();
        
        // Ensure functions are available globally after initialization
        window.checkAndPromptForPersonalBest = checkAndPromptForPersonalBest;
        window.refreshLeaderboard = refreshLeaderboard;
        
        console.log('✅ Leaderboard system initialized with global functions exposed');
        return true;
    } catch (error) {
        console.error('❌ Error initializing leaderboard system:', error);
        return false;
    }
};
