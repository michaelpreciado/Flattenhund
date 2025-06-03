// Audio system for Flattenhund game - Safari compatible
let audioCtx = null;
let audioInitialized = false;

// Safari-compatible audio context creation
function createAudioContext() {
    if (audioCtx) return audioCtx;
    
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Handle Safari's requirement for user interaction
        if (audioCtx.state === 'suspended') {
            console.log('🔊 Audio context suspended - will resume on first user interaction');
        }
        
        return audioCtx;
    } catch (error) {
        console.warn('Audio not supported:', error);
        return null;
    }
}

// Initialize audio context only after user interaction (Safari requirement)
function initializeAudio() {
    if (audioInitialized) return Promise.resolve();
    
    if (!audioCtx) {
        audioCtx = createAudioContext();
    }
    
    if (!audioCtx) {
        return Promise.resolve(); // Audio not supported
    }
    
    // Resume audio context if suspended (Safari requirement)
    if (audioCtx.state === 'suspended') {
        return audioCtx.resume().then(() => {
            audioInitialized = true;
            console.log('🔊 Audio context initialized successfully');
        }).catch(error => {
            console.warn('Failed to resume audio context:', error);
        });
    } else {
        audioInitialized = true;
        console.log('🔊 Audio context ready');
        return Promise.resolve();
    }
}

// Make audio initialization available globally
window.initializeAudio = initializeAudio;

// Flap sound - 8-bit style
function playFlapSound() {
    if (!audioInitialized || !audioCtx) return;
    
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (error) {
        console.warn('Flap sound failed:', error);
    }
}

// Hit sound - 8-bit style
function playHitSound() {
    if (!audioInitialized || !audioCtx) return;
    
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (error) {
        console.warn('Hit sound failed:', error);
    }
}

// Score sound - 8-bit style
function playScoreSound() {
    if (!audioInitialized || !audioCtx) return;
    
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (error) {
        console.warn('Score sound failed:', error);
    }
}

// Initialize audio on first user interaction
document.addEventListener('touchstart', function initAudioOnTouch() {
    initializeAudio();
    document.removeEventListener('touchstart', initAudioOnTouch);
}, { once: true });

document.addEventListener('click', function initAudioOnClick() {
    initializeAudio();
    document.removeEventListener('click', initAudioOnClick);
}, { once: true });

// Expose sound functions globally
window.playFlapSound = playFlapSound;
window.playHitSound = playHitSound;
window.playScoreSound = playScoreSound;
