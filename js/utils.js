/**
 * Utility functions for the game
 */

// Check if two objects collide (simple rectangle collision)
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// Calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random position on the map edge
function getRandomEdgePosition(mapWidth, mapHeight, tileSize) {
    const edge = getRandomInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left
    let x, y;
    
    switch (edge) {
        case 0: // top
            x = getRandomInt(0, mapWidth / tileSize - 1) * tileSize;
            y = 0;
            break;
        case 1: // right
            x = mapWidth - tileSize;
            y = getRandomInt(0, mapHeight / tileSize - 1) * tileSize;
            break;
        case 2: // bottom
            x = getRandomInt(0, mapWidth / tileSize - 1) * tileSize;
            y = mapHeight - tileSize;
            break;
        case 3: // left
            x = 0;
            y = getRandomInt(0, mapHeight / tileSize - 1) * tileSize;
            break;
    }
    
    return { x, y, edge };
}

// Save data to localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

// Load data from localStorage
function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

// Format time in seconds to MM:SS format
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Ease the movement of objects for smoother animations
function lerp(start, end, factor) {
    return start * (1 - factor) + end * factor;
}

// Shuffle an array randomly (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
} 