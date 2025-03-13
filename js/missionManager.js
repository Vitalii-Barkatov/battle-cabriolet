/**
 * MissionManager class
 * Handles mission types, objectives, and completion
 */
class MissionManager {
    constructor(mapGenerator, player, audioManager) {
        this.mapGenerator = mapGenerator;
        this.player = player;
        this.audioManager = audioManager;
        
        this.missionType = null;
        this.missionPhase = 0; // 0: going to objective, 1: returning to start
        this.currentMap = null;
        
        this.objectiveRadius = 30; // Radius for detecting when player reaches objective
        this.missionComplete = false;
        
        this.missionTypes = {
            EVACUATION: 'evacuation',
            DELIVERY: 'delivery'
        };

        this.isActive = false;
        this.showMissionCompleteText = true;
        this.missionCompleteTimer = this.missionCompleteDisplayTime;
    }

    /**
     * Start a new mission
     * @param {string} [forceMissionType] - Optional mission type to force ('evacuation' or 'delivery')
     * @returns {Object} Generated map for the mission
     */
    startNewMission(forceMissionType) {
        // Set mission type - use forced type if provided
        if (forceMissionType && (forceMissionType === this.missionTypes.EVACUATION || 
                                forceMissionType === this.missionTypes.DELIVERY)) {
            this.missionType = forceMissionType;
        } else {
            // Random mission type
            this.missionType = Math.random() < 0.5 ? this.missionTypes.EVACUATION : this.missionTypes.DELIVERY;
        }
        
        this.missionPhase = 0;
        this.missionComplete = false;
        
        // Set initial player state based on mission type
        if (this.missionType === this.missionTypes.DELIVERY) {
            this.player.hasCargo = true;
            this.player.hasRescue = false;
        } else {
            this.player.hasCargo = false;
            this.player.hasRescue = false;
        }
        
        // Generate new map
        this.currentMap = this.mapGenerator.generateMap(this.missionType);
        
        // Reset player position
        this.player.resetPosition(this.currentMap.start.x, this.currentMap.start.y);
        
        return this.currentMap;
    }

    /**
     * Update mission state
     * @returns {Object|null} - Reward object if mission phase completed, null otherwise
     */
    update() {
        if (this.missionComplete) return null;
        
        // Check if player reached the objective
        const objective = this.missionPhase === 0 ? this.currentMap.goal : this.currentMap.start;
        const playerCenter = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2
        };
        
        const objectiveCenter = {
            x: objective.x + this.currentMap.tileSize / 2,
            y: objective.y + this.currentMap.tileSize / 2
        };
        
        const distance = calculateDistance(
            playerCenter.x, playerCenter.y,
            objectiveCenter.x, objectiveCenter.y
        );
        
        // If player reaches the objective in the current phase
        if (distance < this.objectiveRadius) {
            let reward = null;
            
            if (this.missionPhase === 0) {
                // Reached goal, now return to start
                this.missionPhase = 1;
                
                // Update player state based on mission type
                if (this.missionType === this.missionTypes.EVACUATION) {
                    this.player.hasRescue = true; // Picked up wounded soldier
                } else if (this.missionType === this.missionTypes.DELIVERY) {
                    this.player.hasCargo = false; // Delivered cargo
                }
                
                reward = { points: 0, message: this.getReturnMessage() };
            } else {
                // Reached start after objective, mission complete
                this.missionComplete = true;
                
                // Reset player state
                this.player.hasRescue = false;
                this.player.hasCargo = false;
                
                // Play mission complete sound
                this.audioManager.playSfx('sfx_mission_complete');
                
                reward = { points: 10, message: 'Mission Complete! +10 points' };
            }
            
            return reward;
        }
        
        return null;
    }

    /**
     * Get current mission objective text
     * @returns {string} Objective description
     */
    getCurrentObjectiveText() {
        if (this.missionType === this.missionTypes.EVACUATION) {
            return this.missionPhase === 0 ? 
                GameTexts.mission.evacuation.phase0 : 
                GameTexts.mission.evacuation.phase1;
        } else {
            return this.missionPhase === 0 ? 
                GameTexts.mission.delivery.phase0 : 
                GameTexts.mission.delivery.phase1;
        }
    }

    /**
     * Get message for when returning to start
     * @returns {string} Return phase message
     * @private
     */
    getReturnMessage() {
        if (this.missionType === this.missionTypes.EVACUATION) {
            return 'Soldier rescued! Return to base.';
        } else {
            return 'Cargo delivered! Return to base.';
        }
    }

    /**
     * Draw mission objectives on the map
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Draw start position (always visible)
        this._drawMapPoint(ctx, this.currentMap.start, 'rgba(0, 255, 0, 0.7)', 1);
        
        // Draw goal position if in phase 0
        if (this.missionPhase === 0) {
            this._drawMapPoint(ctx, this.currentMap.goal, 'rgba(255, 215, 0, 0.7)', 1);
        }
        
        // NOTE: Mines are now rendered in the Game class with proper terrain backgrounds
        // We no longer need to draw them here
    }

    /**
     * Draw a point on the map
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} point - Point to draw
     * @param {string} color - Color to use
     * @param {number} sizeMultiplier - Size multiplier (1 = full tile size)
     * @private
     */
    _drawMapPoint(ctx, point, color, sizeMultiplier = 1) {
        const size = this.currentMap.tileSize * sizeMultiplier;
        const offset = (this.currentMap.tileSize - size) / 2;
        
        ctx.fillStyle = color;
        ctx.fillRect(
            point.x + offset,
            point.y + offset,
            size,
            size
        );
    }

    /**
     * Check if player hit a mine
     * @returns {boolean} Whether player hit a mine
     */
    checkMineCollision() {
        const playerBounds = this.player.getCollisionBounds();
        
        for (const mine of this.currentMap.mines) {
            const mineBounds = {
                x: mine.x,
                y: mine.y,
                width: this.currentMap.tileSize,
                height: this.currentMap.tileSize
            };
            
            if (checkCollision(playerBounds, mineBounds)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if mission is complete
     * @returns {boolean} Whether mission is complete
     */
    isMissionComplete() {
        return this.missionComplete;
    }

    /**
     * Get objective position based on current mission phase
     * @returns {Object} Current objective position
     */
    getCurrentObjectivePosition() {
        return this.missionPhase === 0 ? this.currentMap.goal : this.currentMap.start;
    }

    /**
     * Reset the current mission after player revival
     * @returns {Object} Current map with reset objectives
     */
    resetCurrentMission() {
        // Reset player position to the starting point
        this.player.resetPosition(this.startingPosition.x, this.startingPosition.y);
        
        // Reset mission state but keep the same map
        this.isMissionCompleted = false;
        this.hasCargo = false;
        this.hasRescue = false;
        
        // Reset mission objectives on the current map
        this._setupMissionObjectives(this.currentMap);
        
        return this.currentMap;
    }
} 