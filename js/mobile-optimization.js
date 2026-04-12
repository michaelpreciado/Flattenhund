// Mobile Optimization System for Flattenhund
// Handles touch controls, performance, orientation, and mobile-specific features

class MobileOptimizer {
    constructor() {
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.orientationTimeout = null;
        this.performanceData = {
            fps: 60,
            frameTime: 16.67,
            lastTime: performance.now(),
            frameCount: 0
        };
        this.touchOverlay = null;
        this.vibrationSupported = 'vibrate' in navigator;
        this.isInStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
        
        this.init();
    }

    init() {
        console.log('🔧 Initializing Mobile Optimizer...');
        
        // Initialize all mobile features
        this.setupTouchControls();
        this.optimizeCanvas();
        this.handleOrientation();
        // Performance monitoring disabled for production - uncomment next line for debugging
        // this.setupPerformanceMonitoring();
        this.preventScrolling();
        this.optimizeFonts();
        this.setupMobileHints();
        this.handleViewportHeight();
        this.setupWakeLock();
        
        // Add device-specific optimizations
        this.detectDevice();
        this.optimizeForDevice();
        
        console.log('✅ Mobile Optimizer initialized successfully');
        console.log(`📱 Device: ${this.isTouch ? 'Touch' : 'Desktop'}, DPR: ${this.devicePixelRatio}`);
    }

    setupTouchControls() {
        // Create touch overlay for better touch handling
        this.touchOverlay = document.getElementById('mobile-touch-overlay');
        
        if (!this.touchOverlay) {
            this.touchOverlay = document.createElement('div');
            this.touchOverlay.className = 'mobile-touch-overlay';
            this.touchOverlay.id = 'mobile-touch-overlay';
            document.body.appendChild(this.touchOverlay);
        }

        // Enhanced touch event handling
        this.setupTouchEvents();
        
        // Prevent default touch behaviors
        this.preventTouchDefaults();
        
        // Add haptic feedback for supported devices
        this.setupHapticFeedback();
    }

    setupTouchEvents() {
        const gameCanvas = document.getElementById('game-canvas');
        const touchOverlay = this.touchOverlay;
        
        let touchStartTime = 0;
        let touchStartPos = { x: 0, y: 0 };
        
        // Primary touch controls
        const handleTouchStart = (e) => {
            e.preventDefault();
            touchStartTime = Date.now();
            
            if (e.touches && e.touches[0]) {
                touchStartPos.x = e.touches[0].clientX;
                touchStartPos.y = e.touches[0].clientY;
            }
            
            // Trigger game action
            if (window.gameStarted && !window.gameOver) {
                window.flap && window.flap();
                this.triggerHapticFeedback('light');
            } else if (!window.gameStarted && window.selectedCharacter) {
                window.startGame && window.startGame();
                this.triggerHapticFeedback('medium');
            }
        };

        const handleTouchEnd = (e) => {
            e.preventDefault();
            const touchDuration = Date.now() - touchStartTime;
            
            // Handle long press (for potential future features)
            if (touchDuration > 500) {
                console.log('Long press detected');
            }
        };

        // Add touch listeners to both canvas and overlay
        [gameCanvas, touchOverlay].forEach(element => {
            if (element) {
                element.addEventListener('touchstart', handleTouchStart, { passive: false });
                element.addEventListener('touchend', handleTouchEnd, { passive: false });
                element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            }
        });

        // Keyboard support for development/desktop
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM') {
                this.togglePerformanceMonitor();
            }
        });
    }

    preventTouchDefaults() {
        // Prevent zoom, scroll, and other default behaviors
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault(); // Prevent pinch zoom
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
        }, { passive: false });

        document.addEventListener('gesturestart', (e) => {
            e.preventDefault(); // Prevent gesture zoom
        }, { passive: false });

        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    optimizeCanvas() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        // Let game.js own backing-store sizing to avoid double scaling.
        const ctx = canvas.getContext('2d', { alpha: false });
        canvas.style.willChange = 'transform';
        ctx.imageSmoothingEnabled = false;
    }

    handleOrientation() {
        const updateOrientation = () => {
            if (this.orientationTimeout) {
                clearTimeout(this.orientationTimeout);
            }
            
            this.orientationTimeout = setTimeout(() => {
                this.handleViewportHeight();
                this.optimizeCanvas();
                this.showOrientationHint();
            }, 100);
        };

        // Handle orientation changes
        window.addEventListener('orientationchange', updateOrientation);
        window.addEventListener('resize', updateOrientation);
        
        // Add visual orientation hints
        this.setupOrientationHints();
    }

    showOrientationHint() {
        const hints = document.getElementById('mobile-hints');
        if (!hints) return;

        const isLandscape = window.innerWidth > window.innerHeight;
        const isSmallScreen = window.innerHeight < 500;
        
        if (isLandscape && isSmallScreen) {
            this.showHint('Better experience in portrait mode!', 3000);
        }
    }

    setupOrientationHints() {
        // Add CSS for orientation-specific styling
        const style = document.createElement('style');
        style.textContent = `
            @media screen and (orientation: landscape) and (max-height: 500px) {
                .orientation-hint {
                    display: block !important;
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 165, 0, 0.9);
                    color: #000;
                    padding: 5px 10px;
                    border-radius: 0;
                    font-size: 0.7rem;
                    z-index: 1000;
                    animation: fadeInOut 4s ease-in-out;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupPerformanceMonitoring() {
        this.performanceIndicator = document.getElementById('performance-indicator');
        
        if (!this.performanceIndicator) {
            this.performanceIndicator = document.createElement('div');
            this.performanceIndicator.className = 'performance-indicator';
            this.performanceIndicator.id = 'performance-indicator';
            document.body.appendChild(this.performanceIndicator);
        }

        // Monitor performance every frame
        this.startPerformanceMonitoring();
    }

    startPerformanceMonitoring() {
        const monitor = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - this.performanceData.lastTime;
            
            this.performanceData.frameTime = deltaTime;
            this.performanceData.fps = Math.round(1000 / deltaTime);
            this.performanceData.frameCount++;
            this.performanceData.lastTime = currentTime;
            
            // Update display every 30 frames
            if (this.performanceData.frameCount % 30 === 0) {
                this.updatePerformanceDisplay();
            }
            
            // Detect performance issues
            if (this.performanceData.fps < 30) {
                this.handleLowPerformance();
            }
            
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }

    updatePerformanceDisplay() {
        if (!this.performanceIndicator) return;
        
        const isVisible = this.performanceIndicator.style.display !== 'none';
        if (!isVisible) return;
        
        const memoryInfo = performance.memory ? 
            `${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB` : 'N/A';
        
        this.performanceIndicator.innerHTML = `
            FPS: ${this.performanceData.fps}<br>
            Frame: ${this.performanceData.frameTime.toFixed(1)}ms<br>
            Memory: ${memoryInfo}<br>
            DPR: ${this.devicePixelRatio}
        `;
        
        // Color-code performance
        if (this.performanceData.fps >= 50) {
            this.performanceIndicator.style.color = '#00FF00';
        } else if (this.performanceData.fps >= 30) {
            this.performanceIndicator.style.color = '#FFFF00';
        } else {
            this.performanceIndicator.style.color = '#FF0000';
        }
    }

    togglePerformanceMonitor() {
        if (!this.performanceIndicator) return;
        
        const isVisible = this.performanceIndicator.style.display !== 'none';
        this.performanceIndicator.style.display = isVisible ? 'none' : 'block';
        
        console.log(`📊 Performance monitor ${isVisible ? 'hidden' : 'shown'}`);
    }

    handleLowPerformance() {
        // Reduce visual effects for better performance
        const crtOverlay = document.querySelector('.crt-overlay');
        if (crtOverlay && this.performanceData.fps < 25) {
            crtOverlay.style.display = 'none';
            console.log('⚡ CRT overlay disabled for performance');
        }
    }

    preventScrolling() {
        // Prevent iOS Safari scroll bounce
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
        
        // Prevent pull-to-refresh
        document.body.style.overscrollBehavior = 'none';
        
        // Prevent iOS text selection
        document.body.style.webkitUserSelect = 'none';
        document.body.style.webkitTouchCallout = 'none';
    }

    optimizeFonts() {
        // Preload fonts for better performance
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'assets/fonts/PressStart2P-Regular.ttf';
        fontLink.as = 'font';
        fontLink.type = 'font/ttf';
        fontLink.crossOrigin = 'anonymous';
        document.head.appendChild(fontLink);
        
        // Add font loading detection
        if (document.fonts) {
            document.fonts.ready.then(() => {
                console.log('🔤 Fonts loaded successfully');
            });
        }
    }

    setupMobileHints() {
        this.hintsElement = document.getElementById('mobile-hints');
        
        if (!this.hintsElement) {
            this.hintsElement = document.createElement('div');
            this.hintsElement.className = 'mobile-hints';
            this.hintsElement.id = 'mobile-hints';
            this.hintsElement.innerHTML = '<div class="hint-text">Tap anywhere to flap!</div>';
            document.querySelector('.game-container').appendChild(this.hintsElement);
        }
        
        // Show hints on game start
        if (this.isTouch) {
            this.showHint('Tap anywhere to flap!', 4000);
        }
    }

    showHint(message, duration = 3000) {
        if (!this.hintsElement) return;
        
        const hintText = this.hintsElement.querySelector('.hint-text');
        if (hintText) {
            hintText.textContent = message;
        }
        
        this.hintsElement.classList.add('show');
        
        setTimeout(() => {
            this.hintsElement.classList.remove('show');
        }, duration);
    }

    handleViewportHeight() {
        // Handle iOS Safari viewport height issues
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    setupWakeLock() {
        // Prevent screen from going to sleep during gameplay
        if ('wakeLock' in navigator) {
            this.wakeLock = null;
            
            this.requestWakeLock = async () => {
                try {
                    this.wakeLock = await navigator.wakeLock.request('screen');
                    console.log('🔆 Screen wake lock activated');
                } catch (err) {
                    console.log('Wake lock failed:', err);
                }
            };
            
            this.releaseWakeLock = async () => {
                if (this.wakeLock) {
                    await this.wakeLock.release();
                    this.wakeLock = null;
                    console.log('🔅 Screen wake lock released');
                }
            };
            
            // Auto-manage wake lock based on game state
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && window.gameStarted && !window.gameOver) {
                    this.requestWakeLock();
                } else {
                    this.releaseWakeLock();
                }
            });
        }
    }

    setupHapticFeedback() {
        this.hapticPatterns = {
            light: [10],
            medium: [20],
            strong: [50],
            success: [10, 100, 10],
            error: [100, 50, 100]
        };
    }

    triggerHapticFeedback(type = 'light') {
        if (!this.vibrationSupported) return;
        
        const pattern = this.hapticPatterns[type] || this.hapticPatterns.light;
        
        try {
            navigator.vibrate(pattern);
        } catch (err) {
            console.log('Vibration failed:', err);
        }
    }

    detectDevice() {
        const userAgent = navigator.userAgent;
        
        this.device = {
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isAndroid: /Android/.test(userAgent),
            isChrome: /Chrome/.test(userAgent),
            isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
            isFirefox: /Firefox/.test(userAgent),
            isMobile: /Mobi|Android/i.test(userAgent),
            isTablet: /Tablet|iPad/.test(userAgent)
        };
        
        console.log('📱 Device detected:', this.device);
    }

    optimizeForDevice() {
        // iOS-specific optimizations
        if (this.device.isIOS) {
            this.optimizeForIOS();
        }
        
        // Android-specific optimizations
        if (this.device.isAndroid) {
            this.optimizeForAndroid();
        }
        
        // Browser-specific optimizations
        if (this.device.isSafari) {
            this.optimizeForSafari();
        }
    }

    optimizeForIOS() {
        // Prevent iOS bounce scrolling
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Handle iOS safe areas
        this.handleSafeAreas();
        
        // Optimize for iOS performance
        document.body.style.webkitBackfaceVisibility = 'hidden';
        document.body.style.webkitPerspective = '1000';
        document.body.style.webkitTransform = 'translate3d(0,0,0)';
    }

    optimizeForAndroid() {
        // Android-specific performance optimizations
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.willChange = 'transform';
        }
    }

    optimizeForSafari() {
        // Safari-specific optimizations
        document.body.style.webkitTransform = 'translateZ(0)';
        
        // Fix Safari viewport issues
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no';
        }
    }

    handleSafeAreas() {
        // Handle iPhone notch and safe areas
        const style = document.createElement('style');
        style.textContent = `
            .game-container {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
            }
        `;
        document.head.appendChild(style);
    }

    // Public API methods
    showGameHint(message, duration) {
        this.showHint(message, duration);
    }

    triggerGameFeedback(type) {
        this.triggerHapticFeedback(type);
    }

    getPerformanceData() {
        return this.performanceData;
    }

    enableDebugMode() {
        this.togglePerformanceMonitor();
        console.log('🐛 Debug mode enabled');
    }
}

// Initialize mobile optimizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileOptimizer = new MobileOptimizer();
    
    // Expose useful functions globally
    window.showMobileHint = (message, duration) => {
        window.mobileOptimizer.showGameHint(message, duration);
    };
    
    window.triggerHaptic = (type) => {
        window.mobileOptimizer.triggerGameFeedback(type);
    };
    
    window.enableMobileDebug = () => {
        window.mobileOptimizer.enableDebugMode();
    };
});

// Handle game events for mobile optimization
document.addEventListener('game:start', () => {
    if (window.mobileOptimizer) {
        window.mobileOptimizer.requestWakeLock && window.mobileOptimizer.requestWakeLock();
        window.mobileOptimizer.showHint('Great! Keep tapping to flap!', 2000);
    }
});

document.addEventListener('game:over', () => {
    if (window.mobileOptimizer) {
        window.mobileOptimizer.releaseWakeLock && window.mobileOptimizer.releaseWakeLock();
        window.mobileOptimizer.triggerHapticFeedback('error');
    }
});

document.addEventListener('game:score', () => {
    if (window.mobileOptimizer) {
        window.mobileOptimizer.triggerHapticFeedback('success');
    }
});

console.log('📱 Mobile optimization script loaded'); 
