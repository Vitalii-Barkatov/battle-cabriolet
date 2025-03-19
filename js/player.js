/**
 * Player class
 * Manages the platform's position, movement, collision detection, and REB (Electronic Warfare) state
 */
class Player {
    constructor(x, y, width, height, audioManager) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.audioManager = audioManager;
        
        // Movement
        this.speed = 2.1; // Reduced by 30% from 3.0
        this.currentSpeed = this.speed;
        this.isMoving = false;
        this.direction = { x: 0, y: 0 };
        this.orientation = 0; // 0 = up, 1 = right, 2 = down, 3 = left (clockwise rotation)
        this.lastPressedKey = null; // Track the last pressed key for movement
        
        // Boost functionality ("Навалити!")
        this.boostAvailable = true;
        this.isBoostActive = false;
        this.boostDuration = 2000; // 2 seconds
        this.boostTimer = 0;
        this.boostMultiplier = 1.5; // 1.5x speed
        
        // EW (Electronic Warfare)
        this.ewActive = false;
        this.ewRadius = width * 3;
        this.ewDuration = 3000; // 3 seconds
        this.ewCooldown = 10000; // 10 seconds
        this.ewTimer = 0;
        this.ewCooldownTimer = 0;
        this.ewCooldownComplete = true;
        this.ewJustActivated = false; // Track when EW was just activated
        
        // Mission state
        this.hasCargo = false;
        this.hasRescue = false;
        
        // Movement sound
        this.moveSoundPlaying = false;
        
        // Collision area (slightly smaller than visual size for better gameplay)
        this.collisionWidth = width * 0.8;
        this.collisionHeight = height * 0.8;
        this.collisionOffset = {
            x: (width - width * 0.8) / 2,
            y: (height - height * 0.8) / 2
        };
        
        // Cache terrain types for easier reference
        this.terrainTypes = {
            ASPHALT: 0,
            DIRT: 1,
            WATER: 2,
            WALL: 3,
            MINE: 4
        };
    }

    /**
     * Update player state
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     * @param {Object} keys - Current key states
     * @param {Array} map - Current game map
     */
    update(deltaTime, keys, map) {
        // Normalize deltaTime to seconds and cap it to prevent huge jumps
        const dt = Math.min(deltaTime, 50) / 1000; // Convert ms to seconds, max 50ms
        
        // Calculate direction from input
        this.direction = { x: 0, y: 0 };
        
        // Reset movement flag
        this.isMoving = false;
        
        // Update last pressed key
        if (keys['ArrowUp'] && this.lastPressedKey !== 'ArrowUp') {
            this.lastPressedKey = 'ArrowUp';
        }
        if (keys['ArrowDown'] && this.lastPressedKey !== 'ArrowDown') {
            this.lastPressedKey = 'ArrowDown';
        }
        if (keys['ArrowLeft'] && this.lastPressedKey !== 'ArrowLeft') {
            this.lastPressedKey = 'ArrowLeft';
        }
        if (keys['ArrowRight'] && this.lastPressedKey !== 'ArrowRight') {
            this.lastPressedKey = 'ArrowRight';
        }
        
        // Reset last pressed key if it's no longer being pressed
        if (this.lastPressedKey && !keys[this.lastPressedKey]) {
            this.lastPressedKey = null;
        }
        
        // Handle arrow key input based on last pressed key
        // If any key is pressed, use the last pressed key for movement
        if (keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight']) {
            const activeKey = this.lastPressedKey || 
                        (keys['ArrowUp'] ? 'ArrowUp' : 
                        (keys['ArrowDown'] ? 'ArrowDown' : 
                        (keys['ArrowLeft'] ? 'ArrowLeft' : 'ArrowRight')));
            
            // Set direction based on active key (no diagonals)
            switch (activeKey) {
                case 'ArrowUp':
                    this.direction.y = -1;
                    this.direction.x = 0;
                    this.orientation = 0;
                    break;
                case 'ArrowDown':
                    this.direction.y = 1;
                    this.direction.x = 0;
                    this.orientation = 2;
                    break;
                case 'ArrowLeft':
                    this.direction.x = -1;
                    this.direction.y = 0;
                    this.orientation = 3;
                    break;
                case 'ArrowRight':
                    this.direction.x = 1;
                    this.direction.y = 0;
                    this.orientation = 1;
                    break;
            }
            
            this.isMoving = true;
        }
        
        // Check for boost activation (using letter 'c' or 'C' in any layout)
        // This ensures it works in both latin and cyrillic layouts
        if ((keys['c'] || keys['C'] || keys['с'] || keys['С']) && this.boostAvailable) {
            this.activateBoost();
        }
        
        // Update boost timer if active
        if (this.isBoostActive) {
            this.boostTimer += deltaTime;
            if (this.boostTimer >= this.boostDuration) {
                this.isBoostActive = false;
                this.boostTimer = 0;
            }
        }
        
        // Adjust speed based on terrain
        this._adjustSpeedBasedOnTerrain(map);
        
        // Apply movement if moving
        if (this.isMoving) {
            // Apply frames-per-second independence by scaling movement by deltaTime
            const speedPerFrame = this.currentSpeed * dt * 60; // Scale to 60fps equivalent
            
            const newX = this.x + this.direction.x * speedPerFrame;
            const newY = this.y + this.direction.y * speedPerFrame;
            
            // Check if we can move to the new position
            if (this._canMove(newX, newY, map)) {
                this.x = newX;
                this.y = newY;
            } else {
                // We hit a wall or boundary - stop moving
                this.isMoving = false;
            }
        }
        
        // Always handle movement sound - this ensures sound stops when we're not moving
        this._handleMovementSound();
        
        // Update EW (Electronic Warfare) state - scale cooldown by deltaTime
        this._updateEWState(deltaTime);
        
        // Check for EW activation (space bar)
        if (keys[' '] && this.ewCooldownComplete && !this.ewActive) {
            this.activateEW();
        }
    }

    /**
     * Draw the player
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {ImageManager} imageManager - Image manager to get platform texture
     */
    draw(ctx, imageManager) {
        // Try to use platform texture image if available
        const platformImage = imageManager ? imageManager.getImage('player_platform') : null;
        
        // Save the current global alpha
        const originalAlpha = ctx.globalAlpha;
        
        // If boost is active, add a visual effect (pulsing)
        if (this.isBoostActive) {
            const pulseRate = 10; // Higher number = faster pulse
            const pulseAmount = 0.3; // Pulse intensity (0-1)
            const alpha = 1 - (Math.sin(Date.now() * 0.01 * pulseRate) * pulseAmount);
            ctx.globalAlpha = alpha;
        }
        
        if (platformImage) {
            // Save the current context state
            ctx.save();
            
            // Translate to the center of the platform
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            
            // Rotate based on orientation (in radians)
            const rotationAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // [up, right, down, left]
            ctx.rotate(rotationAngles[this.orientation]);
            
            // If boost is active, draw a boost trail effect before drawing the platform
            // This ensures the trail appears behind the platform in the direction of movement
            if (this.isBoostActive) {
                // Draw a glowing outline around the platform
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; // Gold color
                ctx.lineWidth = 3;
                ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
                
                // Draw trail effect behind platform in the direction opposite to movement
                const trailLength = 4; // Increased number of segments for better gradient
                
                // Starting point for trail - much closer to the platform
                const trailStartY = this.height / 2 + 2; // Just 2 pixels from edge
                
                // Draw trail segments with higher opacity and tighter spacing
                for (let i = 0; i < trailLength; i++) {
                    // More visible gradient with higher starting opacity
                    const opacity = 0.8 - (i * 0.2);
                    // Smaller size reduction for more visible segments
                    const size = this.width - (i * 2);
                    
                    ctx.fillStyle = `rgba(255, 165, 0, ${opacity})`;
                    ctx.fillRect(
                        -size / 2, // Center horizontally
                        trailStartY + (i * 3), // Very tight spacing (3px instead of 5px)
                        size,
                        size * 0.7 // Slightly flatter rectangles for better trail appearance
                    );
                }
            }
            
            // Draw platform image centered
            ctx.drawImage(
                platformImage, 
                -this.width / 2, 
                -this.height / 2, 
                this.width, 
                this.height
            );
            
            // Restore the context
            ctx.restore();
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = '#4CAF50'; // Green color for the platform
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // If boost is active, add a visual effect
            if (this.isBoostActive) {
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                
                // Draw trail in simple mode too
                // Determine the trail direction based on orientation
                let trailX = this.x;
                let trailY = this.y;
                let trailWidth = this.width;
                let trailHeight = this.height;
                
                // Calculate trail position based on orientation - make it closer to platform
                switch (this.orientation) {
                    case 0: // Moving up - trail goes below
                        trailY = this.y + this.height - 2; // Close to the platform
                        trailHeight = this.height * 0.8; // Taller trail
                        break;
                    case 1: // Moving right - trail goes left
                        trailX = this.x - this.width * 0.8 + 2; // Close to the platform
                        trailWidth = this.width * 0.8; // Wider trail
                        break;
                    case 2: // Moving down - trail goes above
                        trailY = this.y - this.height * 0.8 + 2; // Close to the platform
                        trailHeight = this.height * 0.8; // Taller trail
                        break;
                    case 3: // Moving left - trail goes right
                        trailX = this.x + this.width - 2; // Close to the platform
                        trailWidth = this.width * 0.8; // Wider trail
                        break;
                }
                
                // Draw multi-layered trail for better gradient effect
                const segments = 3;
                
                for (let i = 0; i < segments; i++) {
                    let segmentX = trailX;
                    let segmentY = trailY;
                    let segmentWidth = trailWidth;
                    let segmentHeight = trailHeight;
                    
                    // Adjust segment position and size based on orientation and segment index
                    switch (this.orientation) {
                        case 0: // Moving up - trail goes down
                            segmentY = trailY + (i * 4);
                            segmentHeight = trailHeight - (i * 5);
                            break;
                        case 1: // Moving right - trail goes left
                            segmentX = trailX - (i * 4);
                            segmentWidth = trailWidth - (i * 5);
                            break;
                        case 2: // Moving down - trail goes up
                            segmentY = trailY - (i * 4);
                            segmentHeight = trailHeight - (i * 5);
                            break;
                        case 3: // Moving left - trail goes right
                            segmentX = trailX + (i * 4);
                            segmentWidth = trailWidth - (i * 5);
                            break;
                    }
                    
                    // Draw with decreasing opacity for gradient effect
                    const opacity = 0.8 - (i * 0.25);
                    ctx.fillStyle = `rgba(255, 165, 0, ${opacity})`;
                    ctx.fillRect(segmentX, segmentY, segmentWidth, segmentHeight);
                }
            }
        }
        
        // Restore original alpha
        ctx.globalAlpha = originalAlpha;
        
        // Draw cargo or rescue indicator if carrying
        if (this.hasCargo) {
            ctx.fillStyle = '#FFC107'; // Yellow for cargo
            ctx.fillRect(this.x + this.width / 4, this.y + this.height / 4, this.width / 2, this.height / 2);
        } else if (this.hasRescue) {
            ctx.fillStyle = '#F44336'; // Red for wounded soldier
            ctx.fillRect(this.x + this.width / 4, this.y + this.height / 4, this.width / 2, this.height / 2);
        }
        
        // Draw EW radius when active
        if (this.ewActive) {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.ewRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * Activate Electronic Warfare if available
     * @returns {boolean} Whether EW was activated
     */
    activateEW() {
        if (this.ewCooldownComplete) {
            this.ewActive = true;
            this.ewTimer = 0; // Reset timer to 0 at activation
            this.ewCooldownComplete = false;
            this.ewCooldownTimer = 0; // Reset cooldown timer
            this.ewJustActivated = true;
            
            // Play EW activation sound
            this.audioManager.playSfx('sfx_reb_activate');
            
            return true;
        }
        return false;
    }

    /**
     * Check if a position is within the EW radius
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether the position is within the EW radius
     */
    isWithinEWRadius(x, y) {
        if (!this.ewActive) return false;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const distance = calculateDistance(centerX, centerY, x, y);
        
        return distance <= this.ewRadius;
    }

    /**
     * Get the collision bounds for the player
     * @returns {Object} Collision bounds
     */
    getCollisionBounds() {
        return {
            x: this.x + this.collisionOffset.x,
            y: this.y + this.collisionOffset.y,
            width: this.collisionWidth,
            height: this.collisionHeight
        };
    }

    /**
     * Reset player position
     * @param {number} x - New x coordinate
     * @param {number} y - New y coordinate
     */
    resetPosition(x, y) {
        this.x = x;
        this.y = y;
        this.direction = { x: 0, y: 0 };
        this.isMoving = false;
        
        // Stop movement sound if it's playing - force a stop regardless of flag
        this.audioManager.stopSfx('sfx_platform_move');
        this.moveSoundPlaying = false;
        
        // Also stop any looping sounds that might be playing
        if (this.audioManager && typeof this.audioManager.stopAllSfx === 'function') {
            this.audioManager.stopAllSfx();
        }
    }
    
    /**
     * Reset player position to center of canvas
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    resetToCenter(canvasWidth, canvasHeight) {
        this.resetPosition(
            Math.floor(canvasWidth / 2),
            Math.floor(canvasHeight / 2)
        );
    }

    /**
     * Reset Electronic Warfare to ready state
     * Makes EW immediately available for use at the start of a new mission
     */
    resetEW() {
        this.ewActive = false;
        this.ewTimer = 0;
        this.ewCooldownTimer = 0;
        this.ewCooldownComplete = true;
        this.ewJustActivated = false;
    }

    /**
     * Check if movement is possible (no wall collisions)
     * @param {number} newX - Potential new X coordinate
     * @param {number} newY - Potential new Y coordinate
     * @param {Object} map - Current map data
     * @returns {boolean} Whether movement is allowed
     * @private
     */
    _canMove(newX, newY, map) {
        // Check if map is valid
        if (!map || !map.tiles) {
            // If no valid map, default to allowing movement
            return true;
        }
        
        // Get collision bounds at the new position
        const bounds = {
            x: newX + this.collisionOffset.x,
            y: newY + this.collisionOffset.y,
            width: this.collisionWidth,
            height: this.collisionHeight
        };
        
        // Check each corner of the player's collision area
        const corners = [
            { x: bounds.x, y: bounds.y }, // Top-left
            { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
            { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height } // Bottom-right
        ];
        
        // Check if any corner is in a wall or outside the map boundaries
        for (const corner of corners) {
            // First, check if the corner is outside the canvas boundaries
            if (corner.x < 0 || corner.y < 0) {
                return false;
            }
            
            // Calculate the pixel dimensions of the map (based on tiles and tile size)
            const mapPixelWidth = map.tiles[0].length * map.tileSize;
            const mapPixelHeight = map.tiles.length * map.tileSize;
            
            // Check if we'd move outside the map boundaries
            if (corner.x >= mapPixelWidth || corner.y >= mapPixelHeight) {
                return false;
            }
            
            // Now check for walls
            const terrain = MapGenerator.getTerrainAtPosition(map, corner.x, corner.y);
            if (terrain === this.terrainTypes.WALL) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Adjust player speed based on terrain
     * @param {Object} map - Current map data
     * @private
     */
    _adjustSpeedBasedOnTerrain(map) {
        // Ensure map is valid
        if (!map || !map.tiles) {
            // If no valid map, use default speed
            this.currentSpeed = this.speed;
            return;
        }
        
        // Check terrain at the center of the player
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const terrain = MapGenerator.getTerrainAtPosition(map, centerX, centerY);
        
        if (terrain === null) {
            // If terrain check failed, use default speed
            this.currentSpeed = this.speed;
            return;
        }
        
        // Set speed multiplier based on terrain type
        let terrainMultiplier = 1.0;
        
        switch (terrain) {
            case this.terrainTypes.ASPHALT:
                terrainMultiplier = 1.2; // 20% speed boost on asphalt (increased from 10%)
                break;
            case this.terrainTypes.DIRT:
                terrainMultiplier = 0.8; // 80% speed on dirt (increased from 70%)
                break;
            case this.terrainTypes.WATER:
                terrainMultiplier = 0.5; // 50% speed on water (increased from 40%)
                break;
            default:
                terrainMultiplier = 1.0;
                break;
        }
        
        // Apply boost multiplier if active
        if (this.isBoostActive) {
            terrainMultiplier *= this.boostMultiplier;
        }
        
        // Set the current speed
        this.currentSpeed = this.speed * terrainMultiplier;
    }

    /**
     * Update Electronic Warfare state
     * @param {number} deltaTime - Time since last update in milliseconds
     * @private
     */
    _updateEWState(deltaTime) {
        if (this.ewActive) {
            this.ewTimer += deltaTime;
            if (this.ewTimer >= this.ewDuration) {
                this.ewActive = false;
                this.ewTimer = 0;
                this.ewCooldownTimer = 0; // Start the cooldown timer
            }
            // EW effect is shown in the draw method automatically
        } else {
            this.ewCooldownTimer += deltaTime;
            if (this.ewCooldownTimer >= this.ewCooldown) {
                this.ewCooldownComplete = true;
            }
        }
    }

    /**
     * Handle player movement sound effects
     * @private
     */
    _handleMovementSound() {
        // Only play movement sound if actually moving (position changed)
        // Check both the movement flag and that we're actually changing position
        const isActuallyMoving = this.isMoving && 
            (this.direction.x !== 0 || this.direction.y !== 0) && 
            this.currentSpeed > 0;
            
        if (isActuallyMoving && !this.moveSoundPlaying) {
            // Play the movement sound as a looping sound
            this.audioManager.playSfx('sfx_platform_move', true); // true = loop
            this.moveSoundPlaying = true;
        } else if (!isActuallyMoving && this.moveSoundPlaying) {
            // Stop the movement sound when no longer moving
            this.audioManager.stopSfx('sfx_platform_move');
            this.moveSoundPlaying = false;
        }
    }

    /**
     * Get the EW cooldown progress as a percentage
     * @returns {number} Cooldown progress (0-100)
     */
    getEWCooldownProgress() {
        if (this.ewCooldownComplete) return 100;
        return Math.floor((this.ewCooldownTimer / this.ewCooldown) * 100);
    }

    /**
     * Cleanup when player is destroyed or game is reset
     * Stops all sounds and clears any ongoing effects
     */
    cleanup() {
        // Stop movement sound if it's playing
        if (this.moveSoundPlaying) {
            this.audioManager.stopSfx('sfx_platform_move');
            this.moveSoundPlaying = false;
        }
        
        // Make absolutely sure the platform movement sound is stopped
        // Even if moveSoundPlaying flag is out of sync
        this.audioManager.stopSfx('sfx_platform_move');
        
        // Reset movement state
        this.isMoving = false;
        this.direction = { x: 0, y: 0 };
        
        // Also stop EW sound if it's active
        if (this.ewActive) {
            this.audioManager.stopSfx('sfx_reb_activate');
            this.ewActive = false;
        }
    }

    /**
     * Activate boost functionality ("Навалити!")
     * @returns {boolean} Whether boost was activated
     */
    activateBoost() {
        if (this.boostAvailable) {
            this.isBoostActive = true;
            this.boostTimer = 0;
            this.boostAvailable = false;
            
            // Play a boost activation sound if available
            this.audioManager.playSfx('sfx_boost_activate');
            
            return true;
        }
        return false;
    }

    /**
     * Reset boost functionality for a new round
     * Makes boost available again
     */
    resetBoost() {
        this.boostAvailable = true;
        this.isBoostActive = false;
        this.boostTimer = 0;
    }
    
    /**
     * Check if boost is currently available
     * @returns {boolean} Whether the boost is available
     */
    isBoostAvailable() {
        return this.boostAvailable;
    }
    
    /**
     * Check if boost is currently active
     * @returns {boolean} Whether the boost is active
     */
    isBoostActive() {
        return this.isBoostActive;
    }
} 