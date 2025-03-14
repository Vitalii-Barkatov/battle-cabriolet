/**
 * TouchControls class
 * Responsible for handling touch gestures and providing additional controls for mobile devices
 */
class TouchControls {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeThreshold = 50; // Minimum distance for swipe detection
        this.swipeTimeout = null;
        this.isSwipe = false;
        this.activePointers = new Map(); // Track multiple touch points for multitouch
        
        // Initialize touch events
        this._initTouchEvents();
        
        // Handle iOS-specific touch behavior
        this._handleIOSSpecifics();
    }
    
    /**
     * Initialize touch events for the game canvas
     * @private
     */
    _initTouchEvents() {
        // Use passive: false for better performance on modern browsers
        const options = { passive: false };
        
        // Add touch event listeners with options
        this.canvas.addEventListener('touchstart', this._handleTouchStart.bind(this), options);
        this.canvas.addEventListener('touchmove', this._handleTouchMove.bind(this), options);
        this.canvas.addEventListener('touchend', this._handleTouchEnd.bind(this), options);
        this.canvas.addEventListener('touchcancel', this._handleTouchEnd.bind(this), options);
        
        // Prevent default browser behaviors that might interfere with the game
        document.addEventListener('gesturestart', this._preventDefault, options);
        document.addEventListener('gesturechange', this._preventDefault, options);
        document.addEventListener('gestureend', this._preventDefault, options);
    }
    
    /**
     * Handle iOS-specific touch behavior
     * @private
     */
    _handleIOSSpecifics() {
        // Check if this is an iOS device
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            // Prevent elastic scrolling/bouncing on iOS
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.overflow = 'hidden';
            
            // Add CSS variables for safe areas if not already present
            if (!document.documentElement.style.getPropertyValue('--safe-area-inset-top')) {
                const style = document.createElement('style');
                style.innerHTML = `
                    :root {
                        --safe-area-inset-top: env(safe-area-inset-top, 0px);
                        --safe-area-inset-right: env(safe-area-inset-right, 0px);
                        --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
                        --safe-area-inset-left: env(safe-area-inset-left, 0px);
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
    
    /**
     * Prevent default browser behavior
     * @param {Event} e - The event object
     * @private
     */
    _preventDefault(e) {
        e.preventDefault();
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     * @private
     */
    _handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isSwipe = false;
        
        // Clear any existing swipe timeout
        if (this.swipeTimeout) {
            clearTimeout(this.swipeTimeout);
        }
        
        // Set a timeout to prevent swipe if user holds too long
        this.swipeTimeout = setTimeout(() => {
            this.isSwipe = false;
        }, 300);
    }
    
    /**
     * Handle touch move event
     * @param {TouchEvent} e - Touch event
     * @private
     */
    _handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) {
            return;
        }
        
        const touch = e.touches[0];
        const diffX = touch.clientX - this.touchStartX;
        const diffY = touch.clientY - this.touchStartY;
        
        // If movement is beyond threshold, consider it a swipe
        if (Math.abs(diffX) > this.swipeThreshold || Math.abs(diffY) > this.swipeThreshold) {
            this.isSwipe = true;
        }
    }
    
    /**
     * Handle touch end event
     * @param {TouchEvent} e - Touch event
     * @private
     */
    _handleTouchEnd(e) {
        if (!this.isSwipe || !this.touchStartX || !this.touchStartY) {
            return;
        }
        
        const touch = e.changedTouches[0];
        const diffX = touch.clientX - this.touchStartX;
        const diffY = touch.clientY - this.touchStartY;
        
        // Determine swipe direction
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                // Swipe right - could be used for a special action
                console.log('Swipe right detected');
            } else {
                // Swipe left - could be used for a special action
                console.log('Swipe left detected');
            }
        } else {
            // Vertical swipe
            if (diffY > 0) {
                // Swipe down - could be used for a special action
                console.log('Swipe down detected');
            } else {
                // Swipe up - could be used for a special action
                console.log('Swipe up detected');
                
                // Example: Activate EW when swiping up
                if (this.game.player && !this.game.player.ewActive && this.game.player.ewCooldownComplete) {
                    this.game.keys[' '] = true;
                    
                    // Reset key state after a short delay
                    setTimeout(() => {
                        this.game.keys[' '] = false;
                    }, 100);
                }
            }
        }
        
        // Reset touch tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // Clear swipe timeout
        if (this.swipeTimeout) {
            clearTimeout(this.swipeTimeout);
            this.swipeTimeout = null;
        }
    }
    
    /**
     * Handle tap event
     * @param {TouchEvent} e - Touch event
     * @private
     */
    _handleTap(e) {
        // If it's not a swipe and the game is running, handle it as a tap
        if (!this.isSwipe && this.game.isRunning && !this.game.isGameOver) {
            const touch = e.touches[0];
            const canvasRect = this.canvas.getBoundingClientRect();
            
            // Get touch position relative to canvas
            const x = touch.clientX - canvasRect.left;
            const y = touch.clientY - canvasRect.top;
            
            // Calculate tap position as a percentage of canvas dimensions
            const tapX = x / this.canvas.width;
            const tapY = y / this.canvas.height;
            
            // Handle different regions of the screen for different actions
            // Example: Left side for left movement, right side for right movement
            if (tapX < 0.33) {
                // Left side tap - move left
                this.game.keys['ArrowLeft'] = true;
                setTimeout(() => this.game.keys['ArrowLeft'] = false, 200);
            } else if (tapX > 0.66) {
                // Right side tap - move right
                this.game.keys['ArrowRight'] = true;
                setTimeout(() => this.game.keys['ArrowRight'] = false, 200);
            } else if (tapY < 0.33) {
                // Top center - move up
                this.game.keys['ArrowUp'] = true;
                setTimeout(() => this.game.keys['ArrowUp'] = false, 200);
            } else if (tapY > 0.66) {
                // Bottom center - move down
                this.game.keys['ArrowDown'] = true;
                setTimeout(() => this.game.keys['ArrowDown'] = false, 200);
            }
        }
    }
} 