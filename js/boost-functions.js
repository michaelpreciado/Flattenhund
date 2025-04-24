// Boost mechanic functions for Flappy 8-Bit
// Adds a boost ability that gives temporary super powers

// Create the boost meter UI element
function createBoostMeter() {
    // Check if boost meter already exists
    if (document.getElementById('boost-meter-container')) {
        return;
    }
    
    // Create container
    const boostContainer = document.createElement('div');
    boostContainer.id = 'boost-meter-container';
    boostContainer.className = 'boost-meter-container';
    
    // Create meter label
    const boostLabel = document.createElement('div');
    boostLabel.className = 'boost-label';
    boostLabel.textContent = 'BOOST';
    
    // Create meter
    const meter = document.createElement('div');
    meter.id = 'boost-meter';
    meter.className = 'boost-meter';
    
    // Create meter fill
    const meterFill = document.createElement('div');
    meterFill.id = 'boost-meter-fill';
    meterFill.className = 'boost-meter-fill';
    
    // Create key hint
    const keyHint = document.createElement('div');
    keyHint.className = 'boost-key-hint';
    keyHint.textContent = '[HOLD]';
    
    // Assemble the elements
    meter.appendChild(meterFill);
    boostContainer.appendChild(boostLabel);
    boostContainer.appendChild(meter);
    boostContainer.appendChild(keyHint);
    
    // Add to game container
    const gameContainer = document.querySelector('.game-container');
    gameContainer.appendChild(boostContainer);
    
    // Store reference
    boostMeter = meterFill;
    
    // Add CSS styles
    addBoostStyles();
}

// Add CSS styles for boost meter
function addBoostStyles() {
    // Check if styles already exist
    if (document.getElementById('boost-styles')) {
        return;
    }
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'boost-styles';
    styleSheet.textContent = `
        .boost-meter-container {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            z-index: 10;
            font-family: 'PressStart2P', 'Arial', sans-serif;
        }
        
        .boost-label {
            color: #FFFFFF;
            font-size: 0.6rem;
            text-shadow: 1px 1px 0 #000;
            margin-bottom: 2px;
        }
        
        .boost-meter {
            width: 50px;
            height: 8px;
            background-color: rgba(0, 0, 0, 0.5);
            border: 2px solid #FFFFFF;
            border-radius: 0;
            overflow: hidden;
        }
        
        .boost-meter-fill {
            width: 100%;
            height: 100%;
            background-color: #FF5500;
            transform-origin: left;
            transition: transform 0.1s linear;
        }
        
        .boost-key-hint {
            color: #FFFFFF;
            font-size: 0.5rem;
            margin-top: 2px;
            opacity: 0.7;
        }
        
        .boost-active {
            animation: pulse 0.5s infinite alternate;
        }
        
        @keyframes pulse {
            0% { opacity: 0.7; }
            100% { opacity: 1; }
        }
    `;
    
    document.head.appendChild(styleSheet);
}

// Activate boost if available
function activateBoost() {
    // Check if boost is available
    if (gameStarted && !gameOver && !mario.boosting && mario.boostCooldown <= 0) {
        // Activate boost
        mario.boosting = true;
        mario.boostTimer = BOOST_DURATION;
        
        // Start cooldown
        mario.boostCooldown = BOOST_COOLDOWN;
        
        // Update visual indicator
        updateBoostMeter();
        
        // Add visual effect
        addBoostEffect();
        
        // Play boost sound
        playBoostSound();
    }
}

// Update the boost meter UI
function updateBoostMeter() {
    if (!boostMeter) return;
    
    // Calculate fill percentage
    const fillPercentage = mario.boostCooldown > 0 ? 
        (1 - mario.boostCooldown / BOOST_COOLDOWN) * 100 : 100;
    
    // Update meter fill
    boostMeter.style.transform = `scaleX(${fillPercentage / 100})`;
    
    // Add/remove active class
    if (mario.boosting) {
        boostMeter.classList.add('boost-active');
    } else {
        boostMeter.classList.remove('boost-active');
    }
}

// Add visual effect when boost is activated
function addBoostEffect() {
    // Flash effect
    canvas.style.filter = 'brightness(150%)';
    setTimeout(() => {
        canvas.style.filter = 'none';
    }, 100);
    
    // Create a burst of particles
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        particles.push({
            x: mario.x + mario.width / 2,
            y: mario.y + mario.height / 2,
            size: 6 + Math.random() * 4,
            speedX: Math.cos(angle) * (2 + Math.random() * 2),
            speedY: Math.sin(angle) * (2 + Math.random() * 2),
            life: 1.0,
            color: ['#FF0000', '#FF7700', '#FFFF00'][Math.floor(Math.random() * 3)]
        });
    }
}

// Play boost sound effect
function playBoostSound() {
    // Use 8-bit audio if available
    if (window.eightBitAudio && typeof window.eightBitAudio.playBoostSound === 'function') {
        window.eightBitAudio.playBoostSound();
    } else {
        // Fallback sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}
