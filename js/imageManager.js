/**
 * ImageManager class
 * Handles loading and managing images in the game with graceful fallback
 */
class ImageManager {
    constructor() {
        this.images = {};
        this.imagesEnabled = true; // Flag to enable/disable images
        
        // Try to detect if images are supported
        try {
            const img = new Image();
            this.imagesEnabled = (img && typeof img.complete === 'boolean');
        } catch (e) {
            console.warn('Images might not be fully supported in this browser');
            this.imagesEnabled = false;
        }
    }

    /**
     * Load an image file
     * @param {string} imageId - Identifier for the image
     * @param {string} filePath - Path to the image file
     * @returns {Promise} - Promise that resolves when the image is loaded, even if loading fails
     */
    load(imageId, filePath) {
        // If images are disabled, resolve immediately with a dummy object
        if (!this.imagesEnabled) {
            console.log(`Images disabled, skipping load for ${imageId}`);
            
            // Mark this image as failed to load (null)
            this.images[imageId] = null;
            return Promise.resolve(null);
        }
        
        return new Promise((resolve) => {
            const img = new Image();
            
            // Handle successful load
            img.addEventListener('load', () => {
                this.images[imageId] = img;
                resolve(img);
            }, { once: true });
            
            // Handle load error - but don't reject the promise
            img.addEventListener('error', (error) => {
                console.warn(`Error loading image ${imageId} from ${filePath}:`, error);
                
                // Mark this image as failed to load (null)
                this.images[imageId] = null;
                resolve(null);
            }, { once: true });
            
            // Set a timeout in case the file doesn't load or error event doesn't fire
            setTimeout(() => {
                if (!this.images[imageId]) {
                    console.warn(`Timeout loading image ${imageId} from ${filePath}`);
                    
                    // Mark this image as failed to load (null)
                    this.images[imageId] = null;
                    resolve(null);
                }
            }, 3000); // 3 second timeout
            
            // Start loading the image
            img.src = filePath;
        });
    }

    /**
     * Get an image by its ID
     * @param {string} imageId - The ID of the image to retrieve
     * @returns {Image|null} - The image object or null if not loaded
     */
    getImage(imageId) {
        return this.images[imageId] || null;
    }

    /**
     * Check if an image exists and is loaded
     * @param {string} imageId - The ID of the image to check
     * @returns {boolean} - Whether the image exists and is loaded
     */
    hasImage(imageId) {
        return !!this.images[imageId]; // Convert to boolean; null becomes false
    }

    /**
     * Preload all game image assets
     * @returns {Promise} - Promise that resolves when all assets are loaded
     */
    preloadImages() {
        // Define all images to preload
        const imageAssets = [
            { id: 'tile_asphalt_horizontal', path: 'assets/images/tiles/asphalt_horizontal.png' },
            { id: 'tile_asphalt_vertical', path: 'assets/images/tiles/asphalt_vertical.png' },
            { id: 'tile_asphalt_intersection', path: 'assets/images/tiles/asphalt_intersection.png' },
            { id: 'tile_dirt', path: 'assets/images/tiles/dirt.png' },
            { id: 'tile_water', path: 'assets/images/tiles/water.png' },
            { id: 'tile_wall', path: 'assets/images/tiles/wall.png' },
            { id: 'tile_mine', path: 'assets/images/tiles/mine.png' },
            
            // Building textures for different building types
            { id: 'building_small', path: 'assets/images/tiles/building_small.png' },
            { id: 'building_medium', path: 'assets/images/tiles/building_medium.png' },
            { id: 'building_large', path: 'assets/images/tiles/building_large.png' },
            { id: 'building_xlarge', path: 'assets/images/tiles/building_xlarge.png' },
            
            // Player platform texture
            { id: 'player_platform', path: 'assets/images/platform.png' },
            
            // QR code for donation
            { id: 'qr_code', path: 'assets/images/qr.png' }
        ];
        
        console.log(`Preloading ${imageAssets.length} images...`);
        
        // Create load promises for all assets
        const loadPromises = imageAssets.map(asset => {
            return this.load(asset.id, asset.path);
        });
        
        // Return a promise that resolves when all assets are loaded (or failed)
        return Promise.all(loadPromises)
            .then(() => {
                // Count how many images loaded successfully
                const loadedCount = Object.values(this.images).filter(img => img !== null).length;
                console.log(`Image loading complete. ${loadedCount}/${imageAssets.length} images loaded successfully.`);
                return loadedCount;
            })
            .catch(error => {
                console.warn('Error during image preloading:', error);
                return 0; // Return 0 loaded images
            });
    }
}