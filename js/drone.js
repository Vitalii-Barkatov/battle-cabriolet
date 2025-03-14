/**
 * Drone class
 * Manages enemy FPV drones that move toward the player
 */
class Drone {
    constructor(x, y, width, height, player, audioManager) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.player = player;
        this.audioManager = audioManager;
        
        this.speed = 3.24; // Restore original faster speed (was 2.81)
        this.isDestroyed = false;
        this.destroyAnimation = 0;
        
        // Oscillation for movement to make it look more natural
        this.oscillationAmplitude = 1;
        this.oscillationSpeed = 0.1;
        this.oscillationOffset = Math.random() * Math.PI * 2;
        
        // Audio settings
        this.audioActivationDistance = width * 10; // Distance within which drone hum is played
        this.isPlayingHumSound = false; // Track if this drone is currently playing hum sound
        this.humSoundId = `sfx_drone_hum_${this.x}_${this.y}_${Date.now()}`; // Create unique ID for this drone
        this.humSound = null; // Store reference to the actual sound object
        
        // No longer playing sound on creation - the DroneManager will handle the warning sound
    }

    /**
     * Start playing the drone hum sound
     * @private
     */
    _startHumSound() {
        if (!this.isPlayingHumSound) {
            // Create a unique ID for this drone instance
            this.humSoundId = `sfx_drone_hum_${this.x}_${this.y}_${Date.now()}`;
            
            // Use the special createDroneHumSound method (true = loop)
            this.humSound = this.audioManager.createDroneHumSound(this.humSoundId, true);
            
            if (this.humSound) {
                this.isPlayingHumSound = true;
                console.log(`Started drone hum: ${this.humSoundId}`);
            }
        }
    }

    /**
     * Update drone state
     * @param {number} deltaTime - Time since last update in milliseconds
     * @param {Object} map - Current map data
     * @returns {boolean} - Whether the drone should be removed
     */
    update(deltaTime, map) {
        // If already destroyed, animate destruction and then remove
        if (this.isDestroyed) {
            this.destroyAnimation += deltaTime;
            return this.destroyAnimation >= 1000; // Remove after 1 second
        }
        
        // Calculate direction to player
        const playerCenter = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2
        };
        
        const droneCenter = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
        
        // Calculate direction vector
        const dx = playerCenter.x - droneCenter.x;
        const dy = playerCenter.y - droneCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalized direction vector
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Apply oscillation for more natural movement
            const oscillation = Math.sin((Date.now() * this.oscillationSpeed + this.oscillationOffset)) * this.oscillationAmplitude;
            const perpX = -dirY; // Perpendicular vector
            const perpY = dirX;
            
            // Move towards player with some oscillation
            this.x += (dirX + perpX * oscillation) * this.speed;
            this.y += (dirY + perpY * oscillation) * this.speed;
        }
        
        // Only check sound based on distance if it's not already playing
        // If the sound is already playing (from warning stage), keep it playing
        if (!this.isPlayingHumSound) {
            // Update sound based on distance - but with hysteresis to prevent cycling
            const isNearPlayer = distance < this.audioActivationDistance;
            
            // Start sound when within activation distance
            if (isNearPlayer) {
                this._startHumSound();
            }
        } 
        else if (distance > this.audioActivationDistance * 1.5) {
            // Only stop sound when well outside activation distance (50% buffer)
            // This is a larger buffer than before to prevent sound cycling
            this.audioManager.stopSfx(this.humSoundId);
            this.isPlayingHumSound = false;
            this.humSound = null;
            console.log(`Stopped drone hum (distance): ${this.humSoundId}`);
        }
        
        return false; // Don't remove
    }

    /**
     * Draw the drone
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        if (this.isDestroyed) {
            // Draw explosion animation
            const explosionProgress = this.destroyAnimation / 1000; // 0 to 1
            const radius = this.width * (1 + explosionProgress);
            
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 100, 0, ${1 - explosionProgress})`;
            ctx.fill();
        } else {
            // Draw drone at its actual size without enlargement
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            // Draw drone body with outline
            ctx.fillStyle = '#E74C3C'; // Red color for enemy drones
            ctx.strokeStyle = '#FFFFFF'; // White outline
            ctx.lineWidth = 2;
            
            // Draw the rectangle centered at the drone's position
            ctx.fillRect(
                centerX - this.width / 2, 
                centerY - this.height / 2, 
                this.width, 
                this.height
            );
            ctx.strokeRect(
                centerX - this.width / 2, 
                centerY - this.height / 2, 
                this.width, 
                this.height
            );
            
            // Draw propellers
            ctx.fillStyle = '#7F8C8D'; // Gray color for propellers
            const propellerSize = this.width / 4;
            
            // Top-left propeller
            ctx.fillRect(
                centerX - this.width / 2 - propellerSize / 2, 
                centerY - this.height / 2 - propellerSize / 2, 
                propellerSize, 
                propellerSize
            );
            
            // Top-right propeller
            ctx.fillRect(
                centerX + this.width / 2 - propellerSize / 2, 
                centerY - this.height / 2 - propellerSize / 2, 
                propellerSize, 
                propellerSize
            );
            
            // Bottom-left propeller
            ctx.fillRect(
                centerX - this.width / 2 - propellerSize / 2, 
                centerY + this.height / 2 - propellerSize / 2, 
                propellerSize, 
                propellerSize
            );
            
            // Bottom-right propeller
            ctx.fillRect(
                centerX + this.width / 2 - propellerSize / 2, 
                centerY + this.height / 2 - propellerSize / 2, 
                propellerSize, 
                propellerSize
            );
        }
    }

    /**
     * Check if drone collides with player
     * @returns {boolean} Whether collision occurred
     */
    checkPlayerCollision() {
        if (this.isDestroyed) return false;
        
        // Use the player's collision bounds for more accurate collision
        const playerBounds = this.player.getCollisionBounds();
        
        return checkCollision(
            { x: this.x, y: this.y, width: this.width, height: this.height },
            playerBounds
        );
    }

    /**
     * Factory method to create a drone at a random edge position
     * @param {Object} map - Current map data
     * @param {Player} player - Player object
     * @param {AudioManager} audioManager - Audio manager
     * @returns {Drone} New drone instance
     */
    static createRandomDrone(map, player, audioManager) {
        // Use standard tile size for drones (no enlargement)
        const droneSize = map.tileSize;
        
        // Get a random edge position
        const position = getRandomEdgePosition(map.width, map.height, map.tileSize);
        
        // Log the drone creation for debugging
        console.log(`Creating drone at position: x=${position.x}, y=${position.y}, map dimensions: ${map.width}x${map.height}`);
        
        return new Drone(
            position.x, 
            position.y, 
            droneSize, 
            droneSize, 
            player, 
            audioManager
        );
    }

    destroy() {
        // Force stop the drone hum sound
        if (this.isPlayingHumSound) {
            console.log(`Stopping drone hum sound on destroy: ${this.humSoundId}`);
            
            // Use the AudioManager to stop the sound
            this.audioManager.stopSfx(this.humSoundId);
            
            // Clear tracking variables
            this.isPlayingHumSound = false;
            this.humSound = null;
        } else {
            console.log(`Note: Drone was not playing hum sound when destroyed: ${this.humSoundId}`);
        }
        
        // Play explosion sound
        this.audioManager.playSfx('sfx_drone_destroyed');
        
        // Set destroyed flag
        this.isDestroyed = true;
    }
}

/**
 * DroneManager class
 * Handles spawning and managing drones
 */
class DroneManager {
    constructor(map, player, audioManager) {
        this.map = map;
        this.player = player;
        this.audioManager = audioManager;
        this.drones = [];
        
        // Store the next drone that will be spawned
        this.pendingDrone = null;
        
        // Static values that don't change
        this.initialSpawnRange = { min: 7000, max: 10000 }; // 7-10 seconds for first drone
        this.baseSpawnInterval = 15000; // Base interval for calculating subsequent spawns
        this.spawnReduction = 0.95; // Reduce spawn time by 5% each spawn
        
        // Drone spawning (these will persist between rounds)
        this.spawnInterval = this.baseSpawnInterval; // Regular interval between drones
        this.spawnTimer = this._getFirstDroneSpawnTime(); // Random time for first drone
        this.spawnCount = 0; // Count of drones spawned across all rounds
        
        // Drone speed progression (these will persist between rounds)
        this.speedMultiplier = 1.0; // Starting multiplier
        this.speedIncrease = 0.05; // Each drone is 5% faster than the previous
        
        // Sound starts playing 2 seconds before drone appears
        this.warningTime = 2000; // 2 seconds sound before spawn
        this.warningActive = false;
    }

    /**
     * Get a random spawn time for the first drone in a round
     * @returns {number} Time in milliseconds
     * @private
     */
    _getFirstDroneSpawnTime() {
        return Math.floor(
            this.initialSpawnRange.min + 
            Math.random() * (this.initialSpawnRange.max - this.initialSpawnRange.min)
        );
    }

    /**
     * Update all drones and manage spawning
     * @param {number} deltaTime - Time since last update in milliseconds
     * @param {Object} map - Current map data
     * @returns {boolean} Whether a collision with player occurred
     */
    update(deltaTime, map) {
        this.map = map; // Update map reference
        
        // Update spawn timer
        this.spawnTimer -= deltaTime;
        
        // Check if we should start playing the drone sound (2 seconds before visual appearance)
        if (this.spawnTimer <= this.warningTime && !this.warningActive) {
            console.log("Starting drone sound 2 seconds before visual appearance");
            
            // Create the drone but don't make it visible yet
            this.pendingDrone = Drone.createRandomDrone(this.map, this.player, this.audioManager);
            
            // Apply current speed multiplier to this drone
            this.pendingDrone.speed *= this.speedMultiplier;
            
            // Start playing the drone sound 2 seconds before it appears
            // The sound will continue playing as the drone becomes visible
            this.pendingDrone._startHumSound();
            
            this.warningActive = true;
        }
        
        // Check if it's time to spawn a new drone
        if (this.spawnTimer <= 0) {
            if (this.pendingDrone) {
                console.log("Adding pending drone to active drones");
                // Add the pending drone to the active drones array
                // The sound is already playing, so it will continue seamlessly
                this.drones.push(this.pendingDrone);
                this.pendingDrone = null;
            } else {
                // Fallback in case there's no pending drone (shouldn't happen normally)
                console.log("No pending drone, creating new one (fallback)");
                this._spawnDrone();
            }
            
            // Increment spawn count
            this.spawnCount++;
            
            // Calculate next spawn time based on how many drones have been spawned
            if (this.spawnCount <= 1) {
                // If this was the first drone ever, use the base interval next
                this.spawnTimer = this.baseSpawnInterval;
            } else {
                // Otherwise use the progressively decreasing interval
                this.spawnTimer = this.spawnInterval;
                // Reduce spawn interval for next drone
                this.spawnInterval *= this.spawnReduction;
            }
            
            this.warningActive = false;
            
            // Increase speed for next drone
            this.speedMultiplier += this.speedIncrease;
        }
        
        // Update all drones
        let playerCollision = false;
        
        for (let i = this.drones.length - 1; i >= 0; i--) {
            const drone = this.drones[i];
            const shouldRemove = drone.update(deltaTime, map);
            
            // Check for collision with player
            if (!playerCollision && drone.checkPlayerCollision()) {
                playerCollision = true;
            }
            
            // Remove drone if needed
            if (shouldRemove) {
                this.drones.splice(i, 1);
            }
        }
        
        return playerCollision;
    }

    /**
     * Draw all drones
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Draw the active drones
        this.drones.forEach(drone => drone.draw(ctx));
        
        // Don't draw the pending drone - it's not visible yet, only its sound is playing
    }

    /**
     * Check if any drone is within EW radius
     * @param {boolean} [ewJustActivated=false] - Whether EW was just activated this frame
     * @returns {number} Number of drones destroyed
     */
    checkEWDestruction(ewJustActivated = false) {
        let destroyedCount = 0;
        
        this.drones.forEach(drone => {
            if (!drone.isDestroyed && 
                this.player.isWithinEWRadius(drone.x + drone.width / 2, drone.y + drone.height / 2)) {
                drone.destroy(); // Use the destroy method instead of setting isDestroyed directly
                destroyedCount++;
            }
        });
        
        return destroyedCount;
    }

    /**
     * Spawn a new drone at a random edge position
     * @private
     */
    _spawnDrone() {
        const drone = Drone.createRandomDrone(this.map, this.player, this.audioManager);
        
        // Apply current speed multiplier to this drone
        drone.speed *= this.speedMultiplier;
        
        this.drones.push(drone);
    }

    /**
     * Reset the drone manager for a new round (keeps difficulty progression)
     */
    reset() {
        // Stop sounds for all drones
        this.drones.forEach(drone => {
            if (drone.isPlayingHumSound) {
                drone.audioManager.stopSfx(drone.humSoundId);
            }
        });
        
        // Clear the drones array
        this.drones = [];
        
        // Stop sound for pending drone if there is one
        if (this.pendingDrone && this.pendingDrone.isPlayingHumSound) {
            this.pendingDrone.audioManager.stopSfx(this.pendingDrone.humSoundId);
            this.pendingDrone = null;
        }
        
        // Reset the spawn timer for a new round (random 7-10 seconds)
        this.spawnTimer = this._getFirstDroneSpawnTime();
        this.warningActive = false;
        
        // Don't reset spawnInterval, spawnCount, or speedMultiplier
        // This ensures difficulty progression persists between rounds
    }

    /**
     * Completely reset the drone manager after game over
     * Resets all parameters including difficulty progression
     */
    fullReset() {
        // Stop sounds for all drones
        this.drones.forEach(drone => {
            if (drone.isPlayingHumSound) {
                drone.audioManager.stopSfx(drone.humSoundId);
            }
        });
        
        // Clear the drones array
        this.drones = [];
        
        // Stop sound for pending drone if there is one
        if (this.pendingDrone && this.pendingDrone.isPlayingHumSound) {
            this.pendingDrone.audioManager.stopSfx(this.pendingDrone.humSoundId);
            this.pendingDrone = null;
        }
        
        // Reset spawn parameters to initial values
        this.spawnInterval = this.baseSpawnInterval;
        this.spawnTimer = this._getFirstDroneSpawnTime();
        this.spawnCount = 0;
        this.warningActive = false;
        
        // Reset speed multiplier
        this.speedMultiplier = 1.0;
    }

    /**
     * Get the number of active drones
     * @returns {number} Number of active drones
     */
    getDroneCount() {
        return this.drones.length;
    }
}

/**
 * Get a random position at the edge of the map
 * @param {number} mapWidth - Map width in pixels
 * @param {number} mapHeight - Map height in pixels
 * @param {number} tileSize - Size of a tile in pixels
 * @returns {Object} Position object with x and y coordinates
 */
function getRandomEdgePosition(mapWidth, mapHeight, tileSize) {
    // Ensure we have valid map dimensions
    if (!mapWidth || !mapHeight || mapWidth <= 0 || mapHeight <= 0) {
        console.error("Invalid map dimensions:", mapWidth, mapHeight);
        // Fallback to some reasonable values
        mapWidth = 800;
        mapHeight = 600;
    }
    
    // Ensure we have a valid tile size
    if (!tileSize || tileSize <= 0) {
        console.error("Invalid tile size:", tileSize);
        // Fallback to a reasonable value
        tileSize = 32;
    }
    
    // Ensure we're at least one tile away from the edge
    const safetyMargin = tileSize;
    
    // Choose which edge to spawn on (0: top, 1: right, 2: bottom, 3: left)
    const edge = Math.floor(Math.random() * 4);
    
    let x, y;
    
    switch (edge) {
        case 0: // Top edge
            x = safetyMargin + Math.random() * (mapWidth - 2 * safetyMargin);
            y = safetyMargin;
            break;
        case 1: // Right edge
            x = mapWidth - safetyMargin;
            y = safetyMargin + Math.random() * (mapHeight - 2 * safetyMargin);
            break;
        case 2: // Bottom edge
            x = safetyMargin + Math.random() * (mapWidth - 2 * safetyMargin);
            y = mapHeight - safetyMargin;
            break;
        case 3: // Left edge
            x = safetyMargin;
            y = safetyMargin + Math.random() * (mapHeight - 2 * safetyMargin);
            break;
    }
    
    console.log(`Drone spawning at edge ${edge}: x=${x}, y=${y}`);
    
    return { x, y };
} 