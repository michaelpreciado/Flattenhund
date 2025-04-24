// Main game file for Flappy Mario
// This file handles the game initialization, loop, and core mechanics

// Game constants - modified for floatier feel with smooth forward movement
const GRAVITY = 0.25; // Reduced gravity for longer air time
const FLAP_FORCE = -6.0; // Gentler upward jump force
const PIPE_SPEED = 1.8; // Slightly slower pipe speed to match floatier movement
const FORWARD_LEAP = 0.8; // Forward acceleration on flap (smoother than instant leap)
const MAX_FORWARD_SPEED = 2.5; // Maximum forward speed
const FORWARD_DRAG = 0.95; // Gradual slowdown of forward movement

// Boost mechanic constants
const BOOST_FORCE = -10.0; // Stronger upward force during boost
const BOOST_FORWARD = 3.0; // Stronger forward acceleration during boost (increased from 1.5)
const BOOST_DURATION = 60; // Boost lasts for 60 frames (about 1 second)
const BOOST_COOLDOWN = 180; // Cooldown period before boost can be used again (3 seconds)
const BOOST_PARTICLES = 15; // Number of particles to create during boost
const BOOST_HORIZONTAL_FORCE = 0.2; // Constant horizontal force during boost
const PIPE_SPAWN_INTERVAL = 2200; // Even longer time between pipes (milliseconds)
const PIPE_GAP = 190; // Increased gap for easier gameplay
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
    animationSpeed: 0.2,  // Controls animation speed
    floatTimer: 0,    // Timer for floating effect
    smoothRotation: 0, // Smoothly interpolated rotation value
    boosting: false,  // Whether boost is active
    boostTimer: 0,    // Timer for boost duration
    boostCooldown: 0, // Cooldown timer before boost can be used again
    holdTimer: 0      // Timer for tracking how long input is held
};

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
let boostMeter; // Element to display boost cooldown

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
    
    // Create boost meter element
    createBoostMeter();
    
    // Set canvas dimensions
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // For crisp pixel art rendering
    ctx.imageSmoothingEnabled = false;
    
    // Initialize 8-bit audio system with reduced music
    if (window.eightBitAudio) {
        window.eightBitAudio.init();
        // Disable background music by default
        window.eightBitAudio.enableMusic(false);
    }
    
    // Ground position
    ground.y = canvas.height - GROUND_HEIGHT;
    
    // Load high score from local storage
    const savedHighScore = localStorage.getItem('flappyMarioHighScore');
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
function startGame() {
    // Default to Taz if none selected (should not happen)
    if (!selectedCharacter) selectedCharacter = 'taz';
    gameStarted = true;
    gameOver = false;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    score = 0;
    updateScore();
    
    // Only play sound effects, no continuous background music
    // Theme music is disabled by default
    
    // Reset mario position with a better head start
    mario.y = 230; // Start even higher in the air
    mario.velocity = -3.0; // Stronger initial upward velocity
    mario.velocityX = 0.5; // Small initial forward momentum
    mario.x = 80; // Reset X position
    mario.floatTimer = 20; // Start with float timer active
    mario.smoothRotation = 0; // Reset rotation
    
    // Clear pipes
    pipes = [];
    
    // Start game loop
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
    mario.boosting = false;
    mario.boostTimer = 0;
    mario.boostCooldown = 0;
    
    // Reset canvas effects
    canvas.style.filter = 'none';
    canvas.style.transition = 'none';
    
    // Reset container effects
    const gameContainer = document.querySelector('.game-container');
    gameContainer.style.boxShadow = 'none';
    
    // Reset boost meter
    updateBoostMeter();
    
    startGame();
}

// Game loop
function gameLoop() {
    update();
    render();
    
    if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// Make mario flap with floatier physics and smooth forward movement
function flap() {
    // Upward velocity with float effect
    mario.velocity = mario.boosting ? BOOST_FORCE : FLAP_FORCE;
    mario.isFlapping = true;
    mario.floatTimer = 15; // Set float timer for extended air time
    
    // Add smooth forward acceleration instead of instant leap
    mario.velocityX += mario.boosting ? BOOST_FORWARD : FORWARD_LEAP;
    
    // Cap maximum forward speed (higher cap during boost)
    const maxSpeed = mario.boosting ? MAX_FORWARD_SPEED * 1.5 : MAX_FORWARD_SPEED;
    if (mario.velocityX > maxSpeed) {
        mario.velocityX = maxSpeed;
    }
    
    // Reset flap count after a short delay (allows for strategic double-taps)
    setTimeout(() => {
        mario.flapCount = 0;
    }, 500);
    
    // Use 8-bit audio if available
    if (window.eightBitAudio) {
        window.eightBitAudio.playJumpSound();
    } else {
        flapSoundContext = window.gameSounds.flap();
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
            speedX: -1 - Math.random() * 2,  // Move left (behind character)
            speedY: Math.random() * 2 - 1,  // Slight up/down movement
            life: 1.0,  // Full opacity to start
            color: Math.random() > 0.5 ? '#FFFFFF' : '#EEEEEE'  // White/light gray
        });
    }
}

// Create simple smoke trail particles
function createSmokeTrail() {
    // Create 5-8 particles for each flap
    const numParticles = 5 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: mario.x,
            y: mario.y + mario.height/2 + (Math.random() * 10 - 5),
            size: 4 + Math.random() * 6,  // Pixelated small squares
            speedX: -1 - Math.random() * 2,  // Move left (behind character)
            speedY: Math.random() * 2 - 1,  // Slight up/down movement
            life: 1.0,  // Full opacity to start
            color: Math.random() > 0.5 ? '#FFFFFF' : '#EEEEEE'  // White/light gray
        });
    }
}

// Update smoke trail particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Decrease life (opacity)
        p.life -= 0.05;
        
        // Remove dead particles
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
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
function update() {
    if (!gameStarted || gameOver) return;
    
    // Update mario with floatier physics and forward leap
    
    // Check for hold-to-boost activation
    if (mario.holdTimer > 0) {
        mario.holdTimer++;
        
        // Activate boost after holding for 20 frames (about 1/3 second)
        if (mario.holdTimer >= 20 && !mario.boosting && mario.boostCooldown <= 0) {
            // Activate boost
            activateBoost();
        }
    }
    
    // Update boost timers
    if (mario.boosting) {
        mario.boostTimer--;
        if (mario.boostTimer <= 0) {
            // End boost
            mario.boosting = false;
            mario.boostTimer = 0;
        }
    }
    
    // Update boost cooldown
    if (mario.boostCooldown > 0) {
        mario.boostCooldown--;
        updateBoostMeter();
    }
    
    // Apply reduced gravity when float timer is active or during boost
    if (mario.floatTimer > 0 || mario.boosting) {
        mario.velocity += GRAVITY * (mario.boosting ? 0.5 : 0.7); // Even less gravity during boost
        mario.floatTimer--;
    } else {
        mario.velocity += GRAVITY;
    }
    
    // Update character animation frame
    mario.frameCount += mario.animationSpeed;
    
    if (mario.isFlapping) {
        // Create smoke particles when flapping
        createSmokeTrail();
        mario.isFlapping = false;
    }
    
    // Apply velocity to position with smooth movement
    mario.y += mario.velocity;
    
    // Apply horizontal velocity with gradual slowdown
    // Add constant horizontal force during boost
    if (mario.boosting) {
        mario.velocityX += BOOST_HORIZONTAL_FORCE; // Constant forward propulsion during boost
    }
    
    mario.x += mario.velocityX;
    mario.velocityX *= FORWARD_DRAG; // Gradually slow down
    
    // Keep character within reasonable bounds
    const minX = 40;
    // Allow character to go further right during boost for more dynamic movement
    const maxX = mario.boosting ? canvas.width / 2 : canvas.width / 3;
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
        pipe.x -= PIPE_SPEED;
        
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
    
    updateParticles();
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
    // Apply a slight up/down bounce effect based on frameCount
    const bounceOffset = mario.isFlapping ? Math.sin(mario.frameCount * 2) * 2 : 0;
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
function gameEnd() {
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
        localStorage.setItem('flappyMarioHighScore', highScore);
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
            // Start tracking hold time for boost
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
            // Start tracking hold time for boost
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
            // Start tracking hold time for boost
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
