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
        this.speed = 2.1; // Base speed reduced by 30% (from 3 to 2.1)
        this.currentSpeed = this.speed;
        this.isMoving = false;
        this.direction = { x: 0, y: 0 };
        this.orientation = 0; // 0 = up, 1 = right, 2 = down, 3 = left (clockwise rotation)
        
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
        // Calculate direction from input
        this.direction = { x: 0, y: 0 };
        
        // Reset movement flag
        this.isMoving = false;
        
        // Handle arrow key input
        if (keys['ArrowUp']) {
            this.direction.y = -1;
            this.orientation = 0;
            this.isMoving = true;
        } else if (keys['ArrowDown']) {
            this.direction.y = 1;
            this.orientation = 2;
            this.isMoving = true;
        }
        
        if (keys['ArrowLeft']) {
            this.direction.x = -1;
            this.orientation = 3;
            this.isMoving = true;
        } else if (keys['ArrowRight']) {
            this.direction.x = 1;
            this.orientation = 1;
            this.isMoving = true;
        }
        
        // For mobile: normalize diagonal movement to avoid faster diagonal speed
        if (this.direction.x !== 0 && this.direction.y !== 0) {
            const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
            this.direction.x /= length;
            this.direction.y /= length;
        }
        
        // Adjust speed based on terrain
        this._adjustSpeedBasedOnTerrain(map);
        
        // Apply movement if moving
        if (this.isMoving) {
            const newX = this.x + this.direction.x * this.currentSpeed;
            const newY = this.y + this.direction.y * this.currentSpeed;
            
            // Check if we can move to the new position
            if (this._canMove(newX, newY, map)) {
                this.x = newX;
                this.y = newY;
            }
            
            // Handle movement sound
            this._handleMovementSound();
        }
        
        // Update EW (Electronic Warfare) state
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
        
        if (platformImage) {
            // Save the current context state
            ctx.save();
            
            // Translate to the center of the platform
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            
            // Rotate based on orientation (in radians)
            const rotationAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // [up, right, down, left]
            ctx.rotate(rotationAngles[this.orientation]);
            
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
        }
        
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
            console.log("Drawing EW circle - active");
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
            console.log("EW activated!");
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
     * Reset the player position
     * @param {number} x - New X coordinate
     * @param {number} y - New Y coordinate
     */
    resetPosition(x, y) {
        this.x = x;
        this.y = y;
        this.hasCargo = false;
        this.hasRescue = false;
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
        console.log("EW power refreshed and ready to use");
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
        
        // Check if any corner is in a wall
        for (const corner of corners) {
            const terrain = MapGenerator.getTerrainAtPosition(map, corner.x, corner.y);
            if (terrain === this.terrainTypes.WALL) {
                return false;
            }
        }
        
        // Check map boundaries
        if (bounds.x < 0 || bounds.x + bounds.width > map.width || 
            bounds.y < 0 || bounds.y + bounds.height > map.height) {
            return false;
        }
        
        return true;
    }

    /**
     * Adjust movement speed based on terrain type
     * @param {Object} map - Current map data
     * @private
     */
    _adjustSpeedBasedOnTerrain(map) {
        // Check terrain at the center of the player
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const terrain = MapGenerator.getTerrainAtPosition(map, centerX, centerY);
        
        if (terrain === null) return;
        
        // Set speed multiplier based on terrain type
        switch (terrain) {
            case this.terrainTypes.ASPHALT:
                this.currentSpeed = this.speed * 1.1; // 10% speed boost on asphalt
                break;
            case this.terrainTypes.DIRT:
                this.currentSpeed = this.speed * 0.7; // 70% speed on dirt
                break;
            case this.terrainTypes.WATER:
                this.currentSpeed = this.speed * 0.4; // 40% speed on water
                break;
            default:
                this.currentSpeed = this.speed;
                break;
        }
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
                console.log("EW deactivated - duration expired");
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
        return Math.floor(((this.ewCooldown - this.ewCooldownTimer) / this.ewCooldown) * 100);
    }
} 