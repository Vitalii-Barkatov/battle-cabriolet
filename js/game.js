/**
 * Game class
 * Main controller that initializes and orchestrates all other components
 */
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Define tile size (32x32 grid results in 25x17 tiles on desktop)
        this.tileSize = 32;
        
        // Detect if we're on mobile
        this.isMobileDevice = this._detectMobileDevice();
        
        // Set canvas dimensions based on device type
        this._setupCanvasDimensions();
        
        // Create components
        this.audioManager = new AudioManager();
        this.imageManager = new ImageManager();
        
        // NOTE: We're running without real audio files for now
        // The AudioManager has been modified to handle missing files gracefully
        console.log("Game initialized without audio files - this is expected");
        
        this.mapGenerator = new MapGenerator(this.width, this.height, this.tileSize);
        this.ui = new UI(this.audioManager, this.imageManager);
        
        // Create player (initially positioned at 0,0, will be updated)
        this.player = new Player(0, 0, this.tileSize, this.tileSize, this.audioManager);
        
        // Create mission manager
        this.missionManager = new MissionManager(this.mapGenerator, this.player, this.audioManager);
        
        // Initialize drone manager (will be reset when game starts)
        this.droneManager = null;
        
        // Game state
        this.currentMap = null;
        this.score = 0;
        this.isGameOver = false;
        this.isRunning = false;
        this.keys = {}; // Keyboard state
        
        // Animation frame ID for cancellation
        this.animationFrameId = null;
        
        // Last frame timestamp for delta time calculation
        this.lastFrameTime = 0;
        
        // Initialize game
        this._init();
    }

    /**
     * Detect if the device is mobile
     * @returns {boolean} Whether the device is mobile
     * @private
     */
    _detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 900;
    }

    /**
     * Set up canvas dimensions based on device type
     * @private
     */
    _setupCanvasDimensions() {
        if (this.isMobileDevice) {
            // For mobile, calculate dimensions based on available screen space
            const isLandscape = window.innerWidth > window.innerHeight;
            
            if (isLandscape) {
                // Get available screen dimensions
                // Account for HUD height (using a smaller HUD on mobile)
                const hudHeight = window.innerHeight <= 400 ? 25 : 30;
                const availableWidth = window.innerWidth;
                const availableHeight = window.innerHeight - hudHeight;
                
                // Calculate how many tiles can fit in the available space
                const tilesX = Math.floor(availableWidth / this.tileSize);
                const tilesY = Math.floor(availableHeight / this.tileSize);
                
                // Set canvas dimensions to be exactly the right size for the number of tiles
                this.width = tilesX * this.tileSize;
                this.height = tilesY * this.tileSize;
                
                // Store tile counts for map generation
                this.tilesX = tilesX;
                this.tilesY = tilesY;
                
                console.log(`Mobile canvas dimensions: ${this.width}x${this.height} (${tilesX}x${tilesY} tiles)`);
            } else {
                // In portrait, prompt to rotate device but use a smaller grid
                // This is a fallback for portrait mode
                const availableWidth = window.innerWidth;
                const availableHeight = window.innerHeight / 2; // Use half height for game
                
                // Calculate how many tiles can fit in the available space
                const tilesX = Math.floor(availableWidth / this.tileSize);
                const tilesY = Math.floor(availableHeight / this.tileSize);
                
                // Set canvas dimensions to be exactly the right size for the number of tiles
                this.width = tilesX * this.tileSize;
                this.height = tilesY * this.tileSize;
                
                // Store tile counts for map generation
                this.tilesX = tilesX;
                this.tilesY = tilesY;
                
                console.log(`Mobile portrait dimensions: ${this.width}x${this.height} (${tilesX}x${tilesY} tiles)`);
            }
        } else {
            // For desktop, use the original fixed dimensions
            this.width = 800;
            this.height = 544; // Adjusted to exactly 17 tiles (17 * 32 = 544)
            
            // Store tile counts for map generation
            this.tilesX = Math.floor(this.width / this.tileSize); // 25 tiles
            this.tilesY = Math.floor(this.height / this.tileSize); // 17 tiles
        }
        
        // Set the actual canvas width and height
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Handle window resize
     * This allows the game to adjust its dimensions when the screen size changes
     */
    handleResize() {
        // Only resize if we're on mobile
        if (this.isMobileDevice) {
            // Store the original player position as a percentage of the canvas
            const playerXPercent = this.player ? this.player.x / this.width : 0.5;
            const playerYPercent = this.player ? this.player.y / this.height : 0.5;
            
            // Recalculate canvas dimensions
            this._setupCanvasDimensions();
            
            // If we have a map, regenerate it with new dimensions
            if (this.currentMap && this.isRunning) {
                // Generate a new map with the new dimensions
                this.currentMap = this.mapGenerator.generateMap(this.tilesX, this.tilesY);
                
                // Reposition player at the same relative position
                if (this.player) {
                    this.player.x = Math.floor(playerXPercent * this.width);
                    this.player.y = Math.floor(playerYPercent * this.height);
                }
                
                // Reset missions and drones if they exist
                if (this.missionManager) {
                    this.missionManager.reset(this.currentMap);
                }
                
                if (this.droneManager) {
                    this.droneManager.reset();
                }
            }
        }
    }

    /**
     * Initialize the game
     * @private
     */
    async _init() {
        // Load audio assets (with graceful fallback for missing files)
        try {
            await this.audioManager.preloadAudio();
            console.log('Audio initialization complete');
        } catch (error) {
            console.warn('Audio initialization had some issues, but game will continue:', error);
            // Continue anyway since we've made audio optional
        }
        
        // Load image assets (with graceful fallback for missing files)
        try {
            await this.imageManager.preloadImages();
            console.log('Image initialization complete');
        } catch (error) {
            console.warn('Image initialization had some issues, but game will continue:', error);
            // Continue anyway since we've made images optional
        }
        
        // Set up keyboard event listeners
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Prevent scrolling when using arrow keys and prevent default behavior for Space and Enter keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Set up mobile touch controls
        this._setupMobileControls();
        
        // Detect mobile devices and adjust game settings accordingly
        this._setupMobileDetection();
        
        // Add resize handler
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(() => this.handleResize(), 300);
        });
        
        // Show a message that we're running without audio
        console.log('Game ready - running without audio files is fine');
        
        // Start the game loop
        this._gameLoop(0);
    }

    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     * @private
     */
    _gameLoop(timestamp) {
        // Calculate delta time in milliseconds
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Check UI state for game actions
        this._checkUIActions();
        
        // Update game state if running
        if (this.isRunning && !this.isGameOver) {
            this._update(deltaTime);
        }
        
        // Render everything
        this._render();
        
        // Continue the loop
        this.animationFrameId = requestAnimationFrame((ts) => this._gameLoop(ts));
    }

    /**
     * Check for UI actions (start, restart, revive)
     * @private
     */
    _checkUIActions() {
        // Check if we should start a new game
        if (this.ui.shouldStartNewGame()) {
            this._startNewGame();
        }
        
        // Check if we should restart the game
        if (this.ui.shouldRestartGame()) {
            this._startNewGame();
        }
        
        // Check if player should be revived
        if (this.ui.shouldRevivePlayer()) {
            this._revivePlayer();
        }
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last update in milliseconds
     * @private
     */
    _update(deltaTime) {
        // Update player
        this.player.update(deltaTime, this.keys, this.currentMap);
        
        // Update drone manager
        const droneCollision = this.droneManager.update(deltaTime, this.currentMap);
        
        // Check for drone collision
        if (droneCollision) {
            this._handlePlayerDeath();
            return;
        }
        
        // Check for mine collision
        if (this.missionManager.checkMineCollision()) {
            this._handlePlayerDeath();
            return;
        }
        
        // Check for EW activation and drone destruction
        if (this.player.ewActive) {
            // Check if EW was just activated or is still active
            const destroyedCount = this.droneManager.checkEWDestruction(this.player.ewJustActivated);
            
            // Reset the ewJustActivated flag after checking for drone destruction
            if (this.player.ewJustActivated) {
                this.player.ewJustActivated = false;
            }
            
            if (destroyedCount > 0) {
                // Award 5 points per drone destroyed
                this._addScore(destroyedCount * 5);
                this.ui.showMessage(GameTexts.messages.droneDestroyed(destroyedCount, destroyedCount * 5));
            }
        }
        
        // Update mission state
        const missionUpdate = this.missionManager.update();
        if (missionUpdate) {
            // If there are points to award
            if (missionUpdate.points > 0) {
                this._addScore(missionUpdate.points);
            }
            
            // Show message
            this.ui.showMessage(missionUpdate.message);
            
            // Update objective text
            this.ui.updateObjectiveText(this.missionManager.getCurrentObjectiveText());
            
            // If mission complete, start a new one
            if (this.missionManager.isMissionComplete()) {
                this._startNewMission();
            }
        }
        
        // Update EW cooldown display
        this.ui.updateEWCooldown(this.player.getEWCooldownProgress());
    }

    /**
     * Render the game
     * @private
     */
    _render() {
        // Clear the canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // If the game is running, render the game elements
        if (this.isRunning) {
            // Render map
            this._renderMap();
            
            // Render mission objectives
            this.missionManager.draw(this.ctx);
            
            // Render drones
            this.droneManager.draw(this.ctx);
            
            // Render player - pass imageManager
            this.player.draw(this.ctx, this.imageManager);
        }
    }

    /**
     * Render the map
     * @private
     */
    _renderMap() {
        // First, create a record of mine positions for quick lookup
        const minePositions = {};
        if (this.currentMap.mines) {
            this.currentMap.mines.forEach(mine => {
                const key = `${mine.tileX},${mine.tileY}`;
                minePositions[key] = mine;
            });
        }
    
        // Render tiles
        for (let y = 0; y < this.currentMap.tiles.length; y++) {
            for (let x = 0; x < this.currentMap.tiles[y].length; x++) {
                const tileType = this.currentMap.tiles[y][x];
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                
                // Skip if this is a wall tile (buildings will be rendered separately)
                if (tileType === this.mapGenerator.terrainTypes.WALL) {
                    continue;
                }
                
                // Check if this is a mine tile
                const mineKey = `${x},${y}`;
                const isMine = tileType === this.mapGenerator.terrainTypes.MINE;
                const mine = minePositions[mineKey];
                
                // Determine the terrain type to render
                let renderTileType = tileType;
                if (isMine && mine && mine.originalTerrain !== undefined) {
                    // For mines, use the original terrain for the background
                    renderTileType = mine.originalTerrain;
                }
                
                // Try to use image first if available
                let imageId = null;
                
                // Never try to render a mine image - we'll render the original terrain
                // and add a red dot on top
                if (renderTileType === this.mapGenerator.terrainTypes.ASPHALT) {
                    // Count horizontal and vertical road tiles
                    const hasLeft = x > 0 && this.currentMap.tiles[y][x-1] === this.mapGenerator.terrainTypes.ASPHALT;
                    const hasRight = x < this.currentMap.tiles[y].length - 1 && this.currentMap.tiles[y][x+1] === this.mapGenerator.terrainTypes.ASPHALT;
                    const hasTop = y > 0 && this.currentMap.tiles[y-1][x] === this.mapGenerator.terrainTypes.ASPHALT;
                    const hasBottom = y < this.currentMap.tiles.length - 1 && this.currentMap.tiles[y+1][x] === this.mapGenerator.terrainTypes.ASPHALT;
                    
                    // Check for being part of a 2-tile wide vertical road
                    const isPartOfVerticalRoad = this._isPartOfVerticalRoad(x, y);
                    
                    // Check for being part of a 2-tile wide horizontal road
                    const isPartOfHorizontalRoad = this._isPartOfHorizontalRoad(x, y);
                    
                    // Determine road type
                    if (hasTop || hasBottom || isPartOfVerticalRoad) {
                        if ((hasLeft || hasRight || isPartOfHorizontalRoad) && !isPartOfVerticalRoad) {
                            // Mixed road with no clear vertical component
                            const isIntersection = this._isRoadIntersection(x, y);
                            imageId = isIntersection ? 'tile_asphalt_intersection' : 'tile_asphalt_horizontal';
                        } else {
                            // Primarily vertical road
                            imageId = 'tile_asphalt_vertical';
                        }
                    } else {
                        // Default to horizontal for all other cases
                        imageId = 'tile_asphalt_horizontal';
                    }
                } else if (renderTileType === this.mapGenerator.terrainTypes.DIRT) {
                    imageId = 'tile_dirt';
                } else if (renderTileType === this.mapGenerator.terrainTypes.WATER) {
                    imageId = 'tile_water';
                }
                // We no longer have a tile_mine imageId case - we'll render the underlying terrain
                
                // Draw the tile background
                const image = this.imageManager.getImage(imageId);
                if (image) {
                    this.ctx.drawImage(image, tileX, tileY, this.tileSize, this.tileSize);
                } else {
                    // Fallback to colored rectangle
                    let color = '#000';
                    if (renderTileType === this.mapGenerator.terrainTypes.ASPHALT) {
                        color = '#333333';
                    } else if (renderTileType === this.mapGenerator.terrainTypes.DIRT) {
                        color = '#8B4513';
                    } else if (renderTileType === this.mapGenerator.terrainTypes.WATER) {
                        color = '#1E90FF';
                    }
                    // We no longer have a MINE case here since we're using the original terrain type
                    
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                }
                
                // Grid lines
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.strokeRect(tileX, tileY, this.tileSize, this.tileSize);
                
                // If this is a mine tile, draw the mine indicator (small red dot)
                if (isMine) {
                    // Draw the mine texture on top of the terrain
                    const mineImage = this.imageManager.getImage('tile_mine');
                    if (mineImage) {
                        // Make the mine texture pulse slightly to draw attention
                        const mineAlpha = 0.8 + Math.sin(Date.now() * 0.005) * 0.2; // Pulsing opacity
                        
                        // Save the current global alpha
                        const originalAlpha = this.ctx.globalAlpha;
                        
                        // Set the alpha for the mine texture
                        this.ctx.globalAlpha = mineAlpha;
                        
                        // Draw the mine texture over the terrain
                        this.ctx.drawImage(mineImage, tileX, tileY, this.tileSize, this.tileSize);
                        
                        // Restore the original global alpha
                        this.ctx.globalAlpha = originalAlpha;
                    } else {
                        // Fallback to the red dot if the mine texture is not loaded
                        const dotSize = 6;
                        const mineAlpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
                        
                        // Draw a black outline for better visibility
                        this.ctx.beginPath();
                        this.ctx.arc(
                            tileX + (this.tileSize / 2),
                            tileY + (this.tileSize / 2),
                            (dotSize / 2) + 1,
                            0, 
                            Math.PI * 2
                        );
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        this.ctx.fill();
                        
                        // Draw the red dot
                        this.ctx.beginPath();
                        this.ctx.arc(
                            tileX + (this.tileSize / 2),
                            tileY + (this.tileSize / 2),
                            dotSize / 2,
                            0, 
                            Math.PI * 2
                        );
                        this.ctx.fillStyle = `rgba(255, 0, 0, ${mineAlpha})`;
                        this.ctx.fill();
                        
                        // Add a red pulsing glow
                        this.ctx.beginPath();
                        this.ctx.arc(
                            tileX + (this.tileSize / 2),
                            tileY + (this.tileSize / 2),
                            dotSize,
                            0, 
                            Math.PI * 2
                        );
                        const glowAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
                        this.ctx.fillStyle = `rgba(255, 0, 0, ${glowAlpha})`;
                        this.ctx.fill();
                    }
                }
            }
        }
        
        // Render buildings as distinct entities
        if (this.currentMap.buildings) {
            for (const building of this.currentMap.buildings) {
                // Try to get custom building texture based on building type
                const buildingImage = this.imageManager.getImage(building.type);
                
                if (buildingImage) {
                    // Draw the building using custom building texture
                    this.ctx.drawImage(
                        buildingImage,
                        building.x,
                        building.y,
                        building.width,
                        building.height
                    );
                    
                    // Add visual detail based on shape if needed
                    if (building.shape === 'hollow') {
                        // Draw interior hollow area as dirt
                        const padding = this.tileSize;
                        if (building.width > padding * 2 && building.height > padding * 2) {
                            const dirtImage = this.imageManager.getImage('tile_dirt');
                            
                            if (dirtImage) {
                                // Fill the hollow center with dirt texture
                                for (let y = padding; y < building.height - padding; y += this.tileSize) {
                                    for (let x = padding; x < building.width - padding; x += this.tileSize) {
                                        this.ctx.drawImage(
                                            dirtImage,
                                            building.x + x,
                                            building.y + y,
                                            this.tileSize,
                                            this.tileSize
                                        );
                                    }
                                }
                            } else {
                                // Fallback to dirt color if image not available
                                this.ctx.fillStyle = '#8B4513'; // Dirt color for interior
                                this.ctx.fillRect(
                                    building.x + padding, 
                                    building.y + padding, 
                                    building.width - (padding * 2), 
                                    building.height - (padding * 2)
                                );
                            }
                        }
                    }
                } else {
                    // Fallback: If building texture isn't available, use wall texture
                    const wallImage = this.imageManager.getImage('tile_wall');
                    
                    if (wallImage) {
                        // Draw the building using wall texture repeated across the building
                        for (let y = 0; y < building.height; y += this.tileSize) {
                            for (let x = 0; x < building.width; x += this.tileSize) {
                                this.ctx.drawImage(
                                    wallImage,
                                    building.x + x,
                                    building.y + y,
                                    this.tileSize,
                                    this.tileSize
                                );
                            }
                        }
                        
                        // Add visual detail for hollow buildings
                        if (building.shape === 'hollow') {
                            // Draw interior hollow area as dirt
                            const padding = this.tileSize;
                            if (building.width > padding * 2 && building.height > padding * 2) {
                                const dirtImage = this.imageManager.getImage('tile_dirt');
                                
                                for (let y = padding; y < building.height - padding; y += this.tileSize) {
                                    for (let x = padding; x < building.width - padding; x += this.tileSize) {
                                        if (dirtImage) {
                                            this.ctx.drawImage(
                                                dirtImage,
                                                building.x + x,
                                                building.y + y,
                                                this.tileSize,
                                                this.tileSize
                                            );
                                        } else {
                                            // Fallback to dirt color if image not available
                                            this.ctx.fillStyle = '#8B4513'; // Dirt color for interior
                                            this.ctx.fillRect(
                                                building.x + x,
                                                building.y + y,
                                                this.tileSize,
                                                this.tileSize
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        // Fallback: draw a colored rectangle if no textures are available
                        this.ctx.fillStyle = '#696969'; // Wall color
                        this.ctx.fillRect(
                            building.x, 
                            building.y, 
                            building.width, 
                            building.height
                        );
                        
                        // Draw a dark outline
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeStyle = '#000000';
                        this.ctx.strokeRect(
                            building.x, 
                            building.y, 
                            building.width, 
                            building.height
                        );
                        
                        // Add visual detail based on shape
                        if (building.shape === 'hollow') {
                            // Draw interior hollow area
                            const padding = this.tileSize;
                            if (building.width > padding * 2 && building.height > padding * 2) {
                                this.ctx.fillStyle = '#8B4513'; // Dirt color for interior
                                this.ctx.fillRect(
                                    building.x + padding, 
                                    building.y + padding, 
                                    building.width - (padding * 2), 
                                    building.height - (padding * 2)
                                );
                            }
                        }
                        
                        // Reset line width
                        this.ctx.lineWidth = 1;
                    }
                }
            }
        }
    }

    /**
     * Check if a tile is a true road intersection
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether this tile is at an intersection
     * @private
     */
    _isRoadIntersection(x, y) {
        // For a true intersection, we need both horizontal and vertical roads
        // that are each at least 3 tiles long
        
        // Check for horizontal road (at least 3 tiles)
        let horizontalRoadTiles = 1; // Start with 1 for the current tile
        
        // Count to the left
        for (let dx = -1; dx >= -2; dx--) {
            const checkX = x + dx;
            if (checkX >= 0 && 
                this.currentMap.tiles[y][checkX] === this.mapGenerator.terrainTypes.ASPHALT) {
                horizontalRoadTiles++;
            } else {
                break;
            }
        }
        
        // Count to the right
        for (let dx = 1; dx <= 2; dx++) {
            const checkX = x + dx;
            if (checkX < this.currentMap.tiles[y].length &&
                this.currentMap.tiles[y][checkX] === this.mapGenerator.terrainTypes.ASPHALT) {
                horizontalRoadTiles++;
            } else {
                break;
            }
        }
        
        // Check for vertical road (at least 3 tiles)
        let verticalRoadTiles = 1; // Start with 1 for the current tile
        
        // Count upward
        for (let dy = -1; dy >= -2; dy--) {
            const checkY = y + dy;
            if (checkY >= 0 &&
                this.currentMap.tiles[checkY][x] === this.mapGenerator.terrainTypes.ASPHALT) {
                verticalRoadTiles++;
            } else {
                break;
            }
        }
        
        // Count downward
        for (let dy = 1; dy <= 2; dy++) {
            const checkY = y + dy;
            if (checkY < this.currentMap.tiles.length &&
                this.currentMap.tiles[checkY][x] === this.mapGenerator.terrainTypes.ASPHALT) {
                verticalRoadTiles++;
            } else {
                break;
            }
        }
        
        // A true intersection has both horizontal and vertical roads of at least 3 tiles
        return horizontalRoadTiles >= 3 && verticalRoadTiles >= 3;
    }

    /**
     * Check if a tile is part of a 2-tile wide vertical road
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether this tile is part of a vertical road
     * @private
     */
    _isPartOfVerticalRoad(x, y) {
        // Check if we have a 2-tile wide road by checking horizontal neighbors
        if (x < this.currentMap.tiles[y].length - 1 &&
            this.currentMap.tiles[y][x] === this.mapGenerator.terrainTypes.ASPHALT &&
            this.currentMap.tiles[y][x+1] === this.mapGenerator.terrainTypes.ASPHALT) {
            
            // Look for vertical continuity above or below
            let hasVerticalNeighbors = false;
            
            // Check above (2 tiles)
            if (y >= 2 && 
                this.currentMap.tiles[y-1][x] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-1][x+1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-2][x] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-2][x+1] === this.mapGenerator.terrainTypes.ASPHALT) {
                hasVerticalNeighbors = true;
            }
            
            // Check below (2 tiles)
            if (y < this.currentMap.tiles.length - 2 && 
                this.currentMap.tiles[y+1][x] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+1][x+1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+2][x] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+2][x+1] === this.mapGenerator.terrainTypes.ASPHALT) {
                hasVerticalNeighbors = true;
            }
            
            return hasVerticalNeighbors;
        }
        
        // Also check if this is the second tile in a 2-tile wide vertical road
        if (x > 0 &&
            this.currentMap.tiles[y][x] === this.mapGenerator.terrainTypes.ASPHALT &&
            this.currentMap.tiles[y][x-1] === this.mapGenerator.terrainTypes.ASPHALT) {
            
            // Look for vertical continuity above or below
            let hasVerticalNeighbors = false;
            
            // Check above (2 tiles)
            if (y >= 2 && 
                this.currentMap.tiles[y-1][x] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-1][x-1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-2][x] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-2][x-1] === this.mapGenerator.terrainTypes.ASPHALT) {
                hasVerticalNeighbors = true;
            }
            
            // Check below (2 tiles)
            if (y < this.currentMap.tiles.length - 2 && 
                this.currentMap.tiles[y+1][x] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+1][x-1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+2][x] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+2][x-1] === this.mapGenerator.terrainTypes.ASPHALT) {
                hasVerticalNeighbors = true;
            }
            
            return hasVerticalNeighbors;
        }
        
        return false;
    }

    /**
     * Check if a tile is part of a 2-tile wide horizontal road
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Whether this tile is part of a horizontal road
     * @private
     */
    _isPartOfHorizontalRoad(x, y) {
        // Check if we have a 2-tile wide road by checking vertical neighbors
        if (y < this.currentMap.tiles.length - 1 &&
            this.currentMap.tiles[y][x] === this.mapGenerator.terrainTypes.ASPHALT &&
            this.currentMap.tiles[y+1][x] === this.mapGenerator.terrainTypes.ASPHALT) {
            
            // Look for horizontal continuity to the left or right
            let hasHorizontalNeighbors = false;
            
            // Check to the left (2 tiles)
            if (x >= 2 && 
                this.currentMap.tiles[y][x-1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+1][x-1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y][x-2] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+1][x-2] === this.mapGenerator.terrainTypes.ASPHALT) {
                hasHorizontalNeighbors = true;
            }
            
            // Check to the right (2 tiles)
            if (x < this.currentMap.tiles[y].length - 2 && 
                this.currentMap.tiles[y][x+1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+1][x+1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y][x+2] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y+1][x+2] === this.mapGenerator.terrainTypes.ASPHALT) {
                hasHorizontalNeighbors = true;
            }
            
            return hasHorizontalNeighbors;
        }
        
        // Also check if this is the second tile in a 2-tile wide horizontal road
        if (y > 0 &&
            this.currentMap.tiles[y][x] === this.mapGenerator.terrainTypes.ASPHALT &&
            this.currentMap.tiles[y-1][x] === this.mapGenerator.terrainTypes.ASPHALT) {
            
            // Look for horizontal continuity to the left or right
            let hasHorizontalNeighbors = false;
            
            // Check to the left (2 tiles)
            if (x >= 2 && 
                this.currentMap.tiles[y][x-1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-1][x-1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y][x-2] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-1][x-2] === this.mapGenerator.terrainTypes.ASPHALT) {
                hasHorizontalNeighbors = true;
            }
            
            // Check to the right (2 tiles)
            if (x < this.currentMap.tiles[y].length - 2 && 
                this.currentMap.tiles[y][x+1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-1][x+1] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y][x+2] === this.mapGenerator.terrainTypes.ASPHALT &&
                this.currentMap.tiles[y-1][x+2] === this.mapGenerator.terrainTypes.ASPHALT) {
                hasHorizontalNeighbors = true;
            }
            
            return hasHorizontalNeighbors;
        }
        
        return false;
    }

    /**
     * Start a new game
     * @private
     */
    _startNewGame() {
        // Reset score
        this.score = 0;
        
        // Reset player position to center of canvas
        this.player.resetToCenter(this.width, this.height);
        
        // Reset EW state
        this.player.resetEW();
        
        // Reset game state
        this.isGameOver = false;
        
        // Pause the game until countdown is done
        this.isRunning = false;
        
        // Prepare the mission manager for a new mission
        const missionType = Math.random() < 0.5 ? 'evacuation' : 'delivery';
        
        // Show mission preparation screen with countdown
        this.ui.showMissionPreparation(missionType, () => {
            // This callback runs after countdown completes
            this.isRunning = true;
            this._startNewMission(missionType);
            
            // Show mobile controls if on mobile
            if (this.isMobileDevice) {
                document.getElementById('mobile-controls').classList.remove('hidden');
            }
            
            // Trigger game started event
            this.triggerEvent('gameStarted');
        });
    }

    /**
     * Start a new mission
     * @param {string} [missionType] - Optional mission type to force
     * @private
     */
    _startNewMission(missionType) {
        // Ensure canvas dimensions are set correctly
        this._setupCanvasDimensions();
        
        // Generate new map and start mission - pass correct tile dimensions
        this.currentMap = this.mapGenerator.generateMap(this.tilesX, this.tilesY);
        
        // Reset mission manager with this map
        this.missionManager.reset(this.currentMap);
        
        // Reset or create drone manager with new map
        if (this.droneManager) {
            this.droneManager.reset();
        } else {
            this.droneManager = new DroneManager(this.currentMap, this.player, this.audioManager);
        }
        
        // Reset the player's EW ability for the new mission
        this.player.resetEW();
        
        // Update objective text
        this.ui.updateObjectiveText(this.missionManager.getCurrentObjectiveText());
    }

    /**
     * Handle player death
     * @private
     */
    _handlePlayerDeath() {
        this.isGameOver = true;
        
        // Play explosion sound when player dies
        this.audioManager.playSfx('sfx_explosion');
        
        // Stop all other sound effects except the explosion sound
        this.audioManager.stopSfx('sfx_platform_move');
        this.audioManager.stopSfx('sfx_drone_hum');
        this.audioManager.stopSfx('sfx_reb_activate');
        
        // Hide mobile controls
        document.getElementById('mobile-controls').classList.add('hidden');
        
        // Trigger game ended event
        this.triggerEvent('gameEnded');
        
        // Delay showing game over to allow explosion sound to play
        setTimeout(() => {
            // Play menu music when game is over
            this.audioManager.playMusic('menu');
            
            // Fully reset drone manager to initial state
            if (this.droneManager) {
                this.droneManager.fullReset();
            }
            
            // Pass the imageManager to show the QR code
            this.ui.showGameOver(this.imageManager);
        }, 1000); // Wait 1 second for explosion sound to play
    }

    /**
     * Revive player after promo code
     * @private
     */
    _revivePlayer() {
        // Stop all sound effects for a clean start
        this.audioManager.stopAllSfx();
        
        // Play menu music when reviving
        this.audioManager.playMusic('menu');
        
        // Keep the game running
        this.isGameOver = false;
        this.isRunning = true;
        
        // Don't reset score - intentionally keeping it
        
        // We need a full mission restart while keeping the score
        // Start a new mission (reusing the existing method)
        this._startNewMission();
        
        // Show revival message
        this.ui.showMessage(GameTexts.messages.revivalSuccess);
    }

    /**
     * Add points to score
     * @param {number} points - Points to add
     * @private
     */
    _addScore(points) {
        this.score += points;
        this.ui.updateScore(this.score);
    }

    /**
     * Set up mobile touch controls
     * @private
     */
    _setupMobileControls() {
        // Get mobile control elements
        const mobileControls = document.getElementById('mobile-controls');
        const dpadUp = document.getElementById('dpad-up');
        const dpadRight = document.getElementById('dpad-right');
        const dpadDown = document.getElementById('dpad-down');
        const dpadLeft = document.getElementById('dpad-left');
        const rebButton = document.getElementById('reb-button');
        
        if (!dpadUp || !dpadRight || !dpadDown || !dpadLeft || !rebButton) {
            console.warn('Mobile control elements not found');
            return;
        }
        
        // Touch event handlers for D-pad with tap and hold functionality
        const setupDirectionalButton = (element, direction) => {
            let isPressed = false;
            
            const startHandler = (e) => {
                e.preventDefault();
                if (!isPressed) {
                    isPressed = true;
                    this.keys[direction] = true;
                    element.classList.add('active');
                }
            };
            
            const endHandler = (e) => {
                e.preventDefault();
                if (isPressed) {
                    isPressed = false;
                    this.keys[direction] = false;
                    element.classList.remove('active');
                }
            };
            
            // Add touch events
            element.addEventListener('touchstart', startHandler);
            element.addEventListener('touchend', endHandler);
            element.addEventListener('touchcancel', endHandler);
            
            // Add mouse events for desktop testing
            element.addEventListener('mousedown', startHandler);
            element.addEventListener('mouseup', endHandler);
            element.addEventListener('mouseleave', endHandler);
            
            // For iOS compatibility - prevent defaults
            element.addEventListener('click', (e) => {
                e.preventDefault();
            });
        };
        
        // Setup each directional button
        setupDirectionalButton(dpadUp, 'ArrowUp');
        setupDirectionalButton(dpadRight, 'ArrowRight');
        setupDirectionalButton(dpadDown, 'ArrowDown');
        setupDirectionalButton(dpadLeft, 'ArrowLeft');
        
        // Setup REB button with active state
        let rebIsPressed = false;
        
        rebButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!rebIsPressed) {
                rebIsPressed = true;
                this.keys[' '] = true; // Space key is used for EW activation
                rebButton.classList.add('active');
            }
        });
        
        const rebEndHandler = (e) => {
            e.preventDefault();
            if (rebIsPressed) {
                rebIsPressed = false;
                this.keys[' '] = false;
                rebButton.classList.remove('active');
            }
        };
        
        rebButton.addEventListener('touchend', rebEndHandler);
        rebButton.addEventListener('touchcancel', rebEndHandler);
        
        // Add mouse events for desktop testing
        rebButton.addEventListener('mousedown', (e) => {
            if (!rebIsPressed) {
                rebIsPressed = true;
                this.keys[' '] = true;
                rebButton.classList.add('active');
            }
        });
        
        rebButton.addEventListener('mouseup', (e) => {
            if (rebIsPressed) {
                rebIsPressed = false;
                this.keys[' '] = false;
                rebButton.classList.remove('active');
            }
        });
        
        rebButton.addEventListener('mouseleave', (e) => {
            if (rebIsPressed) {
                rebIsPressed = false;
                this.keys[' '] = false;
                rebButton.classList.remove('active');
            }
        });
        
        // For iOS compatibility - prevent defaults
        rebButton.addEventListener('click', (e) => {
            e.preventDefault();
        });
    }
    
    /**
     * Detect mobile devices and adjust game settings
     * @private
     */
    _setupMobileDetection() {
        // Simple mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 600;
        
        // If mobile, show mobile controls
        if (isMobile) {
            // Set a flag for mobile mode
            this.isMobileDevice = true;
            
            // Initialize touch controls
            this.touchControls = new TouchControls(this);
            
            // Show mobile controls when game starts
            this.addEventListener('gameStarted', () => {
                document.getElementById('mobile-controls').classList.remove('hidden');
            });
            
            // Hide mobile controls when game ends
            this.addEventListener('gameEnded', () => {
                document.getElementById('mobile-controls').classList.add('hidden');
            });
            
            // Adjust player speed for touch controls (slightly slower for better control)
            if (this.player) {
                this.player.speed *= 0.9;
            }
            
            // Show mobile controls usage message at first game start
            if (!localStorage.getItem('mobileControlsShown')) {
                this.addEventListener('gameStarted', () => {
                    setTimeout(() => {
                        this.ui.showMessage(GameTexts.messages.touchControls, 5000);
                        localStorage.setItem('mobileControlsShown', 'true');
                    }, 2000);
                });
            }
        } else {
            this.isMobileDevice = false;
        }
    }
    
    /**
     * Add event listener for custom game events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    addEventListener(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = {};
        }
        
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        
        this.eventListeners[event].push(callback);
    }
    
    /**
     * Trigger a custom game event
     * @param {string} event - Event name
     * @param {any} data - Event data
     */
    triggerEvent(event, data) {
        if (!this.eventListeners || !this.eventListeners[event]) {
            return;
        }
        
        this.eventListeners[event].forEach(callback => {
            callback(data);
        });
    }
} 