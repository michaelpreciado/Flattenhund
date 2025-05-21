// Main game file for Flappy Mario
// This file handles the game initialization, loop, and core mechanics

// Game constants: all speed/acceleration values are in units per second (pixels/sec or pixels/sec^2)
// Target FPS for conversion baseline was 60 FPS.

const GRAVITY_ACCEL = 0.3 * 60 * 60; // (0.3 px/frame^2 * 60 frames/sec * 60) = 1080 px/sec^2 (was 0.275)
const FLAP_VELOCITY_SET = -6.0 * 60; // (-6.0 px/frame * 60 frames/sec) = -360 px/sec (velocity is set on flap)
const PIPE_SPEED_PPS = 3.1 * 60;     // (3.1 px/frame * 60 frames/sec) = 186 px/sec (was 2.7)
const FORWARD_LEAP_VEL_CHANGE_PPS = 0.8 * 60; // (0.8 px/frame * 60 frames/sec) = 48 px/sec (added to velocityX)
const MAX_FORWARD_SPEED_PPS = 2.5 * 60;   // (2.5 px/frame * 60 frames/sec) = 150 px/sec
const FORWARD_DRAG_FACTOR = 0.95;    // Multiplier per frame (will be scaled by deltaTime: Math.pow(FORWARD_DRAG_FACTOR, 60 * deltaTime))

const FLOAT_DURATION_SECONDS = 15 / 60; // (15 frames / 60 fps) = 0.25 seconds
const FLOAT_GRAVITY_MULTIPLIER = 0.7; // Gravity is multiplied by this during float

const PARTICLE_MIN_SPEED_X_PPS = -3 * 60; // -180 px/sec
const PARTICLE_MAX_SPEED_X_PPS = -1 * 60; // -60 px/sec
const PARTICLE_MIN_SPEED_Y_PPS = -1 * 60; // -60 px/sec
const PARTICLE_MAX_SPEED_Y_PPS = 1 * 60;  // 60 px/sec
const PARTICLE_LIFE_DECAY_PER_SEC = 0.05 * 60; // 3.0 units of life per second (assuming life is 1.0 initially)

const MARIO_ANIM_FPS = 0.2 * 60; // (0.2 anim_frames/game_frame * 60 game_frames/sec) = 12 animation frames/sec

// Game constants continue
const PIPE_SPAWN_INTERVAL = 2000; // Time between pipes (milliseconds) - (was 2200)
const PIPE_GAP = 170; // Reduced gap for harder gameplay (was 190)
const GROUND_HEIGHT = 120; // Taller ground section like in Flappy Bird
const MARIO_WIDTH = 48; // Increased character size
const MARIO_HEIGHT = 48; // Increased character size

// Game variables
let canvas, ctx;
let mario = {
    x: 80,
    y: 300,
    width: MARIO_WIDTH,
    height: MARIO_HEIGHT,
    velocity: 0,      // Vertical velocity
    velocityX: 0,     // Horizontal velocity for smooth movement
    isFlapping: false,
    frameCount: 0,    // For animation frames
    animationFrameCount: 0, // Accumulator for animation frames
    floatTimer: 0,    // Timer for floating effect (in seconds)
    smoothRotation: 0, // Smoothly interpolated rotation value
    holdTimer: 0     // Timer for tracking how long input is held
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
    
    // Game initialization
    
    // Set initial canvas dimensions and add resize listener
    resizeCanvas(); // Initial size
    window.addEventListener('resize', resizeCanvas);

    // For crisp pixel art rendering (will be set in resizeCanvas too)
    // ctx.imageSmoothingEnabled = false; // Moved to resizeCanvas
    
    // Initialize 8-bit audio system with reduced music
    if (window.eightBitAudio) {
        window.eightBitAudio.init();
        // Disable background music by default
        window.eightBitAudio.enableMusic(false);
    }
    
    // Ground position
    ground.y = canvas.height - GROUND_HEIGHT;
    
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
    
    // Initial render
    render();
    
    // Check if dark mode is enabled
    isDarkMode = document.body.classList.contains('dark-mode');
    
    // Expose theme update function for dark-mode.js
    window.updateGameTheme = function(darkModeEnabled) {
        isDarkMode = darkModeEnabled;
    };
}

// Function to handle canvas resizing
function resizeCanvas() {
    if (!canvas || !ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Update ground position
    ground.y = canvas.height - GROUND_HEIGHT;
    
    // Ensure crisp pixel art rendering after resize
    ctx.imageSmoothingEnabled = false;

    // If the game is over or not started, the main gameLoop isn't running render(),
    // so we might need to manually call render() here to update the static background elements.
    // However, if the game IS running, gameLoop will handle rendering.
    // For simplicity and to avoid potential double rendering issues if gameLoop is active,
    // we can just let the gameLoop handle it if active, or if not, just update static elements.
    // A simple render() call here should be okay as it redraws the current state.
    if (!gameStarted || gameOver) { 
        render(); // Redraw static elements or game over screen
    } 
    // If game is active, gameLoop will pick up the new dimensions in its next frame.
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
    
    // Only play sound effects, no continuous background music
    // Theme music is disabled by default
    
    // Reset mario position with a better head start
    mario.y = 230; // Start even higher in the air
    mario.velocity = -3.0 * 60; // Stronger initial upward velocity (-180 px/sec)
    mario.velocityX = 0.5 * 60; // Small initial forward momentum (30 px/sec)
    mario.x = 80; // Reset X position
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
    // Reset player variables before starting
    mario.velocity = 0;
    mario.velocityX = 0;
    mario.rotation = 0;
    mario.smoothRotation = 0;
    mario.x = 80;
    mario.floatTimer = 0;
    // Reset player properties
    
    // Reset canvas effects
    canvas.style.filter = 'none';
    canvas.style.transition = 'none';
    
    // Reset container effects
    const gameContainer = document.querySelector('.game-container');
    gameContainer.style.boxShadow = 'none';
    
    // Prepare game restart
    
    startGame();
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
    // Set vertical velocity and activate float timer
    mario.velocity = FLAP_VELOCITY_SET;
    mario.isFlapping = true;
    mario.floatTimer = FLOAT_DURATION_SECONDS; // Set float timer (in seconds)
    
    // Add forward velocity impulse
    mario.velocityX += FORWARD_LEAP_VEL_CHANGE_PPS;
    
    // Cap maximum forward speed
    if (mario.velocityX > MAX_FORWARD_SPEED_PPS) {
        mario.velocityX = MAX_FORWARD_SPEED_PPS;
    }
    if (mario.velocityX < -MAX_FORWARD_SPEED_PPS) { // Cap negative speed too if character can move backward
        mario.velocityX = -MAX_FORWARD_SPEED_PPS;
    }

    // Create smoke particles immediately upon flapping
    // The createSmokeTrail() call was already in update() based on mario.isFlapping, that's fine.
    
    // Reset flap count (if mario.flapCount is used elsewhere, seems it's not fully implemented yet)
    // setTimeout(() => {
    //     mario.flapCount = 0; 
    // }, 500);
    
    // Use 8-bit audio if available
    if (window.eightBitAudio) {
        window.eightBitAudio.playJumpSound();
    } else {
        flapSoundContext = window.gameSounds.flap();
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

// Create smoke trail particles when character jumps
function createSmokeTrail() {
    // Create 5-8 particles for each flap
    const numParticles = 5 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: mario.x,
            y: mario.y + mario.height/2 + (Math.random() * 10 - 5),
            size: 4 + Math.random() * 6,  // Pixelated small squares
            speedX_pps: PARTICLE_MIN_SPEED_X_PPS + Math.random() * (PARTICLE_MAX_SPEED_X_PPS - PARTICLE_MIN_SPEED_X_PPS),
            speedY_pps: PARTICLE_MIN_SPEED_Y_PPS + Math.random() * (PARTICLE_MAX_SPEED_Y_PPS - PARTICLE_MIN_SPEED_Y_PPS),
            life: 1.0,  // Full opacity to start
            color: Math.random() > 0.5 ? '#FFFFFF' : '#EEEEEE'  // White/light gray
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

// Update game state
function update(deltaTime) {
    if (!gameStarted || gameOver) return;
    
    // Update mario with floatier physics and forward leap
    
    // Simple hold timer tracking
    if (mario.holdTimer > 0) {
        mario.holdTimer++;
    }
    
    // Apply gravity
    let currentGravity = GRAVITY_ACCEL;
    if (mario.floatTimer > 0) {
        currentGravity *= FLOAT_GRAVITY_MULTIPLIER;
        mario.floatTimer -= deltaTime;
        if (mario.floatTimer < 0) mario.floatTimer = 0; // Ensure it doesn't go negative
    }
    mario.velocity += currentGravity * deltaTime;
    
    // Update character animation frame
    mario.animationFrameCount += MARIO_ANIM_FPS * deltaTime;
    
    if (mario.isFlapping) {
        // Create smoke particles when flapping
        createSmokeTrail();
        mario.isFlapping = false;
    }
    
    // Apply vertical velocity to position
    mario.y += mario.velocity * deltaTime;
    
    // Apply horizontal velocity to position with gradual slowdown
    mario.x += mario.velocityX * deltaTime;
    // Apply drag: V_new = V_old * (DRAG_FACTOR_PER_FRAME ^ (TARGET_FPS * deltaTime))
    // This ensures drag is consistent regardless of frame rate.
    mario.velocityX *= Math.pow(FORWARD_DRAG_FACTOR, 60 * deltaTime);
    
    // Keep character within reasonable bounds
    const minX = 40;
    const maxX = canvas.width / 3;
    if (mario.x < minX) {
        mario.x = minX;
        mario.velocityX = 0;
    } else if (mario.x > maxX) {
        mario.x = maxX;
        mario.velocityX = 0;
    }
    
    // Visual feedback - smooth rotation based on velocity
    const targetRotation = Math.max(-0.5, Math.min(0.5, mario.velocity / 10));
    
    // Smoothly interpolate rotation for more fluid movement
    mario.smoothRotation = mario.smoothRotation * 0.8 + targetRotation * 0.2;
    mario.rotation = mario.smoothRotation;
    
    // Check for collisions with ground
    if (mario.y + mario.height > ground.y) {
        mario.y = ground.y - mario.height;
        gameEnd();
    }
    
    // Check for collisions with ceiling
    if (mario.y < 0) {
        mario.y = 0;
        mario.velocity = 0;
    }
    
    // Spawn pipes
    const currentTime = Date.now();
    if (currentTime - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
        spawnPipe();
        lastPipeSpawn = currentTime;
    }
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= PIPE_SPEED_PPS * deltaTime;
        
        // Check if pipe is off screen
        if (pipe.x + pipe.width < 0) {
            pipes.splice(i, 1);
            continue;
        }
        
        // Check for collisions with pipes or if player tries to go around (force them through the gap)
        if (checkCollision(mario, pipe.top) || checkCollision(mario, pipe.bottom) || 
            // Check if player tries to fly over or under the pipes when they're in range
            (mario.x + mario.width > pipe.x && mario.x < pipe.x + pipe.width && 
             (mario.y < pipe.top.y + pipe.top.height || mario.y + mario.height > pipe.bottom.y))) {
            gameEnd();
        }
        
        // Check if mario passed the pipe
        if (!pipe.passed && mario.x > pipe.x + pipe.width) {
            pipe.passed = true;
            score++;
            updateScore();
            
            // Use 8-bit audio if available
            if (window.eightBitAudio) {
                window.eightBitAudio.playScoreSound();
            } else {
                scoreSoundContext = window.gameSounds.score();
            }
        }
    }
    
    updateParticles(deltaTime);
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
        const indicatorHeight = 100;
        const indicatorWidth = 8;
        
        // Background bar
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
        
        // Simple velocity indicator
        const normalizedVelocity = (mario.velocity + 8) / 16; // Map from -8 to 8 to 0 to 1
        const clampedVelocity = Math.max(0, Math.min(1, normalizedVelocity));
        const velocityHeight = indicatorHeight * clampedVelocity;
        
        // Color based on velocity (green for upward, yellow for neutral, red for fast downward)
        let velocityColor;
        if (mario.velocity < -2) velocityColor = '#50C878'; // Green for upward
        else if (mario.velocity < 2) velocityColor = '#FFD700'; // Yellow for neutral
        else velocityColor = '#FF6347'; // Red for fast downward
        
        ctx.fillStyle = velocityColor;
        ctx.fillRect(indicatorX, indicatorY + indicatorHeight - velocityHeight, 
                    indicatorWidth, velocityHeight);
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
    const pipeWidth = 90; // Wider pipes for better visibility
    const minHeight = 80; // Taller minimum pipe height
    const maxHeight = canvas.height - PIPE_GAP - minHeight - GROUND_HEIGHT;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const bottomY = topHeight + PIPE_GAP;
    
    pipes.push({
        x: canvas.width,
        width: pipeWidth,
        top: {
            y: 0,
            height: topHeight,
            width: pipeWidth
        },
        bottom: {
            y: bottomY,
            height: canvas.height - bottomY,
            width: pipeWidth
        },
        passed: false
    });
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
    gameOver = true;
    
    // Apply GTA-style effects
    applyWastedEffect();
    
    // Use 8-bit audio if available
    if (window.eightBitAudio) {
        window.eightBitAudio.playHitSound();
        setTimeout(() => {
            window.eightBitAudio.playGameOverSound();
        }, 500);
    } else {
        hitSoundContext = window.gameSounds.hit();
        setTimeout(() => {
            gameOverSoundContext = window.gameSounds.gameOver();
        }, 500);
    }
    
    // Update high score if needed
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flattenhundHighScore', highScore);
    }
    
    // Update game session in Supabase if available
    try {
        if (window.supabaseHelpers && currentSession) {
            await window.supabaseHelpers.updateGameSession(
                currentSession.id,
                score,
                mario.boostUsedCount
            );
        }
    } catch (err) {
        console.error('Error updating game session:', err);
    }
    
    // Update DOM elements
    finalScoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    
    // Show game over screen immediately but keep the slow reveal animation
    gameOverScreen.style.display = 'flex';
}
// Update score display
function updateScore() {
    scoreDisplay.textContent = score;
    
    // Add a small "flash" effect to the score display
    scoreDisplay.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreDisplay.style.transform = 'scale(1)';
    }, 100);
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

function handleTouchStart(e) {
    e.preventDefault();
    if (!gameOver) {
        if (!gameStarted) {
            startGame();
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

function handleMouseDown(e) {
    if (!gameOver) {
        if (!gameStarted) {
            startGame();
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
