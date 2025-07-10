// Leaderboard system for Flappy 8-Bit
// Handles high score tracking and display with persistent player nicknames

// PROFANITY FILTER SYSTEM
// Comprehensive filter to prevent slurs and inappropriate language on leaderboard

// List of prohibited words and variations (comprehensive but not exhaustive)
const PROHIBITED_WORDS = [
    // Racial slurs
    'nigger', 'nigga', 'n1gger', 'n1gga', 'nig', 'negro', 'coon', 'chink', 'gook', 'spic', 'wetback',
    'beaner', 'towelhead', 'raghead', 'kyke', 'kike', 'wop', 'guinea', 'gringo', 'honky', 'cracker',
    'whitey', 'slant', 'jap', 'nip', 'slope', 'coolie', 'paki', 'brownie', 'redskin', 'injun',
    
    // Religious slurs
    'kike', 'hymie', 'sheeney', 'yid', 'christ-killer', 'bible-thumper', 'holy-roller', 'jesus-freak',
    'sand-nigger', 'camel-jockey', 'towel-head', 'curry-muncher', 'dot-head', 'haji', 'muzzie',
    
    // Homophobic slurs
    'faggot', 'fag', 'dyke', 'queer', 'homo', 'fairy', 'sissy', 'tranny', 'shemale', 'ladyboy',
    'f4ggot', 'f4g', 'f@ggot', 'f@g', 'fagot', 'faget', 'fagg0t', 'f4g0t',
    
    // Sexist slurs
    'bitch', 'slut', 'whore', 'cunt', 'twat', 'skank', 'hoe', 'thot', 'b1tch', 'b!tch',
    'wh0re', 'wh@re', 'sl^t', 'c^nt', 'c*nt', 'c@nt', 'cu*t', 'cu@t',
    
    // Ableist slurs
    'retard', 'retarded', 'mongoloid', 'spastic', 'tard', 'r3tard', 'r3tarded', 'ret@rd',
    'r*tard', 'r@tard', 'gimp', 'cripple', 'midget', 'dwarf', 'freak', 'psycho',
    
    // General offensive terms
    'nazi', 'hitler', 'genocide', 'rapist', 'pedophile', 'terrorist', 'killer', 'murder',
    'suicide', 'kys', 'kill-yourself', 'die', 'death', 'terrorist', 'bomb', 'attack',
    
    // Common substitutions and variations
    'n-word', 'n_word', 'nword', 'f-word', 'f_word', 'fword', 'c-word', 'c_word', 'cword',
    'b-word', 'b_word', 'bword', 'r-word', 'r_word', 'rword', 's-word', 's_word', 'sword',
    
    // Leetspeak variations
    '4ssh0le', '4sshole', '@sshole', '@ssh0le', 'a$$hole', 'a$$h0le', 'a55hole', 'a55h0le',
    'ba5tard', 'ba$tard', 'b@stard', 'b4stard', 'damn1t', 'd@mn1t', 'd4mn1t', 'd@mn',
    'sh1t', 'sh!t', 'sh@t', '$h1t', '$h!t', '$h@t', 'fu(k', 'fuk', 'f*ck', 'f@ck',
    'f^ck', 'f#ck', 'f!ck', 'fvck', 'phuck', 'phuq', 'phuk', 'fukc', 'fcuk', 'fuc',
    
    // Additional offensive terms
    'ass', 'asshole', 'bastard', 'damn', 'hell', 'piss', 'shit', 'fuck', 'goddamn',
    'motherfucker', 'cocksucker', 'dickhead', 'penis', 'vagina', 'pussy', 'cock', 'dick',
    'tits', 'boobs', 'sex', 'porn', 'xxx', 'anal', 'oral', 'blowjob', 'handjob',
    
    // Hate symbols and codes
    '1488', '88', '14', 'hh', 'wp', 'kkk', 'white-power', 'white-pride', 'blood-honor',
    'rahowa', 'zog', 'mud-shark', 'coal-burner', 'gas-chamber', 'oven-dodger', 'lampshade',
    
    // Internet slang offensive terms
    'normie', 'chad', 'beta', 'alpha', 'simp', 'cuck', 'incel', 'femoid', 'roastie',
    'stacy', 'becky', 'karen', 'boomer', 'zoomer', 'coomer', 'doomer', 'bloomer'
];

// Function to check if a name contains prohibited words
function containsProfanity(text) {
    if (!text || typeof text !== 'string') return false;
    
    const normalizedText = text.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special characters
        .replace(/0/g, 'o')        // Replace 0 with o
        .replace(/1/g, 'i')        // Replace 1 with i
        .replace(/3/g, 'e')        // Replace 3 with e
        .replace(/4/g, 'a')        // Replace 4 with a
        .replace(/5/g, 's')        // Replace 5 with s
        .replace(/7/g, 't')        // Replace 7 with t
        .replace(/8/g, 'b');       // Replace 8 with b
    
    // Check exact matches and partial matches
    for (const word of PROHIBITED_WORDS) {
        if (normalizedText.includes(word.toLowerCase())) {
            return true;
        }
    }
    
    // Additional pattern checks for common evasion techniques
    const patterns = [
        /n[^a-z]*[i1][^a-z]*[g9][^a-z]*[g9][^a-z]*[e3a@][^a-z]*r/i,  // n-word variations
        /f[^a-z]*[a@4][^a-z]*[g9][^a-z]*[g9][^a-z]*[o0][^a-z]*[t7]/i,  // f-word variations
        /c[^a-z]*[u^][^a-z]*[n][^a-z]*[t7]/i,                          // c-word variations
        /b[^a-z]*[i1][^a-z]*[t7][^a-z]*[c][^a-z]*[h]/i,                // b-word variations
        /r[^a-z]*[e3][^a-z]*[t7][^a-z]*[a@4][^a-z]*r[^a-z]*d/i,        // r-word variations
        /k[^a-z]*[i1][^a-z]*[k][^a-z]*[e3]/i,                          // k-word variations
        /s[^a-z]*[l1][^a-z]*[u^][^a-z]*[t7]/i,                         // s-word variations
        /w[^a-z]*[h][^a-z]*[o0][^a-z]*r[^a-z]*[e3]/i,                  // w-word variations
        /h[^a-z]*[i1][^a-z]*[t7][^a-z]*[l1][^a-z]*[e3][^a-z]*r/i       // h-word variations
    ];
    
    for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
            return true;
        }
    }
    
    return false;
}

// Function to filter and sanitize player names
function sanitizePlayerName(name) {
    if (!name || typeof name !== 'string') {
        return 'PLAYER';
    }
    
    // Clean and normalize the name
    const cleanName = name.trim().toUpperCase();
    
    // Check for profanity
    if (containsProfanity(cleanName)) {
        console.warn('🚫 Profanity detected in name:', name);
        
        // Return a safe alternative
        const safeAlternatives = [
            'PLAYER', 'GAMER', 'BIRD', 'FLYER', 'PILOT', 'HERO', 'STAR', 'CHAMP',
            'EAGLE', 'FALCON', 'PHOENIX', 'SWIFT', 'DASH', 'ZOOM', 'TURBO', 'SPEED',
            'BRAVE', 'BOLD', 'QUICK', 'FLASH', 'ROCKET', 'COMET', 'STORM', 'WIND'
        ];
        
        // Use a random safe alternative
        const randomIndex = Math.floor(Math.random() * safeAlternatives.length);
        const safeName = safeAlternatives[randomIndex];
        
        console.log('🛡️ Replaced with safe name:', safeName);
        return safeName;
    }
    
    // Additional safety checks
    if (cleanName.length === 0) {
        return 'PLAYER';
    }
    
    if (cleanName.length > 12) {
        return cleanName.substring(0, 12);
    }
    
    return cleanName;
}

// Player data management for persistent nicknames and highest scores
const PLAYER_DATA_KEY = 'flattenhundPlayerData';

// Get stored player data from localStorage
function getPlayerData() {
    try {
        const data = localStorage.getItem(PLAYER_DATA_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Sanitize the nickname when retrieving from storage
            if (parsed.nickname) {
                parsed.nickname = sanitizePlayerName(parsed.nickname);
            }
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
    playerData.nickname = sanitizePlayerName(nickname);
    savePlayerData(playerData);
    console.log('👤 Player nickname set:', playerData.nickname);
    return playerData.nickname;
}

// Get player's stored nickname
function getPlayerNickname() {
    const playerData = getPlayerData();
    return sanitizePlayerName(playerData.nickname) || 'PLAYER';
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
        
        // Add real-time profanity check and feedback
        playerNameInput.addEventListener('input', function() {
            const inputValue = this.value.trim();
            const originalValue = inputValue;
            
            if (inputValue.length > 0) {
                // Check for profanity in real-time
                if (containsProfanity(inputValue)) {
                    // Visual feedback for inappropriate content
                    this.style.borderColor = '#ff6b6b';
                    this.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                    this.title = 'Inappropriate language detected. Please choose a different name.';
                    
                    // Disable save button
                    if (saveScoreButton) {
                        saveScoreButton.disabled = true;
                        saveScoreButton.textContent = 'INAPPROPRIATE NAME';
                        saveScoreButton.style.opacity = '0.5';
                    }
                    
                    // Show warning message
                    if (window.showMobileHint) {
                        window.showMobileHint('⚠️ Please choose an appropriate nickname', 2000);
                    }
                } else {
                    // Reset styling for appropriate content
                    this.style.borderColor = '';
                    this.style.backgroundColor = '';
                    this.title = '';
                    
                    // Re-enable save button
                    if (saveScoreButton) {
                        saveScoreButton.disabled = false;
                        saveScoreButton.textContent = 'SAVE SCORE';
                        saveScoreButton.style.opacity = '1';
                    }
                }
                
                // Limit length to 12 characters
                if (inputValue.length > 12) {
                    this.value = inputValue.substring(0, 12);
                    if (window.showMobileHint) {
                        window.showMobileHint('📝 Maximum 12 characters', 1500);
                    }
                }
            } else {
                // Reset styling for empty input
                this.style.borderColor = '';
                this.style.backgroundColor = '';
                this.title = '';
                
                // Re-enable save button for empty input (will use default 'PLAYER')
                if (saveScoreButton) {
                    saveScoreButton.disabled = false;
                    saveScoreButton.textContent = 'SAVE SCORE';
                    saveScoreButton.style.opacity = '1';
                }
            }
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
            nameDiv.textContent = sanitizePlayerName(entry.name) || 'ANONYMOUS';
            
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
        
        // Check if CURRENT score qualifies for the leaderboard (top 10)
        let qualifiesForLeaderboard = false;
        const scoreToCheck = currentScore; // Check the current game score, not highest score
        
        // Ensure leaderboard is valid before checking
        if (leaderboard && Array.isArray(leaderboard)) {
            console.log('📋 Leaderboard is valid array with', leaderboard.length, 'entries');
            if (leaderboard.length < 10) {
                // Only qualify if the current score is actually decent (not just any score > 0)
                const minimumScore = Math.max(10, leaderboard.length > 0 ? Math.min(...leaderboard.map(entry => entry.score || 0)) : 10);
                qualifiesForLeaderboard = scoreToCheck >= minimumScore;
                console.log('📋 Leaderboard has < 10 entries, minimum score needed:', minimumScore, 'Qualifies?', qualifiesForLeaderboard, `(${scoreToCheck} >= ${minimumScore})`);
            } else {
                // Check if current score is higher than the lowest score in top 10
                const lowestEntry = leaderboard[leaderboard.length - 1];
                console.log('📋 Lowest leaderboard entry:', lowestEntry);
                if (lowestEntry && typeof lowestEntry.score === 'number') {
                    const lowestScore = lowestEntry.score;
                    qualifiesForLeaderboard = scoreToCheck > lowestScore;
                    console.log('📋 Checking CURRENT score against lowest leaderboard score:', lowestScore, 'Qualifies?', qualifiesForLeaderboard, `(${scoreToCheck} > ${lowestScore})`);
                } else {
                    console.warn('⚠️ Invalid leaderboard entry structure, using minimum score of 10');
                    qualifiesForLeaderboard = scoreToCheck >= 10;
                }
            }
        } else {
            console.log('📋 No valid leaderboard data (null/undefined/not array), using minimum score of 10');
            qualifiesForLeaderboard = scoreToCheck >= 10;
        }

        console.log('🎖️ === QUALIFICATION RESULTS ===');
        console.log('🎖️ Current Score:', currentScore);
        console.log('🎖️ New Personal Best:', isNewPersonalBest);
        console.log('🎖️ Current Score Qualifies for Leaderboard:', qualifiesForLeaderboard);
        console.log('🎖️ Has Stored Nickname:', hasStoredNickname());
        console.log('🎖️ Show Form Criteria: New Personal Best AND Current Score Qualifies AND No Stored Nickname');
        console.log('🎖️ Show Form Result:', (!hasStoredNickname() && isNewPersonalBest && qualifiesForLeaderboard));

        // Check if they already have a nickname stored
        if (hasStoredNickname() && isNewPersonalBest && qualifiesForLeaderboard) {
            // Auto-save for returning players with stored nickname when current score qualifies
            console.log('👤 Returning player with stored nickname - auto-saving new qualifying score...');
            const nickname = getPlayerNickname();
            
            // Show success message for qualifying score
            if (window.showMobileHint) {
                window.showMobileHint(`Great score ${nickname}! New record: ${playerData.highestScore}`, 3000);
            }
            
            // Auto-save their highest score to leaderboard
            setTimeout(async () => {
                await autoSavePlayerScore(nickname, playerData.highestScore);
            }, 500);
            
            console.log('🎯 === HIGH SCORE CHECK END (AUTO-SAVED) ===');
            return false; // Don't show form for returning players
        }
        
        // First-time players or players without stored nickname
        // Only show form if it's a new personal best AND they qualify for leaderboard
        if (!hasStoredNickname() && isNewPersonalBest && qualifiesForLeaderboard) {
            let message = '';
            if (isNewPersonalBest && qualifiesForLeaderboard) {
                message = 'NEW PERSONAL BEST! ENTER YOUR NICKNAME:';
            } else if (qualifiesForLeaderboard) {
                message = 'YOU MADE THE LEADERBOARD! ENTER YOUR NICKNAME:';
            }
            
            console.log(`🎉 First-time player! ${message} Current Score: ${currentScore}, New High Score: ${playerData.highestScore}`);
            
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
            console.log(`ℹ️ No action needed: Current Score: ${currentScore}, New Personal Best: ${isNewPersonalBest}, Current Score Qualifies: ${qualifiesForLeaderboard}, Has Nickname: ${hasStoredNickname()}`);
            console.log('ℹ️ Form criteria: Must be new personal best AND current score must qualify for leaderboard AND not have stored nickname');
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
    const safeName = sanitizePlayerName(nickname);
    
    console.log(`🤖 Auto-saving score for returning player: ${safeName} - ${highestScore} (${character})`);
    
    try {
        // Check if Supabase is available
        if (!window.supabaseHelpers || !window.supabaseHelpers.isSupabaseAvailable()) {
            console.warn('⚠️ Supabase not available for auto-save');
            return false;
        }
        
        const saveResult = await window.supabaseHelpers.saveScore(safeName, highestScore, character);
        
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
    const playerName = sanitizePlayerName(playerNameInput.value) || 'PLAYER';
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

// Test function to verify profanity filter (can be called from console)
function testProfanityFilter() {
    console.log('🧪 TESTING PROFANITY FILTER SYSTEM');
    console.log('==================================');
    
    // Test cases
    const testCases = [
        // Clean names - should pass through
        { input: 'PLAYER', expected: 'PLAYER' },
        { input: 'john', expected: 'JOHN' },
        { input: 'gamer123', expected: 'GAMER123' },
        { input: 'hero', expected: 'HERO' },
        { input: 'swift', expected: 'SWIFT' },
        
        // Profanity - should be replaced
        { input: 'badword', expected: 'safe alternative' },
        { input: 'test123', expected: 'TEST123' },
        { input: '', expected: 'PLAYER' },
        { input: null, expected: 'PLAYER' },
        { input: undefined, expected: 'PLAYER' },
        
        // Length test
        { input: 'verylongusername', expected: 'VERYLONGUSE' }, // should be truncated to 12 chars
        
        // Mixed cases
        { input: '  player  ', expected: 'PLAYER' },
        { input: 'Player123', expected: 'PLAYER123' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach((testCase, index) => {
        const result = sanitizePlayerName(testCase.input);
        const isValid = result && result.length <= 12 && !containsProfanity(result);
        
        if (testCase.expected === 'safe alternative') {
            // For profanity cases, just check that it was sanitized
            if (isValid && result !== testCase.input) {
                console.log(`✅ Test ${index + 1}: "${testCase.input}" → "${result}" (sanitized)`);
                passed++;
            } else {
                console.log(`❌ Test ${index + 1}: "${testCase.input}" → "${result}" (not properly sanitized)`);
                failed++;
            }
        } else {
            if (result === testCase.expected) {
                console.log(`✅ Test ${index + 1}: "${testCase.input}" → "${result}"`);
                passed++;
            } else {
                console.log(`❌ Test ${index + 1}: "${testCase.input}" → "${result}" (expected: "${testCase.expected}")`);
                failed++;
            }
        }
    });
    
    console.log('\n🧪 TEST RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Profanity filter is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the filter implementation.');
    }
}

// Expose test function to global scope for console access
window.testProfanityFilter = testProfanityFilter;

// Auto-run test on load if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🧪 Development mode detected - profanity filter test available');
    console.log('💡 Run window.testProfanityFilter() in console to test the filter');
}
