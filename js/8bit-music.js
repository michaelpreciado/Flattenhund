// 8-bit Music and Sound Effects Engine
// This provides more authentic 8-bit audio for the game

// Audio context
let audioCtx;

// Music control flags
let musicEnabled = false; // Set to false to disable background music

// Initialize audio
function initAudio() {
    // Create audio context
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

// Function to create 8-bit tones
function playNote(frequency, duration, type = 'square', volume = 0.15) {
    if (!audioCtx) initAudio();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.value = volume;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
    
    return { oscillator, gainNode, stop: () => oscillator.stop() };
}

// 8-bit music theme (simplified version)
function playTheme() {
    // Skip if music is disabled
    if (!musicEnabled || !audioCtx) return;
    
    initAudio();
    
    const tempo = 0.3; // Slower tempo
    let time = audioCtx.currentTime;
    
    // Very minimal theme melody - just a few notes
    const melody = [
        { note: 'E5', duration: tempo },
        { note: 'Rest', duration: tempo * 2 },
        { note: 'G5', duration: tempo },
        { note: 'Rest', duration: tempo * 3 },
    ];
    
    // Note frequency map
    const notes = {
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 
        'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 
        'G5': 783.99, 'A5': 880.00, 'B5': 987.77
    };
    
    // Play each note in sequence
    melody.forEach(item => {
        if (item.note !== 'Rest') {
            setTimeout(() => {
                playNote(notes[item.note], item.duration, 'square', 0.08);
            }, (time - audioCtx.currentTime) * 1000);
        }
        time += item.duration;
    });
}

// Sound effects
function playJumpSound() {
    return playNote(523.25, 0.1, 'square', 0.1); // C5
}

function playScoreSound() {
    const sounds = [];
    sounds.push(playNote(783.99, 0.1, 'square', 0.12)); // G5
    setTimeout(() => {
        sounds.push(playNote(1046.50, 0.1, 'square', 0.12)); // C6
    }, 100);
    return sounds;
}

function playHitSound() {
    return playNote(195.99, 0.3, 'sawtooth', 0.15); // G3 harsh sound
}

function playGameOverSound() {
    const sounds = [];
    let delay = 0;
    
    // Descending notes
    [659.25, 587.33, 523.25, 493.88, 440, 392].forEach(freq => {
        setTimeout(() => {
            sounds.push(playNote(freq, 0.2, 'square', 0.1));
        }, delay);
        delay += 160;
    });
    
    return sounds;
}

function playBoostSound() {
    const sounds = [];
    
    // Ascending notes for boost effect
    sounds.push(playNote(440, 0.1, 'square', 0.12)); // A4
    setTimeout(() => {
        sounds.push(playNote(554.37, 0.1, 'square', 0.12)); // C#5
    }, 50);
    setTimeout(() => {
        sounds.push(playNote(659.25, 0.15, 'square', 0.15)); // E5
    }, 100);
    
    return sounds;
}

function playHighScoreSound() {
    const sounds = [];
    let delay = 0;
    
    // Triumphant ascending fanfare
    const fanfareNotes = [
        { freq: 523.25, duration: 0.15, volume: 0.15 }, // C5
        { freq: 659.25, duration: 0.15, volume: 0.16 }, // E5
        { freq: 783.99, duration: 0.15, volume: 0.17 }, // G5
        { freq: 1046.50, duration: 0.3, volume: 0.18 }, // C6 - hold longer
        // Quick celebration trill
        { freq: 880.00, duration: 0.08, volume: 0.12 }, // A5
        { freq: 987.77, duration: 0.08, volume: 0.12 }, // B5
        { freq: 1046.50, duration: 0.08, volume: 0.12 }, // C6
        { freq: 1174.66, duration: 0.08, volume: 0.12 }, // D6
        { freq: 1318.51, duration: 0.2, volume: 0.15 }, // E6 - finale
    ];
    
    fanfareNotes.forEach(note => {
        setTimeout(() => {
            sounds.push(playNote(note.freq, note.duration, 'square', note.volume));
        }, delay);
        delay += note.duration * 800; // Slightly overlapping for fullness
    });
    
    // Add some harmonic background for richness
    setTimeout(() => {
        sounds.push(playNote(523.25, 1.0, 'triangle', 0.06)); // Background C5
    }, 200);
    
    setTimeout(() => {
        sounds.push(playNote(783.99, 0.8, 'triangle', 0.05)); // Background G5
    }, 400);
    
    return sounds;
}

// Export sound functions
window.eightBitAudio = {
    init: initAudio,
    playTheme: playTheme,
    playJumpSound: playJumpSound,
    playScoreSound: playScoreSound,
    playHitSound: playHitSound,
    playGameOverSound: playGameOverSound,
    playBoostSound: playBoostSound,
    playHighScoreSound: playHighScoreSound, // Add the new high score sound
    // Add aliases that the game code expects
    playFlap: playJumpSound,  // Alias for flap sound
    playHit: playHitSound,    // Alias for hit sound  
    playGameOver: playGameOverSound, // Alias for game over sound
    enableMusic: function(enable) {
        musicEnabled = enable;
    }
};
