// Background effects for Flappy 8-Bit
// Adds animated birds in day mode and shooting stars/UFOs in night mode

// Background objects arrays
let birds = [];
let shootingStars = [];
let ufos = [];

// Configuration
const MAX_BIRDS = 3;
const MAX_SHOOTING_STARS = 2;
const MAX_UFOS = 1;
const BIRD_SPAWN_CHANCE = 0.01; // 1% chance per frame
const SHOOTING_STAR_SPAWN_CHANCE = 0.005; // 0.5% chance per frame
const UFO_SPAWN_CHANCE = 0.002; // 0.2% chance per frame

// Initialize background effects
function initBackgroundEffects() {
    // Birds, shooting stars and UFOs will be created during the game loop
    birds = [];
    shootingStars = [];
    ufos = [];
}

// Update all background effects
function updateBackgroundEffects() {
    if (!gameStarted || gameOver) return;
    
    // Check if we're in day or night mode
    if (isDarkMode) {
        // Night mode: shooting stars and UFOs
        updateShootingStars();
        updateUFOs();
        
        // Clear birds in night mode
        birds = [];
    } else {
        // Day mode: birds
        updateBirds();
        
        // Clear night objects in day mode
        shootingStars = [];
        ufos = [];
    }
}

// Update birds in day mode
function updateBirds() {
    // Move existing birds
    for (let i = birds.length - 1; i >= 0; i--) {
        const bird = birds[i];
        
        // Move bird
        bird.x += bird.speed;
        
        // Animate bird (flap wings)
        bird.frameTimer += 1;
        if (bird.frameTimer > 10) {
            bird.frame = (bird.frame + 1) % 2;
            bird.frameTimer = 0;
        }
        
        // Remove if off screen
        if (bird.x > canvas.width + 20 || bird.x < -20) {
            birds.splice(i, 1);
        }
    }
    
    // Spawn new birds randomly
    if (birds.length < MAX_BIRDS && Math.random() < BIRD_SPAWN_CHANCE) {
        // 50% chance to spawn from left or right
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -20 : canvas.width + 20;
        const y = 50 + Math.random() * (canvas.height - GROUND_HEIGHT - 100);
        const speed = (fromLeft ? 1 : -1) * (0.5 + Math.random() * 1);
        
        birds.push({
            x: x,
            y: y,
            speed: speed,
            size: 8 + Math.random() * 4, // Random size between 8-12px
            frame: 0, // Animation frame
            frameTimer: 0 // Timer for animation
        });
    }
}

// Update shooting stars in night mode
function updateShootingStars() {
    // Move existing shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        
        // Move star
        star.x += star.speedX;
        star.y += star.speedY;
        
        // Update trail
        star.trail.push({x: star.x, y: star.y});
        if (star.trail.length > star.trailLength) {
            star.trail.shift();
        }
        
        // Decrease life
        star.life -= 0.02;
        
        // Remove if off screen or dead
        if (star.x > canvas.width || star.x < 0 || star.y > canvas.height || star.y < 0 || star.life <= 0) {
            shootingStars.splice(i, 1);
        }
    }
    
    // Spawn new shooting stars randomly
    if (shootingStars.length < MAX_SHOOTING_STARS && Math.random() < SHOOTING_STAR_SPAWN_CHANCE) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height / 3); // Only in top third of screen
        const angle = Math.PI / 4 + Math.random() * (Math.PI / 4); // Angle between 45-90 degrees
        const speed = 2 + Math.random() * 3;
        
        shootingStars.push({
            x: x,
            y: y,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            size: 2 + Math.random() * 2,
            trail: [{x: x, y: y}],
            trailLength: 10 + Math.floor(Math.random() * 10),
            life: 1.0
        });
    }
}

// Update UFOs in night mode
function updateUFOs() {
    // Move existing UFOs
    for (let i = ufos.length - 1; i >= 0; i--) {
        const ufo = ufos[i];
        
        // Move UFO
        ufo.x += ufo.speed;
        
        // Slight vertical hover effect
        ufo.hoverOffset += ufo.hoverSpeed;
        if (ufo.hoverOffset > Math.PI * 2) {
            ufo.hoverOffset -= Math.PI * 2;
        }
        
        // Remove if off screen
        if (ufo.x > canvas.width + 30 || ufo.x < -30) {
            ufos.splice(i, 1);
        }
    }
    
    // Spawn new UFOs randomly
    if (ufos.length < MAX_UFOS && Math.random() < UFO_SPAWN_CHANCE) {
        // Always spawn from left or right edge
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -30 : canvas.width + 30;
        const y = 50 + Math.random() * 100; // Only in top portion of screen
        const speed = (fromLeft ? 1 : -1) * (0.3 + Math.random() * 0.5);
        
        ufos.push({
            x: x,
            y: y,
            speed: speed,
            width: 20,
            height: 10,
            hoverOffset: 0,
            hoverSpeed: 0.05,
            beamActive: false,
            beamTimer: 0,
            beamDuration: 0
        });
    }
}

// Draw all background effects
function drawBackgroundEffects() {
    // Draw day mode effects
    if (!isDarkMode) {
        drawBirds();
    } 
    // Draw night mode effects
    else {
        drawShootingStars();
        drawUFOs();
    }
}

// Helper function to draw the character
function drawCharacter() {
    if (!gameStarted) return;
    
    // Use the original character drawing code from game.js
    if (typeof window.drawMario === 'function') {
        window.drawMario();
    } else {
        // Fallback simple character drawing if the original function isn't available
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(mario.x, mario.y, mario.width, mario.height);
    }
}

// Helper function to draw the score
function drawScore() {
    if (!gameStarted) return;
    
    // Draw score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px PressStart2P';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), canvas.width / 2, 50);
}

// Draw birds for day mode
function drawBirds() {
    ctx.fillStyle = '#000000'; // Black silhouette
    
    for (const bird of birds) {
        // Save context for rotation
        ctx.save();
        ctx.translate(bird.x, bird.y);
        
        // Flip bird based on direction
        if (bird.speed < 0) {
            ctx.scale(-1, 1);
        }
        
        // Draw bird body (simple 8-bit style)
        ctx.fillRect(-bird.size/2, -bird.size/4, bird.size, bird.size/2);
        
        // Draw head
        ctx.fillRect(bird.size/2, -bird.size/2, bird.size/2, bird.size/2);
        
        // Draw wings (animated)
        if (bird.frame === 0) {
            // Wings up
            ctx.fillRect(-bird.size/4, -bird.size/2, bird.size/2, bird.size/4);
        } else {
            // Wings down
            ctx.fillRect(-bird.size/4, bird.size/4, bird.size/2, bird.size/4);
        }
        
        // Restore context
        ctx.restore();
    }
}

// Draw shooting stars for night mode
function drawShootingStars() {
    for (const star of shootingStars) {
        // Draw trail
        for (let i = 0; i < star.trail.length; i++) {
            const point = star.trail[i];
            const alpha = (i / star.trail.length) * star.life;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            
            // Size decreases along the trail
            const pointSize = star.size * (i / star.trail.length);
            ctx.fillRect(point.x - pointSize/2, point.y - pointSize/2, pointSize, pointSize);
        }
        
        // Draw star head
        ctx.fillStyle = `rgba(255, 255, 255, ${star.life})`;
        ctx.fillRect(star.x - star.size/2, star.y - star.size/2, star.size, star.size);
    }
}

// Draw UFOs for night mode
function drawUFOs() {
    for (const ufo of ufos) {
        // Calculate hover effect
        const hoverY = ufo.y + Math.sin(ufo.hoverOffset) * 3;
        
        // Draw UFO body (saucer shape)
        ctx.fillStyle = '#CCCCCC'; // Light gray
        
        // Draw top dome
        ctx.beginPath();
        ctx.ellipse(ufo.x, hoverY - 3, ufo.width/3, ufo.height/2, 0, Math.PI, 0);
        ctx.fill();
        
        // Draw bottom saucer
        ctx.fillStyle = '#888888'; // Darker gray
        ctx.beginPath();
        ctx.ellipse(ufo.x, hoverY, ufo.width/2, ufo.height/2, 0, 0, Math.PI);
        ctx.fill();
        
        // Draw lights (blinking)
        const lightColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
        const numLights = 4;
        const lightRadius = 2;
        
        for (let i = 0; i < numLights; i++) {
            // Blink randomly
            if (Math.random() > 0.2) {
                const angle = (i / numLights) * Math.PI;
                const lightX = ufo.x + Math.cos(angle) * (ufo.width/2 - lightRadius);
                const lightY = hoverY + Math.sin(angle) * (ufo.height/2 - lightRadius);
                
                ctx.fillStyle = lightColors[i % lightColors.length];
                ctx.fillRect(lightX - lightRadius/2, lightY - lightRadius/2, lightRadius, lightRadius);
            }
        }
    }
}

// Add background effects to the game loop
function addBackgroundEffectsToGameLoop() {
    // Store original render function
    const originalRender = window.render;
    
    // Store original drawBackground function if it exists
    const originalDrawBackground = window.drawBackground;
    
    // Create a modified drawBackground function that includes our effects
    window.drawBackground = function() {
        // Call the original drawBackground if it exists
        if (originalDrawBackground) {
            originalDrawBackground.apply(this, arguments);
        } else {
            // Fallback if the original doesn't exist
            ctx.fillStyle = isDarkMode ? '#0A2240' : '#4EC0CA';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw our background effects
        drawBackgroundEffects();
    };
    
    // Don't completely override the render function, just call the original
    // This preserves all the original game functionality
    window.render = function() {
        originalRender.apply(this, arguments);
    };
    
    // Store original update function
    const originalUpdate = window.update;
    
    // Override update function to include background effects
    window.update = function() {
        // Call original update first
        originalUpdate.apply(this, arguments);
        
        // Update background effects
        updateBackgroundEffects();
    };
    
    // Initialize background effects
    initBackgroundEffects();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to make sure game.js has initialized
    setTimeout(addBackgroundEffectsToGameLoop, 500);
});
