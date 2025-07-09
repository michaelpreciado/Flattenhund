// Leaderboard system for Flappy 8-Bit
// Handles high score tracking and display with persistent player nicknames

// Player data management for persistent nicknames and highest scores
const PLAYER_DATA_KEY = 'flattenhundPlayerData';

// Get stored player data from localStorage
function getPlayerData() {
    try {
        const data = localStorage.getItem(PLAYER_DATA_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            console.log('📱 Retrieved player data:', parsed);
            return parsed;
        }
    } catch (error) {
        console.warn('⚠️ Error retrieving player data:', error);
    }
    
    // Return default structure if no data or error
    return {
        nickname: null,
        highestScore: 0,
        totalGames: 0,
        lastPlayed: null
    };
}

// Save player data to localStorage
function savePlayerData(playerData) {
    try {
        localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(playerData));
        console.log('💾 Player data saved:', playerData);
        return true;
    } catch (error) {
        console.error('❌ Error saving player data:', error);
        return false;
    }
}

// Update player's highest score and game stats
function updatePlayerScore(currentScore) {
    const playerData = getPlayerData();
    const wasNewHighScore = currentScore > playerData.highestScore;
    
    // Update stats
    if (wasNewHighScore) {
        playerData.highestScore = currentScore;
    }
    playerData.totalGames += 1;
    playerData.lastPlayed = new Date().toISOString();
    
    // Save updated data
    savePlayerData(playerData);
    
    console.log(`🎮 Game stats updated: Score: ${currentScore}, High Score: ${playerData.highestScore}, Total Games: ${playerData.totalGames}`);
    
    return {
        isNewHighScore: wasNewHighScore,
        playerData: playerData
    };
}

// Check if player has a stored nickname
function hasStoredNickname() {
    const playerData = getPlayerData();
    return playerData.nickname && playerData.nickname.length > 0;
}

// Set player nickname (first time setup)
function setPlayerNickname(nickname) {
    const playerData = getPlayerData();
    playerData.nickname = nickname.trim().toUpperCase();
    savePlayerData(playerData);
    console.log('👤 Player nickname set:', playerData.nickname);
    return playerData.nickname;
}

// Get player's stored nickname
function getPlayerNickname() {
    const playerData = getPlayerData();
    return playerData.nickname || 'PLAYER';
}

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
    
    // Check leaderboard mode - only allow online mode
    const isOnlineMode = window.supabaseHelpers && 
                        window.supabaseHelpers.isSupabaseAvailable &&
                        window.supabaseHelpers.isSupabaseAvailable();
    
    if (isOnlineMode) {
        console.log('🌐 Leaderboard: Online mode - scores will be saved to cloud database');
        if (window.showMobileHint) {
            window.showMobileHint('🌐 Online leaderboard active!', 2000);
        }
        
        // Ensure save button is enabled and has correct text
        if (saveScoreButton) {
            saveScoreButton.disabled = false;
            saveScoreButton.textContent = 'SAVE SCORE';
        }
    } else {
        console.log('❌ Leaderboard: Online mode required - leaderboard disabled');
        if (window.showMobileHint) {
            window.showMobileHint('❌ Leaderboard requires online connection', 3000);
        }
        
        // Disable leaderboard functionality when offline
        if (saveScoreButton) {
            saveScoreButton.disabled = true;
            saveScoreButton.textContent = 'ONLINE REQUIRED';
            saveScoreButton.style.opacity = '0.5';
            saveScoreButton.title = 'Internet connection required for leaderboard';
        }
        
        // Disable name input as well
        if (playerNameInput) {
            playerNameInput.disabled = true;
            playerNameInput.placeholder = 'Online connection required';
            playerNameInput.style.opacity = '0.5';
        }
    }
    
    // Load leaderboard data (awaiting the async operation)
    await loadLeaderboard(); 
    
    // Render the leaderboard with the fetched or default data
    renderLeaderboard(); 
    
    // Add event listener for save button only if online
    if (saveScoreButton && isOnlineMode) {
        saveScoreButton.addEventListener('click', saveHighScore);
    } else {
        console.warn("Save score disabled - online mode required");
        
        // Add click handler to show online requirement message
        if (saveScoreButton) {
            saveScoreButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.showMobileHint) {
                    window.showMobileHint('🌐 Internet connection required for leaderboard features', 3000);
                }
            });
        }
    }
    
    // Add keyboard support for name input (Enter key to save) only if online
    if (playerNameInput && isOnlineMode) {
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
    
    // Update game's high score display with player's stored highest score
    updateGameHighScoreDisplay();
    
    console.log('✅ Leaderboard initialized successfully');
}

// Load leaderboard exclusively from Supabase (online-only mode)
async function loadLeaderboard() {
    console.log('Loading leaderboard from Supabase (online-only mode)...');
    leaderboard = []; // Default to empty if Supabase is not available
    
    try {
        // Only try to load from Supabase - no localStorage fallback
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
                console.warn("Supabase data was not valid");
            }
        } else {
            console.warn("Supabase not configured - leaderboard disabled in online-only mode");
        }
        
        console.log("No leaderboard data available - online mode required");
        leaderboard = [];
        
    } catch (err) {
        console.error('Error loading leaderboard from Supabase:', err);
        leaderboard = [];
    }
    
    console.log('Final leaderboard data:', leaderboard);
    return leaderboard;
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
        
        // Check online status for UI indicators
        const isOnline = window.supabaseHelpers && 
                        window.supabaseHelpers.isSupabaseAvailable &&
                        window.supabaseHelpers.isSupabaseAvailable();
        
        // Update leaderboard title with online status
        const leaderboardTitle = document.querySelector('.leaderboard-title');
        if (leaderboardTitle) {
            if (isOnline) {
                leaderboardTitle.textContent = '🌐 ONLINE LEADERBOARD';
                leaderboardTitle.style.color = '#4EC0CA';
            } else {
                leaderboardTitle.textContent = '❌ LEADERBOARD OFFLINE';
                leaderboardTitle.style.color = '#ff6b6b';
            }
        }
        
        // Check if we have data to display
        if (!leaderboard || leaderboard.length === 0) {
            // Show empty state message for online-only mode
            const emptyRow = document.createElement('div');
            emptyRow.className = 'leaderboard-row';
            emptyRow.style.textAlign = 'center';
            emptyRow.style.fontStyle = 'italic';
            emptyRow.style.padding = '20px 10px';
            
            if (isOnline) {
                emptyRow.style.color = '#4EC0CA';
                emptyRow.innerHTML = `
                    <div style="width: 100%; line-height: 1.4;">
                        🏆 No scores yet<br>
                        <small style="font-size: 0.8em; opacity: 0.8;">Be the first to reach the leaderboard!</small>
                    </div>
                `;
            } else {
                emptyRow.style.color = '#ff6b6b';
                emptyRow.innerHTML = `
                    <div style="width: 100%; line-height: 1.4;">
                        🌐 ONLINE MODE REQUIRED<br>
                        <small style="font-size: 0.8em; opacity: 0.8;">Connect to internet to view and save scores</small>
                    </div>
                `;
            }
            
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

// Check if current score qualifies for leaderboard (online-only mode)
function checkAndPromptForPersonalBest(currentScore) {
    try {
        console.log('🎯 === HIGH SCORE CHECK START (Persistent Nickname Mode) ===');
        console.log('🎯 Checking high score qualification for score:', currentScore);
        console.log('📊 Current leaderboard data:', leaderboard);
        console.log('📊 Leaderboard length:', leaderboard ? leaderboard.length : 'null/undefined');
        
        // Ensure currentScore is a valid number
        if (typeof currentScore !== 'number' || isNaN(currentScore) || currentScore < 0) {
            console.warn('❌ Invalid score provided to checkAndPromptForPersonalBest:', currentScore);
            return false;
        }
        
        // Check if online mode is available
        const isOnline = window.supabaseHelpers && 
                        window.supabaseHelpers.isSupabaseAvailable &&
                        window.supabaseHelpers.isSupabaseAvailable();
        
        if (!isOnline) {
            console.log('❌ Online mode not available - high score saving disabled');
            if (window.showMobileHint) {
                window.showMobileHint('Online connection required to save high scores', 3000);
            }
            return false;
        }
        
        // Update player stats and check for new high score
        const scoreUpdate = updatePlayerScore(currentScore);
        const playerData = scoreUpdate.playerData;
        const isNewPersonalBest = scoreUpdate.isNewHighScore;
        
        console.log('📈 Player data:', playerData);
        console.log('🏆 Is new personal best?', isNewPersonalBest, `(${currentScore} vs ${playerData.highestScore})`);
        
        // Check if highest score qualifies for the leaderboard (top 10)
        let qualifiesForLeaderboard = false;
        const scoreToCheck = playerData.highestScore; // Always check their highest score
        
        // Ensure leaderboard is valid before checking
        if (leaderboard && Array.isArray(leaderboard)) {
            console.log('📋 Leaderboard is valid array with', leaderboard.length, 'entries');
            if (leaderboard.length < 10) {
                qualifiesForLeaderboard = scoreToCheck > 0;
                console.log('📋 Leaderboard has < 10 entries, any score > 0 qualifies. Result:', qualifiesForLeaderboard);
            } else {
                // Check if highest score is higher than the lowest score in top 10
                const lowestEntry = leaderboard[leaderboard.length - 1];
                console.log('📋 Lowest leaderboard entry:', lowestEntry);
                if (lowestEntry && typeof lowestEntry.score === 'number') {
                    const lowestScore = lowestEntry.score;
                    qualifiesForLeaderboard = scoreToCheck > lowestScore;
                    console.log('📋 Checking highest score against lowest leaderboard score:', lowestScore, 'Qualifies?', qualifiesForLeaderboard, `(${scoreToCheck} > ${lowestScore})`);
                } else {
                    console.warn('⚠️ Invalid leaderboard entry structure, defaulting to qualification');
                    qualifiesForLeaderboard = scoreToCheck > 0;
                }
            }
        } else {
            console.log('📋 No valid leaderboard data (null/undefined/not array), any score > 0 qualifies');
            qualifiesForLeaderboard = scoreToCheck > 0;
        }

        console.log('🎖️ === QUALIFICATION RESULTS ===');
        console.log('🎖️ New Personal Best:', isNewPersonalBest);
        console.log('🎖️ Leaderboard Qualification:', qualifiesForLeaderboard);
        console.log('🎖️ Has Stored Nickname:', hasStoredNickname());
        console.log('🎖️ Overall Qualification:', (isNewPersonalBest || qualifiesForLeaderboard));

        // Check if they already have a nickname stored
        if (hasStoredNickname() && qualifiesForLeaderboard) {
            // Auto-save for returning players with stored nickname
            console.log('👤 Returning player with stored nickname - auto-saving highest score...');
            const nickname = getPlayerNickname();
            
            // Show success message
            if (window.showMobileHint) {
                window.showMobileHint(`Score updated for ${nickname}! High Score: ${playerData.highestScore}`, 3000);
            }
            
            // Auto-save their highest score to leaderboard
            setTimeout(async () => {
                await autoSavePlayerScore(nickname, playerData.highestScore);
            }, 500);
            
            console.log('🎯 === HIGH SCORE CHECK END (AUTO-SAVED) ===');
            return false; // Don't show form for returning players
        }
        
        // First-time players or players without stored nickname
        if (!hasStoredNickname() && qualifiesForLeaderboard) {
            let message = '';
            if (isNewPersonalBest && qualifiesForLeaderboard) {
                message = 'GREAT SCORE! ENTER YOUR NICKNAME:';
            } else if (qualifiesForLeaderboard) {
                message = 'YOU MADE THE LEADERBOARD! ENTER YOUR NICKNAME:';
            }
            
            console.log(`🎉 First-time player! ${message} Score: ${playerData.highestScore}`);
            
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
                    window.showMobileHint('Enter your nickname - it will be remembered for future games!', 4000);
                }
            } else {
                console.error('❌ High score form element not found! DOM element is null/undefined');
                return false;
            }
            
            if (playerNameInput) {
                console.log('✅ Player name input found, clearing and focusing...');
                playerNameInput.value = ''; // Clear any previous input
                playerNameInput.placeholder = 'YOUR NICKNAME';
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
            
            console.log('🎯 === HIGH SCORE CHECK END (SHOW FORM) ===');
            return true; // Show form for first-time players
        } else {
            console.log(`ℹ️ No action needed: Highest Score: ${playerData.highestScore}, Qualifies: ${qualifiesForLeaderboard}, Has Nickname: ${hasStoredNickname()}`);
            if (newHighScoreForm) {
                newHighScoreForm.classList.add('hidden');
            }
        }
        
        console.log('🎯 === HIGH SCORE CHECK END (NO ACTION) ===');
        return false; // No form needed
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

// Auto-save player score for returning players (no form needed)
async function autoSavePlayerScore(nickname, highestScore) {
    const character = window.selectedCharacter || 'taz';
    
    console.log(`🤖 Auto-saving score for returning player: ${nickname} - ${highestScore} (${character})`);
    
    try {
        // Check if Supabase is available
        if (!window.supabaseHelpers || !window.supabaseHelpers.isSupabaseAvailable()) {
            console.warn('⚠️ Supabase not available for auto-save');
            return false;
        }
        
        const saveResult = await window.supabaseHelpers.saveScore(nickname, highestScore, character);
        
        if (saveResult) {
            console.log("✅ Auto-save successful for returning player");
            
            // Mobile haptic feedback for success
            if (window.triggerHaptic) {
                window.triggerHaptic('success');
            }
            
            // Refresh leaderboard
            setTimeout(async () => {
                try {
                    await loadLeaderboard();
                    renderLeaderboard();
                    console.log("✅ Leaderboard refreshed after auto-save");
                } catch (err) {
                    console.error("❌ Error refreshing leaderboard after auto-save:", err);
                }
            }, 1000);
            
            return true;
        } else {
            console.warn('⚠️ Auto-save failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Error in auto-save:', error);
        return false;
    }
}

// Save high score for first-time players (with nickname form)
async function saveHighScore() {
    const playerName = playerNameInput.value.trim().toUpperCase() || 'PLAYER';
    const playerData = getPlayerData(); // Get current player data
    const highestScore = playerData.highestScore; // Use highest score, not current score
    const character = window.selectedCharacter || 'taz';

    if (!highestScore || highestScore <= 0) {
        console.error("No valid highest score to save. Aborting save.");
        if (newHighScoreForm) newHighScoreForm.classList.add('hidden');
        return;
    }

    console.log(`🎯 Saving first-time player score: ${playerName} - ${highestScore} (${character})`);

    // Store the nickname for future use
    setPlayerNickname(playerName);

    // Show saving state
    const originalButtonText = saveScoreButton.textContent;
    saveScoreButton.textContent = 'SAVING...';
    saveScoreButton.disabled = true;
    playerNameInput.disabled = true;

    try {
        // Check if Supabase is configured and available
        if (!window.supabaseHelpers) {
            throw new Error('Supabase helpers not available - online connection required');
        }
        
        if (typeof window.supabaseHelpers.saveScore !== 'function') {
            throw new Error('Save score function not available - online connection required');
        }
        
        // Check if Supabase is properly initialized
        if (!window.supabaseHelpers.isSupabaseAvailable()) {
            throw new Error('Supabase not configured - online connection required');
        }

        console.log(`Attempting to save to Supabase: ${playerName}, ${highestScore}, ${character}`);
        const saveResult = await window.supabaseHelpers.saveScore(playerName, highestScore, character);
        
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
                window.showMobileHint(`Welcome ${playerName}! Your nickname is saved for future games.`, 3000);
            }
            
            setTimeout(() => {
                saveScoreButton.textContent = originalButtonText;
            }, 1000);
        } else {
            throw new Error('Save operation failed - online connection required');
        }
    } catch (err) {
        console.error('Error saving score to Supabase:', err);
        
        // Show error message for online-only mode
        let errorMessage = 'ONLINE REQUIRED';
        let userMessage = 'Internet connection required to save scores.';
        
        saveScoreButton.textContent = errorMessage;
        
        // Mobile hint for error
        if (window.showMobileHint) {
            window.showMobileHint(userMessage, 3000);
        }
        
        setTimeout(() => {
            saveScoreButton.textContent = originalButtonText;
            saveScoreButton.disabled = false;
            playerNameInput.disabled = false;
            // Don't hide form on error - let user try again if connection improves
        }, 3000);
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

// Update game's high score display with player's actual highest score
function updateGameHighScoreDisplay() {
    const playerData = getPlayerData();
    if (playerData.highestScore > 0 && window.highScore !== undefined) {
        window.highScore = playerData.highestScore;
        const highScoreDisplay = document.getElementById('high-score');
        if (highScoreDisplay) {
            highScoreDisplay.textContent = playerData.highestScore;
            console.log(`🎮 Updated game high score display: ${playerData.highestScore}`);
        }
    }
}

// Expose functions globally for debugging AND for game integration
window.leaderboardDebug = {
    refreshLeaderboard,
    testSupabaseConnection,
    getCurrentLeaderboard: () => leaderboard,
    renderLeaderboard,
    loadLeaderboard,
    updateGameHighScoreDisplay,
    // Player data management
    getPlayerData,
    getPlayerNickname,
    hasStoredNickname,
    clearPlayerData: () => {
        localStorage.removeItem(PLAYER_DATA_KEY);
        console.log('🧹 Player data cleared - next game will prompt for nickname');
        return true;
    },
    // Add test functions for debugging
    testHighScoreFlow: (testScore) => {
        console.log('🧪 Testing high score flow with score:', testScore);
        return checkAndPromptForPersonalBest(testScore);
    },
    // Check current mode (always online-only now)
    getMode: () => {
        const isOnline = window.supabaseHelpers && 
                        window.supabaseHelpers.isSupabaseAvailable &&
                        window.supabaseHelpers.isSupabaseAvailable();
        return isOnline ? 'online' : 'offline-leaderboard-disabled';
    },
    // Show status
    showStatus: () => {
        const mode = window.leaderboardDebug.getMode();
        const isOnline = mode === 'online';
        
        console.log('🎯 LEADERBOARD STATUS (Online-Only Mode):');
        console.log(`Connection: ${isOnline ? 'ONLINE ✅' : 'OFFLINE ❌'}`);
        console.log(`Leaderboard Status: ${isOnline ? 'ACTIVE' : 'DISABLED'}`);
        console.log(`Current leaderboard entries: ${leaderboard.length}`);
        if (isOnline) {
            console.log('Current data:', leaderboard);
        } else {
            console.log('Data: Not available (online connection required)');
        }
        
        if (window.showMobileHint) {
            const statusMessage = isOnline 
                ? `🌐 Online | ${leaderboard.length} scores` 
                : '❌ Offline - Leaderboard Disabled';
            window.showMobileHint(statusMessage, 3000);
        }
    }
};

// Add helpful console message
console.log('🎮 Leaderboard Debug Commands Available (Online-Only Mode):');
console.log('  window.leaderboardDebug.showStatus() - Show current online/offline status');
console.log('  window.leaderboardDebug.getMode() - Check connection status');
console.log('  window.leaderboardDebug.testSupabaseConnection() - Test Supabase connection');
console.log('🌐 NOTE: Leaderboard requires internet connection - no offline fallback');

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
