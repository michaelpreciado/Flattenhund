// Main game file for Flappy Mario
// This file handles the game initialization, loop, and core mechanics

// Game constants: all speed/acceleration values are in units per second (pixels/sec or pixels/sec^2)
// Enhanced physics system for better game flow and challenge

// Base Physics Constants
const BASE_GRAVITY_ACCEL = 0.4 * 60 * 60; // 1440 px/sec^2 - Increased for more challenge
const BASE_FLAP_VELOCITY = -6.0 * 60; // -360 px/sec - Reduced for lower jumps (was -7.5 * 60)
const BASE_PIPE_SPEED_PPS = 3.5 * 60; // 210 px/sec - Faster base speed
const TERMINAL_VELOCITY = 12 * 60; // 720 px/sec - Maximum fall speed

// Progressive Difficulty Scaling
const DIFFICULTY_SCALE_RATE = 0.08; // How much difficulty increases per score point
const MAX_DIFFICULTY_MULTIPLIER = 2.5; // Maximum difficulty scaling (2.5x harder at high scores)
const SPEED_INCREASE_RATE = 0.05; // Speed increase per score point
const GAP_DECREASE_RATE = 0.8; // How much gap decreases per score point

// Advanced Physics
const AIR_RESISTANCE_FACTOR = 0.985; // Air resistance for more realistic movement
const MOMENTUM_PRESERVATION = 0.92; // How much momentum is preserved between flaps
const VARIABLE_GRAVITY_FACTOR = 1.3; // Gravity increases when falling fast
const PRECISION_FLAP_BONUS = 0.85; // Reduced gravity for precise timing

// Enhanced Movement
const FORWARD_LEAP_VEL_CHANGE_PPS = 1.2 * 60; // 72 px/sec - More forward momentum
const MAX_FORWARD_SPEED_PPS = 3.2 * 60; // 192 px/sec - Higher max speed
const FORWARD_DRAG_FACTOR = 0.94; // More drag for better control

// Improved Float System
const FLOAT_DURATION_SECONDS = 18 / 60; // 0.3 seconds - Slightly longer float
const FLOAT_GRAVITY_MULTIPLIER = 0.55; // Stronger float effect
const PERFECT_TIMING_WINDOW = 0.15; // Window for perfect timing bonus

// Enhanced Visual Effects
const ROTATION_SENSITIVITY = 8; // More responsive rotation
const ROTATION_SMOOTHING = 0.75; // Smoother rotation interpolation

// Dynamic Pipe System
const BASE_PIPE_SPAWN_INTERVAL = 1800; // Base time between pipes (milliseconds)
const MIN_PIPE_SPAWN_INTERVAL = 1400; // Minimum spawn interval at high difficulty (increased)
const BASE_PIPE_GAP = 160; // Base gap size - reasonable for all players
const MIN_PIPE_GAP = 140; // Minimum gap at high difficulty - never smaller than this
const GROUND_HEIGHT = 120;
const MARIO_WIDTH = 48;
const MARIO_HEIGHT = 48;

// Particle system for enhanced effects
const PARTICLE_MIN_SPEED_X_PPS = -4 * 60; // -240 px/sec
const PARTICLE_MAX_SPEED_X_PPS = -1.5 * 60; // -90 px/sec
const PARTICLE_MIN_SPEED_Y_PPS = -2 * 60; // -120 px/sec
const PARTICLE_MAX_SPEED_Y_PPS = 2 * 60; // 120 px/sec
const PARTICLE_LIFE_DECAY_PER_SEC = 0.06 * 60; // Faster particle decay

const MARIO_ANIM_FPS = 0.25 * 60; // Slightly faster animation

// Enhanced Game variables
let canvas, ctx;
let mario = {
    x: 60,
    y: 300,
    width: MARIO_WIDTH,
    height: MARIO_HEIGHT,
    velocity: 0,
    velocityX: 0,
    isFlapping: false,
    frameCount: 0,
    animationFrameCount: 0,
    floatTimer: 0,
    smoothRotation: 0,
    holdTimer: 0,
    lastFlapTime: 0, // For timing-based bonuses
    perfectFlaps: 0, // Count of well-timed flaps
    momentum: 0 // Accumulated momentum for advanced physics
};

// Supabase session tracking
let currentSession = null;

// Particle system for smoke trail
let particles = [];

let pipes = [];
let ground = { y: 0 };
let score = 0;
let highScore = 0;
let gameStarted = false;
let gameOver = false;
let lastPipeSpawn = 0;
let animationFrameId;
let lastTime = 0;

// 8-bit theme colors
const COLORS_8BIT = {
    sky: '#4EC0CA',
    ground: '#8CC453',
    dirt: '#DED895',
    pipe: '#74BF2E',
    pipeBorder: '#558022',
    scoreText: '#FFFFFF',
    scoreBox: '#000000'
};

// Assets
let marioSprite = new Image();
let tazSprite = new Image();
let chloeSprite = new Image();
let selectedCharacter = null; // 'taz' or 'chloe'
let pipeTopSprite = new Image();
let pipeBottomSprite = new Image();
let backgroundSprite = new Image();
let groundSprite = new Image();

// Sound contexts
let flapSoundContext;
let scoreSoundContext;
let hitSoundContext;
let gameOverSoundContext;

// DOM elements
let startScreen, gameOverScreen, scoreDisplay, finalScoreDisplay, highScoreDisplay;
// Game DOM elements

// Dark mode support
let isDarkMode = false;

// Progressive Difficulty Tracking
let difficultyMultiplier = 1.0;
let currentPipeSpeed = BASE_PIPE_SPEED_PPS;
let currentGravity = BASE_GRAVITY_ACCEL;
let currentPipeGap = BASE_PIPE_GAP;
let currentSpawnInterval = BASE_PIPE_SPAWN_INTERVAL;

// Show bonus text for enhanced scoring
let bonusTexts = []; // Array to store active bonus texts

// Initialize the game
function init() {
    // Get DOM elements
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    startScreen = document.getElementById('start-screen');
    gameOverScreen = document.getElementById('game-over');
    scoreDisplay = document.getElementById('score');
    finalScoreDisplay = document.getElementById('final-score');
    highScoreDisplay = document.getElementById('high-score');
    
    // Make ground globally accessible for drawing functions
    window.ground = ground;
    
    // Game initialization
    
    // Set initial canvas dimensions and add resize listener
    resizeCanvas(); // This will set ground.y properly
    window.addEventListener('resize', resizeCanvas);

    // For crisp pixel art rendering (will be set in resizeCanvas too)
    // ctx.imageSmoothingEnabled = false; // Moved to resizeCanvas
    
    // Initialize 8-bit audio system with reduced music
    if (window.eightBitAudio) {
        window.eightBitAudio.init();
        // Disable background music by default
        window.eightBitAudio.enableMusic(false);
    }
    
    // Ground position will be set in resizeCanvas()
    // (Removed inconsistent initial ground.y calculation)
    
    // Load high score from local storage
    const savedHighScore = localStorage.getItem('flattenhundHighScore');
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        highScoreDisplay.textContent = highScore;
    }
    
    // Load assets
    loadAssets();

    // Character selection logic
    const chooseTazBtn = document.getElementById('choose-taz');
    const chooseChloeBtn = document.getElementById('choose-chloe');
    const startBtn = document.getElementById('start-button');
    
    chooseTazBtn.addEventListener('click', () => {
        selectedCharacter = 'taz';
        chooseTazBtn.classList.add('selected');
        chooseChloeBtn.classList.remove('selected');
        startBtn.disabled = false;
    });
    chooseChloeBtn.addEventListener('click', () => {
        selectedCharacter = 'chloe';
        chooseChloeBtn.classList.add('selected');
        chooseTazBtn.classList.remove('selected');
        startBtn.disabled = false;
    });

    // Event listeners
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', resetGame);
    
    // Input handlers
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    // Start the start screen render loop to keep it responsive
    startScreenRenderLoop();
    
    // Check if dark mode is enabled
    isDarkMode = document.body.classList.contains('dark-mode');
    
    // Expose theme update function for dark-mode.js
    window.updateGameTheme = function(darkModeEnabled) {
        isDarkMode = darkModeEnabled;
    };
    
    // Initialize leaderboard system
    if (window.initializeLeaderboardSystem) {
        setTimeout(async () => {
            try {
                const success = await window.initializeLeaderboardSystem();
                if (success) {
                    console.log('✅ Leaderboard system ready for high score checks');
                } else {
                    console.warn('⚠️ Leaderboard system initialization failed');
                }
            } catch (error) {
                console.error('❌ Error initializing leaderboard system:', error);
            }
        }, 100); // Small delay to ensure all scripts are loaded
    }
}

// Function to handle canvas resizing
function resizeCanvas() {
    if (!canvas || !ctx) return;
    
    // Use device pixel ratio for crisp rendering on mobile
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Update ground position
    ground.y = canvas.height / dpr - GROUND_HEIGHT;
    
    // Debug logging for ground position
    console.log('Ground position updated:', {
        canvasHeight: canvas.height,
        dpr: dpr,
        groundHeight: GROUND_HEIGHT,
        calculatedGroundY: ground.y,
        visibleCanvasHeight: canvas.height / dpr
    });
    
    // Ensure crisp pixel art rendering after resize
    ctx.imageSmoothingEnabled = false;
    
    // Mobile-specific canvas optimizations
    if ('ontouchstart' in window) {
        ctx.textRenderingOptimization = 'optimizeSpeed';
    }

    // If the game is over or not started, the main gameLoop isn't running render(),
    // so we might need to manually call render() here to update the static background elements.
    if (!gameStarted || gameOver) { 
        render(); // Redraw static elements or game over screen
    } 
}

// Helper to get current character sprite
function getCurrentCharacterSprite() {
    if (selectedCharacter === 'taz') return tazSprite;
    if (selectedCharacter === 'chloe') return chloeSprite;
    return marioSprite;
}

// Helper to draw rounded rectangles (for score display)
function roundRect(ctx, x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

// Render background clouds - strictly in background layer (STATIC VERSION)
function renderBackgroundClouds() {
    // Use a much lighter cloud color with very high transparency for subtle appearance
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    
    // STATIC CLOUDS - fixed positions, no movement or animation
    // These clouds are completely static and will never move or change
    
    // Cloud 1 (upper left corner) - fixed position
    drawStaticPixelCloud(40, 40, 100, 50);
    
    // Cloud 2 (upper middle area) - fixed position
    drawStaticPixelCloud(canvas.width/2 - 80, 60, 120, 60);
    
    // Cloud 3 (upper right) - fixed position
    drawStaticPixelCloud(canvas.width - 140, 50, 100, 50);
}

// Draw the city skyline silhouette in the background
function drawCitySilhouette(baseY) {
    ctx.fillStyle = '#DEECF0'; // Very light color for buildings to match reference
    
    // Draw a series of buildings with different heights - wider buildings
    const buildingWidths = [42, 28, 56, 35, 49, 28, 35, 42, 56, 28, 49, 42, 35];
    // Fixed building heights to remove randomness
    const buildingHeights = [40, 30, 50, 35, 45, 25, 38, 42, 52, 28, 48, 40, 32];
    let xPos = 0;
    
    for (let i = 0; i < buildingWidths.length; i++) {
        const width = buildingWidths[i];
        const height = buildingHeights[i]; // Use fixed heights instead of random
        
        // Building
        ctx.fillRect(xPos, baseY - height, width, height);
        
        // Some buildings have small "windows" - now deterministic
        if (i % 2 === 0) { // Every other building has windows
            ctx.fillStyle = '#D0E0E8'; // Slightly darker color for windows but still very light
            const windowSize = 3;
            const windowY = baseY - height + 5;
            const windowX = xPos + width/2 - windowSize/2;
            ctx.fillRect(windowX, windowY, windowSize, windowSize);
            ctx.fillRect(windowX - 6, windowY + 6, windowSize, windowSize);
            ctx.fillRect(windowX + 6, windowY + 6, windowSize, windowSize);
            ctx.fillStyle = '#DEECF0'; // Back to building color
        }
        
        xPos += width;
        // If we reached the end of the screen, go back to beginning
        if (xPos > canvas.width) xPos = 0;
    }
}

// Helper to draw a single STATIC pixelated cloud (no animation)
function drawStaticPixelCloud(x, y, width, height) {
    // Cloud color is now set in the parent function to ensure consistency
    
    // Main cloud body - completely static, no movement
    ctx.fillRect(x, y, width, height);
    
    // Cloud bumps on top (pixelated look) - fixed positions
    // These bumps are in fixed positions and will never change
    ctx.fillRect(x - 15, y + 15, 22, 22);
    ctx.fillRect(x + width/4, y - 15, 30, 30);
    ctx.fillRect(x + width/2, y - 8, 22, 22);
    ctx.fillRect(x + width - 22, y + 8, 30, 30);
}

// Load game assets
function loadAssets() {
    // Character sprites
    tazSprite.src = 'assets/images/taz.png';
    chloeSprite.src = 'assets/images/chloe.png';
    // Default (legacy) Mario sprite for fallback
    marioSprite.src = 'assets/images/mario.png';
    // Environment
    pipeTopSprite.src = 'assets/images/pipe-top.png';
    pipeBottomSprite.src = 'assets/images/pipe-bottom.png';
    backgroundSprite.src = 'assets/images/background.png';
    groundSprite.src = 'assets/images/ground.png';
    // Sound functions are loaded from sounds.js
    // No need to preload as they're generated on demand
}

// Start the game
async function startGame() {
    // Default to Taz if none selected (should not happen)
    if (!selectedCharacter) selectedCharacter = 'taz';
    gameStarted = true;
    gameOver = false;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    score = 0;
    updateScore();
    
    // Dispatch mobile game start event
    document.dispatchEvent(new CustomEvent('game:start'));
    
    // Game start setup
    
    // Create a new game session in Supabase if available
    try {
        if (window.supabaseHelpers) {
            currentSession = await window.supabaseHelpers.createGameSession(
                selectedCharacter,
                isDarkMode
            );
        }
    } catch (err) {
        console.error('Error creating game session:', err);
        currentSession = null;
    }
    
    // Show mobile hint if available
    if (window.showMobileHint) {
        window.showMobileHint('Game started! Tap to flap!', 2000);
    }
    
    // Only play sound effects, no continuous background music
    // Theme music is disabled by default
    
    // Reset mario position with a better head start
    mario.y = 230; // Start even higher in the air
    mario.velocity = -3.0 * 60; // Stronger initial upward velocity (-180 px/sec)
    mario.velocityX = 0.5 * 60; // Small initial forward momentum (30 px/sec)
    mario.x = 60; // Reset X position
    mario.floatTimer = FLOAT_DURATION_SECONDS * 1.33; // Start with float timer active (a bit more than one flap's worth)
    mario.smoothRotation = 0; // Reset rotation
    mario.animationFrameCount = 0;
    
    // Clear pipes
    pipes = [];
    
    // Start game loop
    lastTime = performance.now(); // Initialize lastTime for deltaTime calculation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    gameLoop();
}

// Reset the game
function resetGame() {
    // Reset mario state
    mario.x = 60;
    mario.y = 300;
    mario.velocity = 0;
    mario.velocityX = 0;
    mario.isFlapping = false;
    mario.frameCount = 0;
    mario.animationFrameCount = 0;
    mario.floatTimer = 0;
    mario.smoothRotation = 0;
    mario.holdTimer = 0;
    mario.lastFlapTime = 0;
    mario.perfectFlaps = 0;
    mario.momentum = 0;
    
    // Reset game state
    pipes = [];
    particles = [];
    bonusTexts = [];
    score = 0;
    gameStarted = false;
    gameOver = false;
    lastPipeSpawn = 0;
    
    // Reset difficulty scaling
    difficultyMultiplier = 1.0;
    currentPipeSpeed = BASE_PIPE_SPEED_PPS;
    currentGravity = BASE_GRAVITY_ACCEL;
    currentPipeGap = BASE_PIPE_GAP;
    currentSpawnInterval = BASE_PIPE_SPAWN_INTERVAL;
    
    // Reset visual effects
    canvas.style.filter = 'none';
    canvas.style.transition = 'none';
    
    // Clear any existing animation frames first
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Hide game over screen and show start screen
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    
    // Update score display
    scoreDisplay.textContent = '0';
    
    // Start a simple render loop for the start screen to keep it responsive
    startScreenRenderLoop();
}

// Simple render loop for start screen to prevent freeze
function startScreenRenderLoop() {
    // Only render if we're on the start screen
    if (!gameStarted && !gameOver && startScreen.style.display === 'flex') {
        // Add some subtle animation to mario on start screen (gentle bobbing)
        mario.animationFrameCount += 0.03; // Slow animation
        mario.y = 300 + Math.sin(mario.animationFrameCount) * 3; // Gentle bobbing motion
        
        render();
        animationFrameId = requestAnimationFrame(startScreenRenderLoop);
    }
}

// Game loop
function gameLoop() {
    const currentTime = performance.now();
    const deltaTime = Math.min(0.1, (currentTime - lastTime) / 1000); // deltaTime in seconds, clamped to avoid large jumps
    lastTime = currentTime;

    update(deltaTime);
    render();
    
    if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Make mario flap with floatier physics and smooth forward movement
function flap() {
    const currentTime = Date.now();
    const timeSinceLastFlap = (currentTime - mario.lastFlapTime) / 1000; // Convert to seconds
    
    // Calculate timing bonus for well-spaced flaps
    let flapPower = BASE_FLAP_VELOCITY;
    let momentumBonus = 1.0;
    
    // Perfect timing bonus (0.2-0.4 seconds between flaps is optimal)
    if (timeSinceLastFlap >= 0.2 && timeSinceLastFlap <= 0.4) {
        flapPower *= 1.15; // 15% stronger flap
        momentumBonus = 1.25;
        mario.perfectFlaps++;
        
        // Visual feedback for perfect timing
        createEnhancedParticles('perfect');
        
        // Mobile haptic feedback for perfect timing
        if (window.triggerHaptic) {
            window.triggerHaptic('success');
        }
    } else if (timeSinceLastFlap < 0.1) {
        // Rapid tapping penalty - weaker flaps
        flapPower *= 0.8;
        momentumBonus = 0.7;
        
        // Light haptic feedback for rapid tapping
        if (window.triggerHaptic) {
            window.triggerHaptic('light');
        }
    } else {
        // Normal flap haptic feedback
        if (window.triggerHaptic) {
            window.triggerHaptic('light');
        }
    }
    
    // Preserve some momentum from previous movement
    if (mario.velocity > 0) { // If falling
        mario.momentum = mario.velocity * MOMENTUM_PRESERVATION;
    }
    
    // Apply enhanced flap velocity with momentum consideration
    mario.velocity = flapPower - (mario.momentum * 0.3);
    
    // Enhanced float timer with difficulty scaling
    mario.floatTimer = FLOAT_DURATION_SECONDS * (1 + mario.perfectFlaps * 0.02);
    mario.isFlapping = true;
    mario.lastFlapTime = currentTime;
    
    // Dynamic forward movement based on timing and current speed
    const forwardBoost = FORWARD_LEAP_VEL_CHANGE_PPS * momentumBonus;
    mario.velocityX += forwardBoost;
    
    // Enhanced speed capping with smoother transitions
    const maxSpeed = MAX_FORWARD_SPEED_PPS * (1 + difficultyMultiplier * 0.1);
    if (mario.velocityX > maxSpeed) {
        mario.velocityX = maxSpeed;
    }
    if (mario.velocityX < -maxSpeed * 0.5) {
        mario.velocityX = -maxSpeed * 0.5;
    }
    
    // Create enhanced particle effects
    createEnhancedParticles('normal');
    
    // Play flap sound
    if (window.eightBitAudio) {
        window.eightBitAudio.playFlap();
    }
}

// Update smoke trail particles
function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update position
        p.x += p.speedX_pps * deltaTime;
        p.y += p.speedY_pps * deltaTime;
        
        // Decrease life (opacity)
        p.life -= PARTICLE_LIFE_DECAY_PER_SEC * deltaTime;
        
        // Remove dead particles
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Create enhanced smoke trail particles with different effects
function createEnhancedParticles(type = 'normal') {
    let numParticles, colors, speeds, sizes;
    
    switch(type) {
        case 'perfect':
            numParticles = 8 + Math.floor(Math.random() * 6);
            colors = ['#FFD700', '#FFA500', '#FFFF00']; // Gold colors for perfect timing
            speeds = { multiplier: 1.5 };
            sizes = { base: 6, variation: 8 };
            break;
        case 'score':
            numParticles = 12 + Math.floor(Math.random() * 8);
            colors = ['#00FF00', '#32CD32', '#90EE90']; // Green colors for scoring
            speeds = { multiplier: 2.0 };
            sizes = { base: 4, variation: 6 };
            break;
        default: // 'normal'
            numParticles = 6 + Math.floor(Math.random() * 4);
            colors = ['#FFFFFF', '#EEEEEE', '#DDDDDD']; // White/gray for normal
            speeds = { multiplier: 1.0 };
            sizes = { base: 4, variation: 6 };
    }
    
    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.random() - 0.5) * Math.PI; // Random angle
        const speed = (0.5 + Math.random() * 0.5) * speeds.multiplier;
        
        particles.push({
            x: mario.x + mario.width / 2,
            y: mario.y + mario.height / 2 + (Math.random() * 10 - 5),
            size: sizes.base + Math.random() * sizes.variation,
            speedX_pps: (PARTICLE_MIN_SPEED_X_PPS + Math.random() * (PARTICLE_MAX_SPEED_X_PPS - PARTICLE_MIN_SPEED_X_PPS)) * speed,
            speedY_pps: (PARTICLE_MIN_SPEED_Y_PPS + Math.random() * (PARTICLE_MAX_SPEED_Y_PPS - PARTICLE_MIN_SPEED_Y_PPS)) * speed,
            life: 1.0 + (type === 'perfect' ? 0.5 : 0), // Perfect particles last longer
            color: colors[Math.floor(Math.random() * colors.length)],
            type: type
        });
    }
}

// Render smoke trail particles
function renderParticles() {
    for (const p of particles) {
        // 8-bit style: draw squares with pixelated edges
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        
        // Draw a pixelated square (no anti-aliasing)
        const size = Math.floor(p.size);  // Ensure whole pixel sizes
        const x = Math.floor(p.x);  // Ensure whole pixel positions
        const y = Math.floor(p.y);
        ctx.fillRect(x, y, size, size);
    }
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
}

// Update game state with enhanced physics and progressive difficulty
function update(deltaTime) {
    if (!gameStarted || gameOver) return;
    
    // Calculate progressive difficulty based on score
    updateDifficulty();
    
    // Enhanced physics updates
    updateEnhancedPhysics(deltaTime);
    
    // Update character animation and effects
    updateCharacterAnimation(deltaTime);
    
    // Handle collision detection with enhanced precision
    updateCollisions();
    
    // Manage pipe system with dynamic generation
    updatePipeSystem(deltaTime);
    
    // Update particle systems
    updateParticles(deltaTime);
    
    // Update bonus text displays
    updateBonusTexts(deltaTime);
}

// Calculate and update progressive difficulty scaling
function updateDifficulty() {
    // Base difficulty scaling
    difficultyMultiplier = 1.0 + (score * DIFFICULTY_SCALE_RATE);
    difficultyMultiplier = Math.min(difficultyMultiplier, MAX_DIFFICULTY_MULTIPLIER);
    
    // Update pipe speed with scaling
    currentPipeSpeed = BASE_PIPE_SPEED_PPS * (1 + score * SPEED_INCREASE_RATE);
    currentPipeSpeed = Math.min(currentPipeSpeed, BASE_PIPE_SPEED_PPS * 2.2); // Cap at 2.2x base speed
    
    // Update gravity (slightly increases with difficulty)
    currentGravity = BASE_GRAVITY_ACCEL * (1 + difficultyMultiplier * 0.15);
    
    // Update pipe gap (decreases with score, but not too much)
    currentPipeGap = Math.max(MIN_PIPE_GAP, BASE_PIPE_GAP - (score * GAP_DECREASE_RATE));
    
    // Update spawn interval (faster spawning at higher scores)
    currentSpawnInterval = Math.max(MIN_PIPE_SPAWN_INTERVAL, 
        BASE_PIPE_SPAWN_INTERVAL - (score * 25));
}

// Enhanced physics system with variable gravity and air resistance
function updateEnhancedPhysics(deltaTime) {
    // Hold timer tracking for input
    if (mario.holdTimer > 0) {
        mario.holdTimer++;
    }
    
    // Variable gravity system
    let gravityToApply = currentGravity;
    
    // Float effect with enhanced physics
    if (mario.floatTimer > 0) {
        gravityToApply *= FLOAT_GRAVITY_MULTIPLIER;
        
        // Perfect timing bonus - reduced gravity for skilled players
        if (mario.perfectFlaps > 2) {
            gravityToApply *= PRECISION_FLAP_BONUS;
        }
        
        mario.floatTimer -= deltaTime;
        if (mario.floatTimer < 0) mario.floatTimer = 0;
    }
    
    // Variable gravity based on velocity (faster falling = stronger gravity)
    if (mario.velocity > 200) { // If falling fast
        gravityToApply *= VARIABLE_GRAVITY_FACTOR;
    }
    
    // Apply gravity with terminal velocity
    mario.velocity += gravityToApply * deltaTime;
    if (mario.velocity > TERMINAL_VELOCITY) {
        mario.velocity = TERMINAL_VELOCITY;
    }
    
    // Apply air resistance for more realistic movement
    mario.velocity *= Math.pow(AIR_RESISTANCE_FACTOR, 60 * deltaTime);
    
    // Apply vertical movement
    mario.y += mario.velocity * deltaTime;
    
    // Enhanced horizontal movement with improved drag
    mario.x += mario.velocityX * deltaTime;
    
    // Progressive drag system (more drag at higher speeds)
    const dragFactor = FORWARD_DRAG_FACTOR - (Math.abs(mario.velocityX) / 1000) * 0.02;
    mario.velocityX *= Math.pow(dragFactor, 60 * deltaTime);
    
    // Fixed character bounds to keep character on the left side
    const minX = 40; // Fixed minimum position - no score-based movement
    const maxX = Math.min(canvas.width / 4, 100); // Reduced maximum to keep character more left-aligned
    
    if (mario.x < minX) {
        mario.x = minX;
        mario.velocityX = Math.max(0, mario.velocityX); // Only stop leftward movement
    } else if (mario.x > maxX) {
        mario.x = maxX;
        mario.velocityX = Math.min(0, mario.velocityX); // Only stop rightward movement
    }
    
    // Enhanced rotation system
    const maxRotation = 0.6;
    const targetRotation = Math.max(-maxRotation, Math.min(maxRotation, 
        mario.velocity / (ROTATION_SENSITIVITY * 10)));
    
    // Smoother rotation interpolation
    mario.smoothRotation = mario.smoothRotation * ROTATION_SMOOTHING + 
        targetRotation * (1 - ROTATION_SMOOTHING);
}

// Update character animation and visual effects
function updateCharacterAnimation(deltaTime) {
    mario.animationFrameCount += MARIO_ANIM_FPS * deltaTime;
    
    // Create enhanced particle effects during flapping
    if (mario.isFlapping) {
        createEnhancedParticles('normal');
        mario.isFlapping = false;
    }
    
    // Reset perfect flap counter gradually
    if (mario.perfectFlaps > 0 && Math.random() < 0.001) {
        mario.perfectFlaps = Math.max(0, mario.perfectFlaps - 1);
    }
}

// Enhanced collision detection
function updateCollisions() {
    // Ground collision with enhanced response
    if (mario.y + mario.height > ground.y) {
        mario.y = ground.y - mario.height;
        gameEnd();
        return;
    }
    
    // Ceiling collision with bounce effect
    if (mario.y < 0) {
        mario.y = 0;
        mario.velocity = Math.abs(mario.velocity) * 0.3; // Small bounce effect
    }
}

// Enhanced pipe system with dynamic generation
function updatePipeSystem(deltaTime) {
    const currentTime = Date.now();
    
    // Dynamic pipe spawning based on difficulty
    if (currentTime - lastPipeSpawn > currentSpawnInterval) {
        spawnEnhancedPipe();
        lastPipeSpawn = currentTime;
    }
    
    // Update and check pipe collisions
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        
        // Move pipes with current speed
        pipe.x -= currentPipeSpeed * deltaTime;
        
        // Remove off-screen pipes
        if (pipe.x + pipe.width < 0) {
            pipes.splice(i, 1);
            continue;
        }
        
        // Enhanced collision detection with smaller hitbox for fairness
        const hitboxReduction = 0; // Removed hitbox reduction - collision should be exact
        const playerHitbox = {
            x: mario.x + hitboxReduction,
            y: mario.y + hitboxReduction,
            width: mario.width - (hitboxReduction * 2),
            height: mario.height - (hitboxReduction * 2)
        };
        
        // Debug logging
        if (pipes.length > 0) {
            const isOverlapping = (mario.x < pipe.x + pipe.width && mario.x + mario.width > pipe.x);
            if (isOverlapping) {
                console.log('Player overlapping with pipe horizontally', {
                    playerX: mario.x,
                    playerY: mario.y,
                    playerWidth: mario.width,
                    playerHeight: mario.height,
                    pipeX: pipe.x,
                    pipeTopHeight: pipe.top.height,
                    pipeBottomY: pipe.bottom.y
                });
            }
        }
        
        // Check collision with basic, reliable collision detection
        if (checkCollision(playerHitbox, pipe.top) || 
            checkCollision(playerHitbox, pipe.bottom)) {
            console.log('Collision detected!'); // Debug log
            gameEnd();
            return;
        }
        
        // Additional simple collision check as backup
        const isInPipeHorizontally = mario.x < pipe.x + pipe.width && mario.x + mario.width > pipe.x;
        const isInTopPipe = mario.y < pipe.top.height;
        const isInBottomPipe = mario.y + mario.height > pipe.bottom.y;
        
        if (isInPipeHorizontally && (isInTopPipe || isInBottomPipe)) {
            console.log('Simple collision detected!');
            gameEnd();
            return;
        }
        
        // Score detection with visual feedback
        if (!pipe.passed && mario.x > pipe.x + pipe.width) {
            pipe.passed = true;
            
            // Calculate bonus scoring
            let scoreToAdd = 1;
            let bonusReasons = [];
            
            // Difficulty bonus
            if (pipe.scoreMultiplier > 1) {
                scoreToAdd += 1;
                bonusReasons.push('TIGHT GAP');
            }
            
            // Perfect flap bonus
            if (mario.perfectFlaps > 2) {
                scoreToAdd += 1;
                bonusReasons.push('PERFECT TIMING');
            }
            
            // Speed bonus at high difficulty
            if (difficultyMultiplier > 2.0) {
                scoreToAdd += 1;
                bonusReasons.push('HIGH SPEED');
            }
            
            // Consecutive perfect flaps mega bonus
            if (mario.perfectFlaps > 5) {
                scoreToAdd += 2;
                bonusReasons.push('SKILL MASTER');
            }
            
            score += scoreToAdd;
            updateScore();
            
            // Enhanced visual feedback for bonus scoring
            if (scoreToAdd > 1) {
                createEnhancedParticles('score');
                // Show bonus text briefly
                showBonusText(bonusReasons, scoreToAdd);
            } else {
                createEnhancedParticles('normal');
            }
            
            // Enhanced audio feedback
            if (window.eightBitAudio) {
                window.eightBitAudio.playScoreSound();
            } else {
                scoreSoundContext = window.gameSounds.score();
            }
        }
    }
}

// Render game
function render() {
    // Clear everything first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the background
    drawBackground();
    
    // Draw pipes
    drawPipes();
    
    // Draw a thin border where city meets ground
    ctx.fillStyle = isDarkMode ? '#1A4020' : '#8CC312'; // Dark or light green
    ctx.fillRect(0, ground.y - 1, canvas.width, 1);
    
    // Draw a velocity indicator to help with strategic flapping
    if (gameStarted && !gameOver) {
        const indicatorX = 30;
        const indicatorY = 100;
        const indicatorHeight = 120;
        const indicatorWidth = 10;
        
        // Enhanced background bar with difficulty coloring
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        
        // Difficulty indicator (border color)
        let difficultyColor = '#00FF00'; // Green for easy
        if (difficultyMultiplier > 1.5) difficultyColor = '#FFFF00'; // Yellow for medium
        if (difficultyMultiplier > 2.0) difficultyColor = '#FF6600'; // Orange for hard
        if (difficultyMultiplier > 2.3) difficultyColor = '#FF0000'; // Red for extreme
        
        ctx.strokeStyle = difficultyColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(indicatorX - 1, indicatorY - 1, indicatorWidth + 2, indicatorHeight + 2);
        
        // Enhanced velocity indicator
        const maxDisplayVelocity = 600; // Adjusted for new physics
        const normalizedVelocity = (mario.velocity + maxDisplayVelocity/2) / maxDisplayVelocity;
        const clampedVelocity = Math.max(0, Math.min(1, normalizedVelocity));
        const velocityHeight = indicatorHeight * clampedVelocity;
        
        // Enhanced color coding based on physics state
        let velocityColor;
        if (mario.floatTimer > 0) {
            velocityColor = '#FFD700'; // Gold during float
        } else if (mario.velocity < -150) {
            velocityColor = '#00FF00'; // Green for strong upward
        } else if (mario.velocity < -50) {
            velocityColor = '#90EE90'; // Light green for upward
        } else if (mario.velocity < 100) {
            velocityColor = '#FFFF00'; // Yellow for neutral
        } else if (mario.velocity < 300) {
            velocityColor = '#FFA500'; // Orange for falling
        } else {
            velocityColor = '#FF0000'; // Red for fast falling
        }
        
        ctx.fillStyle = velocityColor;
        ctx.fillRect(indicatorX, indicatorY + indicatorHeight - velocityHeight, 
                    indicatorWidth, velocityHeight);
        
        // Perfect flap counter
        if (mario.perfectFlaps > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '10px PressStart2P, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`PERFECT: ${mario.perfectFlaps}`, indicatorX + 15, indicatorY + 15);
        }
        
        // Speed indicator
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '8px PressStart2P, monospace';
        ctx.textAlign = 'left';
        const speedPercent = Math.round((currentPipeSpeed / BASE_PIPE_SPEED_PPS - 1) * 100);
        if (speedPercent > 0) {
            ctx.fillText(`SPEED +${speedPercent}%`, indicatorX + 15, indicatorY + 35);
        }
        
        // Difficulty display
        ctx.fillStyle = difficultyColor;
        ctx.fillText(`DIFF: ${difficultyMultiplier.toFixed(1)}x`, indicatorX + 15, indicatorY + 50);
    }
    
    // Draw the ground
    drawGround();
    
    // Add pixelated grass details for 8-bit effect
    ctx.fillStyle = '#A2D65B'; // Lighter green for grass highlights
    for (let x = 0; x < canvas.width; x += 8) {
        // Create pixelated grass pattern
        const grassHeight = 4 + (x % 16 === 0 ? 4 : 0); // Alternate heights
        ctx.fillRect(x, ground.y - grassHeight, 4, grassHeight);
    }
    
    
    // Render smoke trail particles behind character
    renderParticles();
    
    // Draw selected character (Taz/Chloe) with slight rotation based on velocity
    const charSprite = getCurrentCharacterSprite();
    
    // Save the current context state
    ctx.save();
    
    // Move to character position
    ctx.translate(mario.x + mario.width / 2, mario.y + mario.height / 2);
    
    // Use the smoothly interpolated rotation value
    const rotation = mario.smoothRotation;
    ctx.rotate(rotation);
    
    // Draw character (centered) with 8-bit animation effect
    // Apply a slight up/down bounce effect based on animationFrameCount
    const bounceOffset = mario.isFlapping ? Math.sin(mario.animationFrameCount * 2) * 2 : 0; // The '2' multiplier might need adjustment based on MARIO_ANIM_FPS
    ctx.drawImage(charSprite, -mario.width / 2, -mario.height / 2 + bounceOffset, mario.width, mario.height);
    
    // Restore context
    ctx.restore();
    
    // Render bonus texts
    renderBonusTexts();
    
    // Draw score with 8-bit style
    // Draw score in a pixelated rectangle box (no rounded corners for 8-bit style)
    const scoreText = score.toString();
    const scoreWidth = scoreText.length * 20 + 20;
    
    // Draw score box (black pixelated rectangle)
    ctx.fillStyle = COLORS_8BIT.scoreBox;
    ctx.fillRect((canvas.width - scoreWidth) / 2, 20, scoreWidth, 40);
    
    // Add a white border for 8-bit style
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect((canvas.width - scoreWidth) / 2, 20, scoreWidth, 40);
    
    // Draw score text
    ctx.font = 'bold 22px PressStart2P, monospace';
    ctx.fillStyle = '#FFFFFF'; // White text for better 8-bit contrast
    ctx.textAlign = 'center';
    ctx.fillText(scoreText, canvas.width / 2, 48);
}

// Spawn a new pipe
function spawnPipe() {
    // Redirect to enhanced version
    spawnEnhancedPipe();
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// End the game with GTA-style WASTED effect
async function gameEnd() {
    if (gameOver) return;
    
    console.log('🎮 === GAME END START ===');
    gameOver = true;
    
    // Dispatch mobile game over event
    document.dispatchEvent(new CustomEvent('game:over', { 
        detail: { finalScore: score, highScore: highScore } 
    }));
    
    // Stop the game loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Enhanced crash effect with mobile feedback (with error protection)
    try {
        if (window.eightBitAudio && typeof window.eightBitAudio.playHit === 'function') {
            window.eightBitAudio.playHit();
            console.log('✅ Hit sound played');
            
            // Brief pause before game over sound
            setTimeout(() => {
                try {
                    if (window.eightBitAudio && typeof window.eightBitAudio.playGameOver === 'function') {
                        window.eightBitAudio.playGameOver();
                        console.log('✅ Game over sound played');
                    }
                } catch (audioErr) {
                    console.warn('⚠️ Error playing game over sound:', audioErr);
                }
            }, 500);
        } else {
            console.warn('⚠️ Audio system not available or playHit function missing');
        }
    } catch (audioErr) {
        console.warn('⚠️ Error playing hit sound:', audioErr);
    }
    
    // Mobile haptic feedback for game over
    try {
        if (window.triggerHaptic) {
            window.triggerHaptic('error');
        }
    } catch (hapticErr) {
        console.warn('⚠️ Error with haptic feedback:', hapticErr);
    }
    
    // Apply visual effects
    try {
        applyWastedEffect();
        gameOverEffect();
    } catch (visualErr) {
        console.warn('⚠️ Error with visual effects:', visualErr);
    }
    
    // Update final score display and check for high scores
    finalScoreDisplay.textContent = score;
    
    // Update high score if needed (this should happen before we check for leaderboard qualification)
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flattenhundHighScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
    
    // End game session in Supabase if available (non-blocking)
    try {
        if (window.supabaseHelpers && currentSession) {
            window.supabaseHelpers.endGameSession(
                currentSession,
                score,
                Math.floor(performance.now() / 1000)
            ).catch(err => console.error('Error ending game session:', err));
        }
    } catch (supabaseErr) {
        console.warn('⚠️ Error with Supabase session end:', supabaseErr);
    }
    
    console.log('🎮 Starting game over screen timeout...');
    
    // Show game over screen after a delay - much faster response
    setTimeout(async () => {
        console.log('🎮 === SHOWING GAME OVER SCREEN ===');
        
        try {
            gameOverScreen.style.display = 'flex';
            console.log('✅ Game over screen displayed');
            
            // IMPORTANT: Wait for leaderboard refresh to complete before checking high scores
            console.log('🔄 Refreshing leaderboard before high score check...');
            try {
                if (window.refreshLeaderboard) {
                    await window.refreshLeaderboard(); // Wait for completion
                    console.log('✅ Leaderboard refresh completed, now checking high scores...');
                }
            } catch (err) {
                console.error('❌ Error refreshing leaderboard:', err);
            }
            
            // Check for high score qualification AFTER leaderboard is refreshed
            setTimeout(() => {
                if (window.checkAndPromptForPersonalBest) {
                    try {
                        console.log('🎯 Checking for high score qualification with score:', score);
                        const result = window.checkAndPromptForPersonalBest(score);
                        console.log('🎯 High score check result:', result);
                    } catch (err) {
                        console.error('❌ Error checking high score qualification:', err);
                    }
                } else {
                    console.error('❌ checkAndPromptForPersonalBest function not available');
                }
            }, 300); // Shorter delay since leaderboard is already loaded
            
            // Mobile hint for restart
            if (window.showMobileHint) {
                setTimeout(() => {
                    window.showMobileHint('Tap "Play Again" to restart!', 3000);
                }, 1500); // Adjusted for faster screen appearance
            }
        } catch (gameOverErr) {
            console.error('❌ Critical error in game over screen display:', gameOverErr);
            // Force show the game over screen even if there are errors
            if (gameOverScreen) {
                gameOverScreen.style.display = 'flex';
                console.log('🚨 Force-displayed game over screen after error');
            }
        }
    }, 800); // Reduced from 2000ms to 800ms for much faster response
    
    console.log('🎮 === GAME END SETUP COMPLETE ===');
}

// Function to update score with mobile enhancements
function updateScore() {
    scoreDisplay.textContent = score;
    
    // Check for high score achievements and update storage
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flattenhundHighScore', highScore);
        highScoreDisplay.textContent = highScore;
        
        // Mobile haptic feedback for new high score
        if (window.triggerHaptic) {
            window.triggerHaptic('success');
        }
        
        // Show mobile hint for high score
        if (window.showMobileHint) {
            window.showMobileHint(`New High Score: ${score}!`, 2000);
        }
    }
    
    // Dispatch score event for mobile optimization
    document.dispatchEvent(new CustomEvent('game:score', { 
        detail: { score: score, isHighScore: score > highScore } 
    }));
}

// Apply GTA-style WASTED effect
function applyWastedEffect() {
    // Create a desaturation filter on the canvas
    canvas.style.transition = 'all 1.5s ease-in-out';
    canvas.style.filter = 'grayscale(80%) contrast(120%) brightness(70%)';
    
    // Add a red tint to simulate GTA effect
    const gameContainer = document.querySelector('.game-container');
    gameContainer.style.boxShadow = 'inset 0 0 100px rgba(255, 0, 0, 0.3)';
    
    // Slow down the game animation
    const slowMotionFrames = 15; // Number of frames to show slow motion
    let frameCount = 0;
    
    function slowMotionRender() {
        if (frameCount < slowMotionFrames && gameOver) {
            render(); // Render the game at a slower pace
            frameCount++;
            setTimeout(slowMotionRender, 100); // Slow down the frame rate
        }
    }
    
    slowMotionRender();
}

// Add a pixelated Game Over effect
function gameOverEffect() {
    // Flash the canvas briefly for game over effect
    canvas.style.filter = 'brightness(200%) contrast(200%)';
    setTimeout(() => {
        canvas.style.filter = 'none';
    }, 100);
}

// Input handlers
function handleKeyDown(e) {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameOver) {
        if (!gameStarted) {
            startGame();
        } else {
            flap();
            // Start tracking hold time
            mario.holdTimer = 1;
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        // Reset hold timer when key is released
        mario.holdTimer = 0;
    }
}

// Enhanced touch handlers with better mobile integration
function handleTouchStart(e) {
    e.preventDefault();
    
    // Prevent multi-touch issues
    if (e.touches.length > 1) return;
    
    if (!gameOver) {
        if (!gameStarted) {
            // Only start if character is selected
            if (selectedCharacter) {
                startGame();
            } else {
                // Show hint to select character
                if (window.showMobileHint) {
                    window.showMobileHint('Please select a character first!', 2000);
                }
            }
        } else {
            flap();
            // Start tracking hold time
            mario.holdTimer = 1;
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    // Reset hold timer when touch ends
    mario.holdTimer = 0;
}

// Enhanced mouse handlers for desktop/mobile hybrid devices
function handleMouseDown(e) {
    // Prevent if this is a touch device to avoid double events
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        return;
    }
    
    if (!gameOver) {
        if (!gameStarted) {
            if (selectedCharacter) {
                startGame();
            }
        } else {
            flap();
            // Start tracking hold time
            mario.holdTimer = 1;
        }
    } else {
        resetGame();
    }
}

function handleMouseUp(e) {
    // Reset hold timer when mouse button is released
    mario.holdTimer = 0;
}

// Initialize the game when the page loads
window.addEventListener('load', init);

// Enhanced pipe spawning with dynamic patterns
function spawnEnhancedPipe() {
    const pipeWidth = 85; // Fixed width for consistency
    
    // Calculate responsive safe boundaries based on screen size
    const screenHeight = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
    const isSmallScreen = screenHeight < 500;
    
    // Scale margins based on screen size
    const safeTopMargin = isSmallScreen ? Math.max(40, screenHeight * 0.08) : 80;
    const safeBottomMargin = GROUND_HEIGHT + (isSmallScreen ? Math.max(40, screenHeight * 0.08) : 80);
    const availableHeight = screenHeight - safeTopMargin - safeBottomMargin;
    
    // Scale minimum gap based on screen size
    let baseMinGap = isSmallScreen ? Math.max(100, screenHeight * 0.2) : 140;
    let actualGap = Math.max(currentPipeGap, baseMinGap);
    
    console.log('Pipe generation params:', {
        screenHeight,
        isSmallScreen,
        safeTopMargin,
        safeBottomMargin,
        availableHeight,
        baseMinGap,
        actualGap
    });
    
    // Apply controlled difficulty scaling for gap (only slight reduction)
    if (score >= 10) {
        const maxReduction = isSmallScreen ? 15 : 20; // Less reduction on small screens
        const reduction = Math.min(maxReduction, Math.floor(score / 5) * 2);
        const absoluteMinGap = isSmallScreen ? Math.max(80, screenHeight * 0.15) : 120;
        actualGap = Math.max(actualGap - reduction, absoluteMinGap);
    }
    
    // Calculate the maximum possible top pipe height
    const maxTopHeight = availableHeight - actualGap;
    
    // Ensure we have enough room for a reasonable pipe configuration
    const minPipeHeight = isSmallScreen ? 40 : 60;
    if (maxTopHeight < minPipeHeight) {
        console.warn('Cannot create pipe: insufficient height available', {
            maxTopHeight,
            minPipeHeight,
            availableHeight,
            actualGap
        });
        return; // Don't create pipe if impossible
    }
    
    // Calculate a reasonable range for top pipe height
    const minTopHeight = Math.max(minPipeHeight, safeTopMargin);
    const adjustedMaxHeight = Math.min(maxTopHeight, availableHeight - minPipeHeight);
    
    // Generate top pipe height within safe bounds
    const topHeight = minTopHeight + Math.random() * (adjustedMaxHeight - minTopHeight);
    const bottomY = topHeight + actualGap;
    
    // Validate the configuration before creating the pipe (using screen height not canvas height)
    if (bottomY + minPipeHeight > screenHeight - GROUND_HEIGHT) {
        console.warn('Pipe configuration invalid: bottom pipe would be too low', {
            bottomY,
            minPipeHeight,
            screenHeight,
            groundHeight: GROUND_HEIGHT
        });
        return; // Don't create invalid pipe
    }
    
    if (topHeight < minTopHeight) {
        console.warn('Pipe configuration invalid: top pipe would be too short', {
            topHeight,
            minTopHeight
        });
        return; // Don't create invalid pipe
    }
    
    // Create validated pipe object (use canvas dimensions for actual rendering)
    const newPipe = {
        x: canvas.width,
        width: pipeWidth,
        actualGap: actualGap,
        difficulty: difficultyMultiplier,
        top: {
            x: canvas.width,
            y: 0,
            height: topHeight,
            width: pipeWidth
        },
        bottom: {
            x: canvas.width,
            y: bottomY,
            height: screenHeight - bottomY - GROUND_HEIGHT,
            width: pipeWidth
        },
        passed: false,
        scoreMultiplier: actualGap < baseMinGap + 20 ? 2 : 1 // Bonus for tight gaps relative to screen
    };
    
    // Final validation before adding
    if (newPipe.bottom.height < minPipeHeight) {
        console.warn('Bottom pipe too short, rejecting pipe', {
            bottomHeight: newPipe.bottom.height,
            minPipeHeight
        });
        return;
    }
    
    console.log('Generated valid pipe:', {
        topHeight: newPipe.top.height,
        gap: actualGap,
        bottomY: newPipe.bottom.y,
        bottomHeight: newPipe.bottom.height,
        screenHeight,
        isSmallScreen
    });
    
    pipes.push(newPipe);
}

// Enhanced collision detection with more precise boundaries
function checkEnhancedCollision(rect1, rect2) {
    // Slightly forgiving collision detection - reduced margin for better accuracy
    const margin = 0.5; // Reduced from 2 to 0.5 pixels for better collision detection
    
    return (
        rect1.x < rect2.x + rect2.width - margin &&
        rect1.x + rect1.width > rect2.x + margin &&
        rect1.y < rect2.y + rect2.height - margin &&
        rect1.y + rect1.height > rect2.y + margin
    );
}

// Show bonus text for enhanced scoring
function showBonusText(reasons, points) {
    const bonusText = {
        text: `+${points} ${reasons[0]}`, // Show main reason
        x: mario.x + mario.width + 20,
        y: mario.y + mario.height / 2,
        life: 2.0, // 2 seconds
        color: points > 2 ? '#FFD700' : '#00FF00',
        fontSize: points > 2 ? 14 : 12
    };
    bonusTexts.push(bonusText);
    
    // Limit number of bonus texts on screen
    if (bonusTexts.length > 3) {
        bonusTexts.shift();
    }
}

// Update and render bonus texts
function updateBonusTexts(deltaTime) {
    for (let i = bonusTexts.length - 1; i >= 0; i--) {
        const bonus = bonusTexts[i];
        bonus.y -= 30 * deltaTime; // Float upward
        bonus.life -= deltaTime;
        
        if (bonus.life <= 0) {
            bonusTexts.splice(i, 1);
        }
    }
}

function renderBonusTexts() {
    for (const bonus of bonusTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, bonus.life / 2.0);
        ctx.fillStyle = bonus.color;
        ctx.font = `${bonus.fontSize}px PressStart2P, monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(bonus.text, bonus.x, bonus.y);
        ctx.restore();
    }
}
