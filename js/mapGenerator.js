/**
 * MapGenerator class
 * Generates random tile-based maps for each mission
 */
class MapGenerator {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tilesX = Math.floor(width / tileSize);
        this.tilesY = Math.floor(height / tileSize);
        this.terrainTypes = {
            ASPHALT: 0,
            DIRT: 1,
            WATER: 2,
            WALL: 3,
            MINE: 4
        };
    }

    /**
     * Generate a new random map
     * @param {string} missionType - Type of mission ('evacuation' or 'delivery')
     * @returns {Object} Map data including tiles, start, and goal positions
     */
    generateMap(missionType) {
        // Initialize map with all dirt (now the default terrain)
        const tiles = Array(this.tilesY).fill().map(() => 
            Array(this.tilesX).fill(this.terrainTypes.DIRT)
        );
        
        // Initialize an array to store building data
        const buildings = [];
        
        // Generate roads (asphalt) in a street-like pattern
        this._generateRoads(tiles);
        
        // Generate water (lakes and rivers)
        this._generateWaterBodies(tiles);
        
        // Generate walls/buildings in more structured shapes
        this._generateBuildings(tiles, buildings);
        
        // Determine start position (always in a corner)
        const startPos = this._generateStartPosition(tiles);
        
        // Clear the area around the start position
        this._clearArea(tiles, startPos.tileX, startPos.tileY, 2);
        
        // Determine goal position based on mission type
        const goalPos = this._generateGoalPosition(tiles, startPos, missionType);
        
        // Clear the area around the goal position
        this._clearArea(tiles, goalPos.tileX, goalPos.tileY, 2);
        
        // Ensure path exists between start and goal
        this._ensurePath(tiles, startPos, goalPos);
        
        // Add random mines
        const mines = this._placeMines(tiles, startPos, goalPos);
        
        return {
            tiles,
            buildings,
            start: startPos,
            goal: goalPos,
            mines,
            width: this.width,
            height: this.height,
            tileSize: this.tileSize
        };
    }

    /**
     * Generate a grid of roads (asphalt)
     * Creates a simple road layout with perfectly straight horizontal and vertical roads, exactly 2 tiles wide
     * @param {Array} tiles - 2D array of map tiles
     * @private
     */
    _generateRoads(tiles) {
        // Determine if we have a horizontal road (always include at least one road)
        const hasHorizontalRoad = Math.random() < 0.7; // 70% chance
        
        // Determine if we have a vertical road (always include at least one road)
        const hasVerticalRoad = hasHorizontalRoad ? Math.random() < 0.5 : true; // Ensure at least one road type
        
        // Generate a horizontal road (exactly 2 tiles wide) if needed
        if (hasHorizontalRoad) {
            // Place the road somewhere in the middle section of the map
            const y = getRandomInt(Math.floor(this.tilesY * 0.3), Math.floor(this.tilesY * 0.7));
            
            // Make the road exactly 2 tiles wide
            for (let x = 0; x < this.tilesX; x++) {
                tiles[y][x] = this.terrainTypes.ASPHALT;
                
                // Make sure we don't go out of bounds
                if (y + 1 < this.tilesY) {
                    tiles[y + 1][x] = this.terrainTypes.ASPHALT;
                }
            }
        }
        
        // Generate a vertical road (exactly 2 tiles wide) if needed
        if (hasVerticalRoad) {
            // Place the road somewhere in the middle section of the map
            const x = getRandomInt(Math.floor(this.tilesX * 0.3), Math.floor(this.tilesX * 0.7));
            
            // Make the road exactly 2 tiles wide
            for (let y = 0; y < this.tilesY; y++) {
                tiles[y][x] = this.terrainTypes.ASPHALT;
                
                // Make sure we don't go out of bounds
                if (x + 1 < this.tilesX) {
                    tiles[y][x + 1] = this.terrainTypes.ASPHALT;
                }
            }
        }
    }

    /**
     * Generate water bodies (lakes and rivers)
     * @param {Array} tiles - 2D array of map tiles
     * @private
     */
    _generateWaterBodies(tiles) {
        // Generate lakes (roundy/oval shapes)
        this._generateLakes(tiles);
        
        // Generate rivers (curvy lines, 2-3 tiles wide)
        this._generateRivers(tiles);
    }
    
    /**
     * Generate lake-shaped water bodies (round/oval)
     * @param {Array} tiles - 2D array of map tiles
     * @private
     */
    _generateLakes(tiles) {
        const lakeCount = getRandomInt(1, 2);
        
        for (let i = 0; i < lakeCount; i++) {
            const centerX = getRandomInt(5, this.tilesX - 6);
            const centerY = getRandomInt(5, this.tilesY - 6);
            const radiusX = getRandomInt(3, 5);
            const radiusY = getRandomInt(3, 5);
            
            // Create an oval/round lake
            for (let y = centerY - radiusY; y <= centerY + radiusY; y++) {
                for (let x = centerX - radiusX; x <= centerX + radiusX; x++) {
                    if (y >= 0 && y < this.tilesY && x >= 0 && x < this.tilesX) {
                        // Use elliptical equation to create oval shape
                        const normalizedX = (x - centerX) / radiusX;
                        const normalizedY = (y - centerY) / radiusY;
                        const distance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
                        
                        // Add some noise to make the lake edge more natural
                        const noiseFactor = 0.2 * Math.random();
                        
                        if (distance <= 1 + noiseFactor && tiles[y][x] !== this.terrainTypes.ASPHALT) {
                            tiles[y][x] = this.terrainTypes.WATER;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Generate river-like water bodies (curvy lines, 2-3 tiles wide)
     * @param {Array} tiles - 2D array of map tiles
     * @private
     */
    _generateRivers(tiles) {
        const riverCount = getRandomInt(1, 2);
        
        for (let i = 0; i < riverCount; i++) {
            // Decide river parameters
            const riverWidth = getRandomInt(2, 3);
            const riverLength = getRandomInt(10, Math.min(this.tilesX, this.tilesY));
            
            // Choose starting edge and position
            const startEdge = getRandomInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left
            let x, y, dx, dy;
            
            // Set starting point and initial direction based on edge
            switch (startEdge) {
                case 0: // top
                    x = getRandomInt(5, this.tilesX - 6);
                    y = 0;
                    dx = 0;
                    dy = 1;
                    break;
                case 1: // right
                    x = this.tilesX - 1;
                    y = getRandomInt(5, this.tilesY - 6);
                    dx = -1;
                    dy = 0;
                    break;
                case 2: // bottom
                    x = getRandomInt(5, this.tilesX - 6);
                    y = this.tilesY - 1;
                    dx = 0;
                    dy = -1;
                    break;
                case 3: // left
                    x = 0;
                    y = getRandomInt(5, this.tilesY - 6);
                    dx = 1;
                    dy = 0;
                    break;
            }
            
            // Generate the river path
            for (let step = 0; step < riverLength; step++) {
                // Check if position is valid
                if (x < 0 || x >= this.tilesX || y < 0 || y >= this.tilesY) {
                    break;
                }
                
                // Draw the river at the current position with a width
                for (let wy = -Math.floor(riverWidth/2); wy <= Math.floor(riverWidth/2); wy++) {
                    for (let wx = -Math.floor(riverWidth/2); wx <= Math.floor(riverWidth/2); wx++) {
                        const tx = x + wx;
                        const ty = y + wy;
                        
                        if (ty >= 0 && ty < this.tilesY && tx >= 0 && tx < this.tilesX) {
                            if (tiles[ty][tx] !== this.terrainTypes.ASPHALT) {
                                tiles[ty][tx] = this.terrainTypes.WATER;
                            }
                        }
                    }
                }
                
                // Occasionally change direction (make river curvy)
                if (step > 0 && step % 3 === 0 && Math.random() < 0.6) {
                    // Store the previous direction
                    const prevDx = dx;
                    const prevDy = dy;
                    
                    // Change direction by 90 degrees (but don't go backward)
                    const turn = Math.random() < 0.5 ? 1 : -1;
                    
                    if (Math.abs(prevDx) === 1) { // Was moving horizontally
                        dx = 0;
                        dy = turn;
                    } else { // Was moving vertically
                        dx = turn;
                        dy = 0;
                    }
                }
                
                // Move to the next position
                x += dx;
                y += dy;
            }
        }
    }

    /**
     * Generate building-like wall structures (squares, rectangles, L-shapes)
     * Mostly placed along roads to form city blocks
     * @param {Array} tiles - 2D array of map tiles
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _generateBuildings(tiles, buildings = []) {
        // Find roads in the map to place buildings alongside
        const roads = this._findRoads(tiles);
        
        // No roads? Fall back to random placement
        if (roads.horizontal.length === 0 && roads.vertical.length === 0) {
            this._generateGridBuildings(tiles, buildings);
            return;
        }
        
        // Place buildings along roads in an organized grid pattern
        this._generateRoadSideBlocks(tiles, roads, buildings);
        
        // Add a few random buildings in empty areas (but still aligned)
        this._generateAlignedBuildings(tiles, 3, buildings);
    }
    
    /**
     * Find roads in the map
     * @param {Array} tiles - 2D array of map tiles
     * @returns {Object} Object with horizontal and vertical road positions
     * @private
     */
    _findRoads(tiles) {
        const roads = {
            horizontal: [],
            vertical: []
        };
        
        // Detect horizontal roads
        for (let y = 0; y < this.tilesY - 1; y++) {
            // Check if this row has a horizontal road
            let hasRoad = false;
            for (let x = 0; x < this.tilesX; x++) {
                if (tiles[y][x] === this.terrainTypes.ASPHALT && 
                    tiles[y+1][x] === this.terrainTypes.ASPHALT) {
                    hasRoad = true;
                    break;
                }
            }
            
            if (hasRoad) {
                roads.horizontal.push(y); // Store the Y position of the road
            }
        }
        
        // Detect vertical roads
        for (let x = 0; x < this.tilesX - 1; x++) {
            // Check if this column has a vertical road
            let hasRoad = false;
            for (let y = 0; y < this.tilesY; y++) {
                if (tiles[y][x] === this.terrainTypes.ASPHALT && 
                    tiles[y][x+1] === this.terrainTypes.ASPHALT) {
                    hasRoad = true;
                    break;
                }
            }
            
            if (hasRoad) {
                roads.vertical.push(x); // Store the X position of the road
            }
        }
        
        return roads;
    }
    
    /**
     * Generate building blocks along roads in a grid pattern
     * @param {Array} tiles - 2D array of map tiles
     * @param {Object} roads - Object with horizontal and vertical road positions
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _generateRoadSideBlocks(tiles, roads, buildings = []) {
        // Create city blocks at road intersections first
        if (roads.horizontal.length > 0 && roads.vertical.length > 0) {
            // Handle each road intersection to create city blocks
            for (const hRoad of roads.horizontal) {
                for (const vRoad of roads.vertical) {
                    // Create blocks in each of the four quadrants around the intersection
                    
                    // Top left quadrant
                    this._createCityBlock(tiles, vRoad - 12, hRoad - 12, vRoad - 2, hRoad - 2, buildings);
                    
                    // Top right quadrant
                    this._createCityBlock(tiles, vRoad + 3, hRoad - 12, vRoad + 13, hRoad - 2, buildings);
                    
                    // Bottom left quadrant
                    this._createCityBlock(tiles, vRoad - 12, hRoad + 3, vRoad - 2, hRoad + 13, buildings);
                    
                    // Bottom right quadrant
                    this._createCityBlock(tiles, vRoad + 3, hRoad + 3, vRoad + 13, hRoad + 13, buildings);
                }
            }
        }
        
        // If there aren't many intersections, also add buildings along straight road segments
        const totalIntersections = roads.horizontal.length * roads.vertical.length;
        
        if (totalIntersections < 4) {
            // Add buildings along horizontal roads
            for (const roadY of roads.horizontal) {
                // Define a grid of buildings above the road
                if (roadY > 8) {
                    this._createBuildingRow(tiles, 4, roadY - 8, this.tilesX - 4, roadY - 2, buildings);
                }
                
                // Define a grid of buildings below the road
                if (roadY < this.tilesY - 8) {
                    this._createBuildingRow(tiles, 4, roadY + 3, this.tilesX - 4, roadY + 9, buildings);
                }
            }
            
            // Add buildings along vertical roads
            for (const roadX of roads.vertical) {
                // Define a grid of buildings to the left of the road
                if (roadX > 8) {
                    this._createBuildingColumn(tiles, roadX - 8, 4, roadX - 2, this.tilesY - 4, buildings);
                }
                
                // Define a grid of buildings to the right of the road
                if (roadX < this.tilesX - 8) {
                    this._createBuildingColumn(tiles, roadX + 3, 4, roadX + 9, this.tilesY - 4, buildings);
                }
            }
        }
    }
    
    /**
     * Create a city block with buildings arranged in a grid
     * @param {Array} tiles - 2D array of map tiles
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _createCityBlock(tiles, x1, y1, x2, y2, buildings = []) {
        // Ensure valid coordinates
        x1 = Math.max(2, Math.min(x1, this.tilesX - 10));
        y1 = Math.max(2, Math.min(y1, this.tilesY - 10));
        x2 = Math.max(x1 + 6, Math.min(x2, this.tilesX - 2)); // Reduced minimum width from 8 to 6
        y2 = Math.max(y1 + 6, Math.min(y2, this.tilesY - 2)); // Reduced minimum height from 8 to 6
        
        const width = x2 - x1;
        const height = y2 - y1;
        
        // If the area is too small, don't bother
        if (width < 6 || height < 6) return; // Reduced minimum size from 8 to 6
        
        // Check if the entire block area is on dirt (not on water or roads)
        let canPlaceBlock = true;
        for (let y = y1; y <= y2; y++) {
            for (let x = x1; x <= x2; x++) {
                if (x < 0 || y < 0 || x >= this.tilesX || y >= this.tilesY || 
                    tiles[y][x] === this.terrainTypes.WATER || 
                    tiles[y][x] === this.terrainTypes.ASPHALT) {
                    canPlaceBlock = false;
                    break;
                }
            }
            if (!canPlaceBlock) break;
        }
        
        // If we can't place the whole block, try to place individual buildings
        if (!canPlaceBlock) {
            this._tryPlaceRandomBuildingsInArea(tiles, x1, y1, x2, y2, buildings);
            return;
        }
        
        // Divide the block into a grid of buildings with uniform sizes
        const buildingTypes = [
            { width: 4, height: 2 }, // 8 tiles
            { width: 2, height: 4 }, // 8 tiles
            { width: 3, height: 2 }, // 6 tiles
            { width: 2, height: 3 }, // 6 tiles
            { width: 2, height: 2 }  // 4 tiles
        ];
        
        // Divide the block into rows and columns with uniform spacing
        const gap = 1; // Gap between buildings
        let currentY = y1;
        
        while (currentY + 2 <= y2) { // Reduced minimum height from 4 to 2
            let currentX = x1;
            
            while (currentX + 2 <= x2) { // Reduced minimum width from 4 to 2
                // Choose a building type that will fit in the remaining space
                const validTypes = buildingTypes.filter(type => 
                    currentX + type.width <= x2 && 
                    currentY + type.height <= y2
                );
                
                if (validTypes.length > 0) {
                    const buildingType = validTypes[Math.floor(Math.random() * validTypes.length)];
                    
                    // Create the building if it fits
                    if (this._canPlaceBuilding(tiles, currentX, currentY, buildingType.width, buildingType.height)) {
                        this._createStandardBuilding(tiles, currentX, currentY, buildingType.width, buildingType.height, buildings);
                    }
                    
                    // Move to the next position
                    currentX += buildingType.width + gap;
                } else {
                    // No valid building type, so move to next position
                    currentX += 2;
                }
            }
            
            // Move to the next row
            currentY += 3 + gap; // Reduced spacing from 4 to 3
        }
    }
    
    /**
     * Try to place random buildings in an area that couldn't fit a full city block
     * @param {Array} tiles - 2D array of map tiles
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _tryPlaceRandomBuildingsInArea(tiles, x1, y1, x2, y2, buildings = []) {
        const buildingTypes = [
            { width: 2, height: 2 }, // 4 tiles (smallest, most likely to fit)
            { width: 3, height: 2 }, // 6 tiles
            { width: 2, height: 3 }  // 6 tiles
        ];
        
        // Try to place a few buildings in the area
        let attempts = 0;
        const maxAttempts = 5;
        let placedBuildings = 0;
        
        while (attempts < maxAttempts && placedBuildings < 2) {
            attempts++;
            
            // Choose random position within area
            const x = getRandomInt(x1, x2 - 2);
            const y = getRandomInt(y1, y2 - 2);
            
            // Try each building type, starting with smallest
            for (const buildingType of buildingTypes) {
                if (x + buildingType.width <= x2 && y + buildingType.height <= y2) {
                    if (this._canPlaceBuilding(tiles, x, y, buildingType.width, buildingType.height)) {
                        this._createStandardBuilding(tiles, x, y, buildingType.width, buildingType.height, buildings);
                        placedBuildings++;
                        break;
                    }
                }
            }
        }
    }
    
    /**
     * Create a row of buildings along a horizontal line
     * @param {Array} tiles - 2D array of map tiles
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _createBuildingRow(tiles, x1, y1, x2, y2, buildings = []) {
        // Ensure valid coordinates
        x1 = Math.max(2, Math.min(x1, this.tilesX - 6));
        y1 = Math.max(2, Math.min(y1, this.tilesY - 6));
        x2 = Math.max(x1 + 6, Math.min(x2, this.tilesX - 2));
        y2 = Math.max(y1 + 2, Math.min(y2, this.tilesY - 2));
        
        const rowHeight = y2 - y1;
        
        // Possible building types for this row
        const buildingTypes = [];
        
        // Add appropriate building types based on row height
        if (rowHeight >= 4) {
            buildingTypes.push({ width: 2, height: 4 }); // 8 tiles
            buildingTypes.push({ width: 2, height: 3 }); // 6 tiles
        }
        
        if (rowHeight >= 2) {
            buildingTypes.push({ width: 4, height: 2 }); // 8 tiles
            buildingTypes.push({ width: 3, height: 2 }); // 6 tiles
            buildingTypes.push({ width: 2, height: 2 }); // 4 tiles
        }
        
        // If no valid building types, return
        if (buildingTypes.length === 0) return;
        
        // Create buildings along the row with gaps
        let currentX = x1;
        const gap = 1; // Gap between buildings
        
        while (currentX < x2) {
            // Choose a random building type
            const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            
            // Ensure it fits in remaining space
            if (currentX + buildingType.width <= x2) {
                // Try to place the building
                if (this._canPlaceBuilding(tiles, currentX, y1, buildingType.width, buildingType.height)) {
                    this._createStandardBuilding(tiles, currentX, y1, buildingType.width, buildingType.height, buildings);
                }
            }
            
            // Move to next position, with some variation
            currentX += buildingType.width + gap + (Math.random() < 0.3 ? 1 : 0);
        }
    }
    
    /**
     * Create a column of buildings along a vertical line
     * @param {Array} tiles - 2D array of map tiles
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _createBuildingColumn(tiles, x1, y1, x2, y2, buildings = []) {
        // Ensure valid coordinates
        x1 = Math.max(2, Math.min(x1, this.tilesX - 6));
        y1 = Math.max(2, Math.min(y1, this.tilesY - 6));
        x2 = Math.max(x1 + 2, Math.min(x2, this.tilesX - 2));
        y2 = Math.max(y1 + 6, Math.min(y2, this.tilesY - 2));
        
        const columnWidth = x2 - x1;
        
        // Possible building types for this column
        const buildingTypes = [];
        
        // Add appropriate building types based on column width
        if (columnWidth >= 4) {
            buildingTypes.push({ width: 4, height: 2 }); // 8 tiles
            buildingTypes.push({ width: 3, height: 2 }); // 6 tiles
        }
        
        if (columnWidth >= 2) {
            buildingTypes.push({ width: 2, height: 4 }); // 8 tiles
            buildingTypes.push({ width: 2, height: 3 }); // 6 tiles
            buildingTypes.push({ width: 2, height: 2 }); // 4 tiles
        }
        
        // If no valid building types, return
        if (buildingTypes.length === 0) return;
        
        // Create buildings along the column with gaps
        let currentY = y1;
        const gap = 1; // Gap between buildings
        
        while (currentY < y2) {
            // Choose a random building type
            const buildingType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            
            // Ensure it fits in remaining space
            if (currentY + buildingType.height <= y2) {
                // Try to place the building
                if (this._canPlaceBuilding(tiles, x1, currentY, buildingType.width, buildingType.height)) {
                    this._createStandardBuilding(tiles, x1, currentY, buildingType.width, buildingType.height, buildings);
                }
            }
            
            // Move to next position, with some variation
            currentY += buildingType.height + gap + (Math.random() < 0.3 ? 1 : 0);
        }
    }
    
    /**
     * Generate a grid of buildings without roads
     * @param {Array} tiles - 2D array of map tiles
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _generateGridBuildings(tiles, buildings = []) {
        // Create a grid of buildings with uniform gaps between them
        const gridSize = 4; // Reduced size of grid cells from 6 to 4
        const buildingChance = 0.7; // Increased chance from 0.6 to 0.7
        const minBuildings = 10; // Ensure at least this many buildings are placed
        let placedBuildings = 0;
        
        // First pass - try to place buildings in a grid pattern
        for (let gridY = 1; gridY < Math.floor(this.tilesY / gridSize) - 1; gridY++) {
            for (let gridX = 1; gridX < Math.floor(this.tilesX / gridSize) - 1; gridX++) {
                // Determine if we place a building in this grid cell
                if (Math.random() < buildingChance) {
                    const x = gridX * gridSize;
                    const y = gridY * gridSize;
                    
                    // Only use smaller building types to ensure they fit
                    const buildingSizes = [4, 6]; // 4 or 6 tiles only (removed 8)
                    const buildingSize = buildingSizes[Math.floor(Math.random() * buildingSizes.length)];
                    
                    let width, height;
                    if (buildingSize === 4) {
                        width = 2;
                        height = 2;
                    } else { // buildingSize === 6
                        if (Math.random() < 0.5) {
                            width = 3;
                            height = 2;
                        } else {
                            width = 2;
                            height = 3;
                        }
                    }
                    
                    // Try to place the building
                    if (this._canPlaceBuilding(tiles, x, y, width, height)) {
                        this._createStandardBuilding(tiles, x, y, width, height, buildings);
                        placedBuildings++;
                    }
                }
            }
        }
        
        // Second pass - if not enough buildings were placed, add more randomly
        if (placedBuildings < minBuildings) {
            const additionalBuildings = minBuildings - placedBuildings;
            let attempts = 0;
            let successfulPlacements = 0;
            
            while (successfulPlacements < additionalBuildings && attempts < additionalBuildings * 3) {
                attempts++;
                
                // Choose a random position aligned to a 2-tile grid
                const x = Math.floor(Math.random() * (this.tilesX - 4) / 2) * 2 + 2;
                const y = Math.floor(Math.random() * (this.tilesY - 4) / 2) * 2 + 2;
                
                // Try to place a 2x2 building (most likely to fit)
                if (this._canPlaceBuilding(tiles, x, y, 2, 2)) {
                    this._createStandardBuilding(tiles, x, y, 2, 2, buildings);
                    successfulPlacements++;
                }
            }
        }
    }
    
    /**
     * Generate buildings aligned to a grid
     * @param {Array} tiles - 2D array of map tiles
     * @param {number} maxBuildings - Maximum number of buildings to place
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _generateAlignedBuildings(tiles, maxBuildings = 5, buildings = []) {
        const buildingCount = maxBuildings ? maxBuildings : getRandomInt(3, 5);
        
        // Track successfully placed buildings
        let placedBuildings = 0;
        let attempts = 0;
        const maxAttempts = 20;
        
        while (placedBuildings < buildingCount && attempts < maxAttempts) {
            attempts++;
            
            // Get a random building size (4, 6, 8, or 10 tiles)
            const buildingSize = this._getRandomBuildingSize();
            
            let width, height;
            if (buildingSize === 4) {
                width = 2;
                height = 2;
            } else if (buildingSize === 6) {
                if (Math.random() < 0.5) {
                    width = 3;
                    height = 2;
                } else {
                    width = 2;
                    height = 3;
                }
            } else if (buildingSize === 8) { 
                if (Math.random() < 0.5) {
                    width = 4;
                    height = 2;
                } else {
                    width = 2;
                    height = 4;
                }
            } else { // buildingSize === 10
                if (Math.random() < 0.5) {
                    width = 5;
                    height = 2;
                } else {
                    width = 2;
                    height = 5;
                }
            }
            
            // Align to an even grid
            const gridSize = 2;
            const maxGridX = Math.floor((this.tilesX - width) / gridSize);
            const maxGridY = Math.floor((this.tilesY - height) / gridSize);
            
            const gridX = getRandomInt(1, maxGridX - 1);
            const gridY = getRandomInt(1, maxGridY - 1);
            
            const x = gridX * gridSize;
            const y = gridY * gridSize;
            
            // Try to place the building
            if (this._canPlaceBuilding(tiles, x, y, width, height)) {
                this._createStandardBuilding(tiles, x, y, width, height, buildings);
                placedBuildings++;
            }
        }
    }

    /**
     * Get a random building size (4, 6, 8, or 10 tiles)
     * @returns {number} Building size
     * @private
     */
    _getRandomBuildingSize() {
        const sizes = [4, 6, 8, 10];
        return sizes[getRandomInt(0, sizes.length - 1)];
    }

    /**
     * Generate a starting position (always in a corner)
     * @param {Array} tiles - 2D array of map tiles
     * @returns {Object} Starting position object with x, y, tileX, tileY
     * @private
     */
    _generateStartPosition(tiles) {
        // Choose one of the four corners
        const corner = getRandomInt(0, 3);
        let tileX, tileY;
        
        switch (corner) {
            case 0: // Top-left
                tileX = getRandomInt(0, 2);
                tileY = getRandomInt(0, 2);
                break;
            case 1: // Top-right
                tileX = getRandomInt(this.tilesX - 3, this.tilesX - 1);
                tileY = getRandomInt(0, 2);
                break;
            case 2: // Bottom-left
                tileX = getRandomInt(0, 2);
                tileY = getRandomInt(this.tilesY - 3, this.tilesY - 1);
                break;
            case 3: // Bottom-right
                tileX = getRandomInt(this.tilesX - 3, this.tilesX - 1);
                tileY = getRandomInt(this.tilesY - 3, this.tilesY - 1);
                break;
        }
        
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize,
            tileX,
            tileY
        };
    }

    /**
     * Generate a goal position based on mission type
     * @param {Array} tiles - 2D array of map tiles
     * @param {Object} startPos - Starting position
     * @param {string} missionType - Type of mission ('evacuation' or 'delivery')
     * @returns {Object} Goal position object with x, y, tileX, tileY
     * @private
     */
    _generateGoalPosition(tiles, startPos, missionType) {
        let tileX, tileY;
        let attempts = 0;
        const minDistance = Math.floor(Math.max(this.tilesX, this.tilesY) * 0.6); // Ensure goal is far enough from start
        
        // Try to find a suitable position
        do {
            tileX = getRandomInt(2, this.tilesX - 3);
            tileY = getRandomInt(2, this.tilesY - 3);
            attempts++;
            
            // Prevent infinite loop
            if (attempts > 50) {
                tileX = this.tilesX - startPos.tileX - 1;
                tileY = this.tilesY - startPos.tileY - 1;
                // Ensure the fallback position is not in water or wall
                if (tiles[tileY][tileX] === this.terrainTypes.WATER || tiles[tileY][tileX] === this.terrainTypes.WALL) {
                    // Find a nearby non-water, non-wall tile
                    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    for (const [dx, dy] of directions) {
                        const nx = tileX + dx;
                        const ny = tileY + dy;
                        if (nx >= 0 && nx < this.tilesX && ny >= 0 && ny < this.tilesY && 
                            tiles[ny][nx] !== this.terrainTypes.WATER && 
                            tiles[ny][nx] !== this.terrainTypes.WALL) {
                            tileX = nx;
                            tileY = ny;
                            break;
                        }
                    }
                }
                break;
            }
        } while (
            tiles[tileY][tileX] === this.terrainTypes.WALL || 
            tiles[tileY][tileX] === this.terrainTypes.WATER ||
            calculateDistance(tileX, tileY, startPos.tileX, startPos.tileY) < minDistance
        );
        
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize,
            tileX,
            tileY
        };
    }

    /**
     * Clear an area around a point, ensuring no walls but preserving roads and water
     * @param {Array} tiles - 2D array of map tiles
     * @param {number} tileX - X coordinate in tile units
     * @param {number} tileY - Y coordinate in tile units
     * @param {number} radius - Radius of area to clear
     * @private
     */
    _clearArea(tiles, tileX, tileY, radius) {
        for (let y = Math.max(0, tileY - radius); y <= Math.min(this.tilesY - 1, tileY + radius); y++) {
            for (let x = Math.max(0, tileX - radius); x <= Math.min(this.tilesX - 1, tileX + radius); x++) {
                // Only replace wall tiles with dirt, preserve roads and water
                if (tiles[y][x] === this.terrainTypes.WALL) {
                    tiles[y][x] = this.terrainTypes.DIRT;
                }
            }
        }
    }

    /**
     * Ensure a path exists between start and goal, keeping terrain types appropriate
     * @param {Array} tiles - 2D array of map tiles
     * @param {Object} startPos - Starting position
     * @param {Object} goalPos - Goal position
     * @private
     */
    _ensurePath(tiles, startPos, goalPos) {
        // Simple approach: create a corridor along X, then along Y
        const pathX = startPos.tileX < goalPos.tileX ? 
            { start: startPos.tileX, end: goalPos.tileX } : 
            { start: goalPos.tileX, end: startPos.tileX };
            
        const pathY = startPos.tileY < goalPos.tileY ? 
            { start: startPos.tileY, end: goalPos.tileY } : 
            { start: goalPos.tileY, end: startPos.tileY };
        
        // Create path along X, without overwriting existing asphalt roads
        for (let x = pathX.start; x <= pathX.end; x++) {
            if (tiles[startPos.tileY][x] === this.terrainTypes.WALL) {
                // Clear walls, but don't change asphalt to dirt or vice versa
                // This ensures we only modify impassable terrain
                tiles[startPos.tileY][x] = this.terrainTypes.DIRT;
            }
        }
        
        // Create path along Y, without overwriting existing asphalt roads
        for (let y = pathY.start; y <= pathY.end; y++) {
            if (tiles[y][goalPos.tileX] === this.terrainTypes.WALL) {
                // Clear walls, but don't change asphalt to dirt or vice versa
                // This ensures we only modify impassable terrain
                tiles[y][goalPos.tileX] = this.terrainTypes.DIRT;
            }
        }
    }

    /**
     * Place random mines on the map
     * @param {Array} tiles - 2D array of map tiles
     * @param {Object} startPos - Starting position
     * @param {Object} goalPos - Goal position
     * @returns {Array} Array of mine positions
     * @private
     */
    _placeMines(tiles, startPos, goalPos) {
        const mineCount = getRandomInt(1, 2);
        const mines = [];
        const safeRadius = 3; // Safe distance from start and goal
        
        for (let i = 0; i < mineCount; i++) {
            let tileX, tileY;
            let attempts = 0;
            
            // Try to find a suitable position
            do {
                tileX = getRandomInt(1, this.tilesX - 2);
                tileY = getRandomInt(1, this.tilesY - 2);
                attempts++;
                
                // Prevent infinite loop
                if (attempts > 50) break;
            } while (
                // Only place mines on dry surfaces (dirt or asphalt)
                tiles[tileY][tileX] === this.terrainTypes.WALL ||
                tiles[tileY][tileX] === this.terrainTypes.WATER ||
                calculateDistance(tileX, tileY, startPos.tileX, startPos.tileY) < safeRadius ||
                calculateDistance(tileX, tileY, goalPos.tileX, goalPos.tileY) < safeRadius
            );
            
            if (attempts <= 50) {
                // Double-check that we're only placing on dry surfaces
                if (tiles[tileY][tileX] === this.terrainTypes.DIRT || 
                    tiles[tileY][tileX] === this.terrainTypes.ASPHALT) {
                    // Store the original terrain type with the mine information
                    const originalTerrain = tiles[tileY][tileX];
                    console.log(`Placing mine at [${tileX},${tileY}] - Original terrain: ${originalTerrain}`, 
                               originalTerrain === this.terrainTypes.DIRT ? "DIRT" : "ASPHALT");
                    
                    // Mark the tile as a mine
                    tiles[tileY][tileX] = this.terrainTypes.MINE;
                    
                    // Add to mines array with original terrain information
                    mines.push({
                        x: tileX * this.tileSize,
                        y: tileY * this.tileSize,
                        tileX,
                        tileY,
                        originalTerrain // Store the original terrain type
                    });
                }
            }
        }
        
        console.log(`Placed ${mines.length} mines with original terrain information`);
        return mines;
    }

    /**
     * Check if a building can be placed at the specified location
     * @param {Array} tiles - 2D array of map tiles
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Building width
     * @param {number} height - Building height
     * @returns {boolean} Whether the building can be placed
     * @private
     */
    _canPlaceBuilding(tiles, x, y, width, height) {
        // Validate parameters
        if (width < 1 || height < 1) return false;
        
        // Check bounds
        if (x < 0 || y < 0 || x + width > this.tilesX || y + height > this.tilesY) {
            return false;
        }
        
        // Check if the area is available (only place on dirt, avoid water, walls, roads and mines)
        for (let cy = y; cy < y + height; cy++) {
            for (let cx = x; cx < x + width; cx++) {
                // Only allow building on dirt tiles, not on existing roads, water, walls or mines
                if (tiles[cy][cx] !== this.terrainTypes.DIRT) {
                    return false;
                }
            }
        }
        
        // Increase buffer zone around buildings for more spacing
        const buffer = 2; // Increased from 1 to 2 for more space between buildings
        
        // Check the extended buffer area for other buildings or roads
        for (let cy = Math.max(0, y - buffer); cy < Math.min(this.tilesY, y + height + buffer); cy++) {
            for (let cx = Math.max(0, x - buffer); cx < Math.min(this.tilesX, x + width + buffer); cx++) {
                // Skip checking the actual building tiles, only check the buffer
                if (cx >= x && cx < x + width && cy >= y && cy < y + height) continue;
                
                // If we find a road or another building in the buffer zone, don't place the building
                if (cy >= 0 && cy < this.tilesY && cx >= 0 && cx < this.tilesX) {
                    if (tiles[cy][cx] === this.terrainTypes.ASPHALT || tiles[cy][cx] === this.terrainTypes.WALL) {
                        // Special case: Allow adjacent to roads if properly aligned
                        if (tiles[cy][cx] === this.terrainTypes.ASPHALT) {
                            // Allow adjacent to roads only if the building is aligned with the road
                            // (aligned horizontally or vertically)
                            const isHorizontallyAligned = 
                                (cy === y - 1 && cy + 1 < this.tilesY && tiles[cy + 1][cx] === this.terrainTypes.ASPHALT) || 
                                (cy === y + height && cy - 1 >= 0 && tiles[cy - 1][cx] === this.terrainTypes.ASPHALT);
                            
                            const isVerticallyAligned = 
                                (cx === x - 1 && cx + 1 < this.tilesX && tiles[cy][cx + 1] === this.terrainTypes.ASPHALT) || 
                                (cx === x + width && cx - 1 >= 0 && tiles[cy][cx - 1] === this.terrainTypes.ASPHALT);
                            
                            // If the building is properly aligned with the road, allow it
                            if (isHorizontallyAligned || isVerticallyAligned) {
                                continue;
                            }
                        }
                        
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * Create a standard sized building at the specified location
     * @param {Array} tiles - 2D array of map tiles
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Building width
     * @param {number} height - Building height
     * @param {Array} buildings - Array to store building data
     * @private
     */
    _createStandardBuilding(tiles, x, y, width, height, buildings = []) {
        // Calculate total tiles
        const totalTiles = width * height;
        
        // Ensure we're creating a building of the correct size (4, 6, 8, or 10 tiles)
        if (totalTiles !== 4 && totalTiles !== 6 && totalTiles !== 8 && totalTiles !== 10) {
            console.warn("Attempted to create a building of non-standard size:", totalTiles);
            return;
        }
        
        // Determine building type and shape
        let buildingType = "";
        let shape = "";
        
        // For 4-tile buildings (2x2), create a solid or hollow square
        if (totalTiles === 4) {
            const isHollow = Math.random() < 0.3;
            buildingType = "building_small";
            shape = isHollow ? "hollow" : "solid";
            
            for (let dy = 0; dy < height; dy++) {
                for (let dx = 0; dx < width; dx++) {
                    // If hollow, only place walls on the edges
                    if (!isHollow || dy === 0 || dy === height - 1 || dx === 0 || dx === width - 1) {
                        tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                    }
                }
            }
        } 
        // For 6-tile buildings (2x3 or 3x2), create a solid rectangle or an L-shape
        else if (totalTiles === 6) {
            const buildingStyle = Math.random() < 0.6 ? 0 : 1; // 0=rectangle, 1=L-shape
            buildingType = "building_medium";
            shape = buildingStyle === 0 ? "rectangle" : "L-shape";
            
            if (buildingStyle === 0 || (width < 3 && height < 3)) {
                // Rectangle
                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                    }
                }
            } else {
                // L-shape (for 3x2 or 2x3 buildings)
                if (width === 3) {
                    // L-shape from 3x2
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            // Skip one corner to make an L
                            if (!(dy === 0 && dx === 2)) {
                                tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                            }
                        }
                    }
                } else {
                    // L-shape from 2x3
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            // Skip one corner to make an L
                            if (!(dy === 2 && dx === 1)) {
                                tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                            }
                        }
                    }
                }
            }
        } 
        // For 8-tile buildings (4x2 or 2x4), create a rectangle, hollow rectangle, or special shape
        else if (totalTiles === 8) {
            const buildingStyle = getRandomInt(0, 2); // 0=solid, 1=hollow, 2=special
            buildingType = "building_large";
            
            if (buildingStyle === 0) {
                // Solid rectangle
                shape = "solid";
                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                    }
                }
            } else if (buildingStyle === 1) {
                // Hollow rectangle
                shape = "hollow";
                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        // Only place walls on the edges
                        if (dy === 0 || dy === height - 1 || dx === 0 || dx === width - 1) {
                            tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                        }
                    }
                }
            } else {
                // Special U-shape or H-shape
                if (width === 4) {
                    // Create a U-shape from a 4x2
                    shape = "U-shape";
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            // Skip middle top to make a U
                            if (!(dy === 0 && (dx === 1 || dx === 2))) {
                                tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                            }
                        }
                    }
                } else {
                    // Create an H-shape from a 2x4
                    shape = "H-shape";
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            // Skip middle areas to make an H
                            if (dx === 0 || dx === width - 1 || dy === Math.floor(height / 2)) {
                                tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                            }
                        }
                    }
                }
            }
        }
        // For 10-tile buildings (2x5, 5x2), create more complex shapes
        else if (totalTiles === 10) {
            const buildingStyle = getRandomInt(0, 3); // 0=E-shape, 1=C-shape, 2=plus-shape, 3=hollow rectangle
            buildingType = "building_xlarge";
            
            if (buildingStyle === 0) {
                // E-shape building
                shape = "E-shape";
                if (width === 5) {
                    // Horizontal E-shape (5x2)
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            // Create E-shape by having walls on edges and in middle
                            if (dx === 0 || dy === 0 || dy === height - 1 || 
                                (dy === Math.floor(height / 2) && dx < 3)) {
                                tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                            }
                        }
                    }
                } else {
                    // Vertical E-shape (2x5)
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            // Create E-shape by having walls on edges and in middle
                            if (dy === 0 || dx === 0 || dx === width - 1 || 
                                (dx === Math.floor(width / 2) && dy < 3)) {
                                tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                            }
                        }
                    }
                }
            } else if (buildingStyle === 1) {
                // C-shape building
                shape = "C-shape";
                if (width === 5) {
                    // Horizontal C-shape (5x2)
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            // Create C-shape
                            if (dx === 0 || dy === 0 || dy === height - 1) {
                                tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                            }
                        }
                    }
                } else {
                    // Vertical C-shape (2x5)
                    for (let dy = 0; dy < height; dy++) {
                        for (let dx = 0; dx < width; dx++) {
                            // Create C-shape
                            if (dy === 0 || dx === 0 || dx === width - 1) {
                                tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                            }
                        }
                    }
                }
            } else if (buildingStyle === 2) {
                // Plus-shape building
                shape = "plus-shape";
                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        // Create plus shape by having walls in cross pattern
                        if (dx === Math.floor(width / 2) || dy === Math.floor(height / 2)) {
                            tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                        }
                    }
                }
            } else {
                // Hollow rectangle
                shape = "hollow";
                for (let dy = 0; dy < height; dy++) {
                    for (let dx = 0; dx < width; dx++) {
                        // Only place walls on the edges
                        if (dy === 0 || dy === height - 1 || dx === 0 || dx === width - 1) {
                            tiles[y + dy][x + dx] = this.terrainTypes.WALL;
                        }
                    }
                }
            }
        }
        
        // Store building data
        buildings.push({
            x: x * this.tileSize,
            y: y * this.tileSize,
            width: width * this.tileSize,
            height: height * this.tileSize,
            type: buildingType,
            shape: shape,
            size: totalTiles
        });
    }

    /**
     * Helper method to get terrain type at pixel coordinates
     * @param {Object} map - The map object
     * @param {number} x - X coordinate in pixels
     * @param {number} y - Y coordinate in pixels
     * @returns {number} Terrain type at the specified position
     */
    static getTerrainAtPosition(map, x, y) {
        const tileX = Math.floor(x / map.tileSize);
        const tileY = Math.floor(y / map.tileSize);
        
        // Check bounds
        if (tileX < 0 || tileX >= map.tiles[0].length || tileY < 0 || tileY >= map.tiles.length) {
            return null;
        }
        
        return map.tiles[tileY][tileX];
    }
} 