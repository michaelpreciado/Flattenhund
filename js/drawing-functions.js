// Drawing functions for Flappy 8-Bit game
// These functions handle rendering the game elements with dark mode support

// Draw the background
function drawBackground() {
    // Draw sky with appropriate color based on mode
    ctx.fillStyle = isDarkMode ? '#0A2240' : '#4EC0CA'; // Night sky or day sky
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars in night mode
    if (isDarkMode) {
        drawStars();
    }
    
    // Draw city silhouette (pixelated buildings)
    drawCitySilhouette();
    
    // Draw clouds
    drawClouds();
}

// Draw the ground
function drawGround() {
    // Draw the dirt part of the ground
    ctx.fillStyle = isDarkMode ? '#5E4B2B' : '#DED895'; // Dark or light dirt color
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
    
    // Draw the grass top of the ground (pixelated)
    ctx.fillStyle = isDarkMode ? '#2A623D' : '#8CC453'; // Dark or light grass color
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 20);
    
    // Add pixelated grass details for 8-bit effect
    ctx.fillStyle = isDarkMode ? '#3A724D' : '#A2D65B'; // Lighter green for grass highlights
    for (let x = 0; x < canvas.width; x += 12) {
        const grassHeight = Math.floor(Math.random() * 4) + 2;
        ctx.fillRect(x, canvas.height - GROUND_HEIGHT - grassHeight, 4, grassHeight);
    }
    
    // Add pixelated dirt details
    ctx.fillStyle = isDarkMode ? '#4E3B1B' : '#D5C878'; // Slightly darker dirt for texture
    for (let x = 0; x < canvas.width; x += 16) {
        for (let y = canvas.height - GROUND_HEIGHT + 30; y < canvas.height; y += 16) {
            if (Math.random() > 0.7) {
                ctx.fillRect(x, y, 8, 8);
            }
        }
    }
}

// Draw all pipes
function drawPipes() {
    for (const pipe of pipes) {
        drawPipe(pipe);
    }
}

// Draw a pipe
function drawPipe(pipe) {
    const pipeWidth = pipe.width;
    const capHeight = 30; // Height of the pipe cap
    
    // Draw the pipe body with appropriate colors based on mode
    ctx.fillStyle = isDarkMode ? '#2A623D' : '#74BF2E'; // Dark or light pipe green
    
    // Top pipe
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top.height - capHeight);
    
    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.bottom.y + capHeight, pipeWidth, pipe.bottom.height - capHeight);
    
    // Draw the pipe caps (darker green)
    ctx.fillStyle = isDarkMode ? '#1A4020' : '#558022'; // Darker green for pipe borders
    
    // Top pipe cap
    ctx.fillRect(pipe.x - 10, pipe.top.height - capHeight, pipeWidth + 20, capHeight);
    
    // Bottom pipe cap
    ctx.fillRect(pipe.x - 10, pipe.bottom.y, pipeWidth + 20, capHeight);
    
    // Draw pipe borders for more 8-bit definition
    ctx.fillStyle = isDarkMode ? '#0A3010' : '#3A6010'; // Even darker green for borders
    
    // Top pipe borders
    ctx.fillRect(pipe.x, 0, 3, pipe.top.height - capHeight); // Left
    ctx.fillRect(pipe.x + pipeWidth - 3, 0, 3, pipe.top.height - capHeight); // Right
    
    // Bottom pipe borders
    ctx.fillRect(pipe.x, pipe.bottom.y + capHeight, 3, pipe.bottom.height - capHeight); // Left
    ctx.fillRect(pipe.x + pipeWidth - 3, pipe.bottom.y + capHeight, 3, pipe.bottom.height - capHeight); // Right
    
    // Cap borders
    ctx.fillRect(pipe.x - 10, pipe.top.height - capHeight, 3, capHeight); // Top left
    ctx.fillRect(pipe.x + pipeWidth + 7, pipe.top.height - capHeight, 3, capHeight); // Top right
    ctx.fillRect(pipe.x - 10, pipe.bottom.y, 3, capHeight); // Bottom left
    ctx.fillRect(pipe.x + pipeWidth + 7, pipe.bottom.y, 3, capHeight); // Bottom right
    
    // Horizontal borders for caps
    ctx.fillRect(pipe.x - 10, pipe.top.height - capHeight, pipeWidth + 20, 3); // Top cap top
    ctx.fillRect(pipe.x - 10, pipe.top.height - 3, pipeWidth + 20, 3); // Top cap bottom
    ctx.fillRect(pipe.x - 10, pipe.bottom.y, pipeWidth + 20, 3); // Bottom cap top
    ctx.fillRect(pipe.x - 10, pipe.bottom.y + capHeight - 3, pipeWidth + 20, 3); // Bottom cap bottom
}

// Draw city silhouette (pixelated buildings)
function drawCitySilhouette() {
    ctx.fillStyle = isDarkMode ? '#1A3A5A' : '#3A8BBB'; // Darker blue for night mode
    
    // Create a series of buildings with different heights
    const buildingWidths = [40, 30, 50, 35, 45, 60, 55, 40, 30, 50];
    const maxHeight = 120;
    
    let xPos = 0;
    for (let i = 0; i < buildingWidths.length; i++) {
        const width = buildingWidths[i];
        const height = 40 + Math.random() * maxHeight;
        
        // Draw a pixelated building
        ctx.fillRect(xPos, canvas.height - GROUND_HEIGHT - height, width, height);
        
        // Add some windows (small squares)
        // More windows lit up at night than during day
        ctx.fillStyle = '#FFFF99'; // Yellow windows
        
        // Add random windows
        const windowSize = 4;
        const windowSpacing = 10;
        
        for (let wx = xPos + windowSpacing; wx < xPos + width - windowSize; wx += windowSpacing) {
            for (let wy = canvas.height - GROUND_HEIGHT - height + windowSpacing; 
                 wy < canvas.height - GROUND_HEIGHT - windowSize; 
                 wy += windowSpacing) {
                // More windows lit at night (50%) than during day (30%)
                if (Math.random() < (isDarkMode ? 0.5 : 0.3)) {
                    ctx.fillRect(wx, wy, windowSize, windowSize);
                }
            }
        }
        
        ctx.fillStyle = isDarkMode ? '#1A3A5A' : '#3A8BBB'; // Back to building color
        xPos += width;
    }
}

// Draw stars in night sky (only in dark mode)
function drawStars() {
    // We'll draw 30 stars directly on the canvas
    ctx.fillStyle = '#FFFFFF';
    
    // Use a consistent seed for the random number generator
    // so stars don't change position on each frame
    const seed = Math.floor(Date.now() / 1000) % 1000;
    
    for (let i = 0; i < 30; i++) {
        // Use a deterministic approach for star positions
        const x = ((seed * (i + 1) * 13) % canvas.width);
        const y = ((seed * (i + 1) * 17) % (canvas.height - GROUND_HEIGHT - 50));
        
        // Vary star size between 1-2 pixels (8-bit style)
        const size = Math.floor((seed * i) % 2) + 1;
        
        // Draw the star as a small square (pixelated)
        ctx.fillRect(x, y, size, size);
    }
}

// Draw clouds
function drawClouds() {
    // In dark mode, clouds are darker and more transparent
    if (isDarkMode) {
        ctx.fillStyle = 'rgba(200, 200, 220, 0.5)'; // Bluish-gray transparent clouds for night
    } else {
        ctx.fillStyle = '#FFFFFF'; // White clouds for day
    }
    
    // Draw a few pixelated clouds
    const cloudPositions = [
        { x: 50, y: 80 },
        { x: 200, y: 120 },
        { x: 300, y: 50 }
    ];
    
    cloudPositions.forEach(pos => {
        // Draw cloud in 8-bit style (using rectangles)
        ctx.fillRect(pos.x, pos.y, 40, 20);
        ctx.fillRect(pos.x - 10, pos.y + 10, 60, 10);
    });
}
