// Dark mode functionality for Flappy 8-Bit
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const gameContainer = document.querySelector('.game-container');
    
    // Check for saved preference
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    
    // Apply saved preference if it exists
    if (darkModeEnabled) {
        enableDarkMode();
    }
    
    // Create stars for night sky
    createStars();
    
    // Toggle dark mode when button is clicked
    darkModeToggle.addEventListener('click', function() {
        if (body.classList.contains('dark-mode')) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });
    
    // Function to enable dark mode
    function enableDarkMode() {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
        updateGameColors(true);
    }
    
    // Function to disable dark mode
    function disableDarkMode() {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
        updateGameColors(false);
    }
    
    // Create stars for the night sky
    function createStars() {
        const starsContainer = document.createElement('div');
        starsContainer.className = 'stars';
        
        // Create 50 stars with random positions
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.position = 'absolute';
            star.style.width = (Math.random() * 2 + 1) + 'px';
            star.style.height = star.style.width;
            star.style.backgroundColor = '#FFFFFF';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.opacity = Math.random() * 0.8 + 0.2;
            
            // Add pixel-perfect style
            star.style.boxShadow = 'none';
            star.style.borderRadius = '0';
            
            // Add subtle twinkling animation
            if (i % 3 === 0) {
                star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite alternate`;
            }
            
            starsContainer.appendChild(star);
        }
        
        // Add stars to game container
        gameContainer.appendChild(starsContainer);
        
        // Add CSS for twinkling animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes twinkle {
                0% { opacity: 0.2; }
                100% { opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update game colors based on mode
    function updateGameColors(isDark) {
        // This function will be called from game.js to update canvas colors
        if (window.updateGameTheme) {
            window.updateGameTheme(isDark);
        }
    }
});
