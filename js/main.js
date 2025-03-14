/**
 * Main entry point for the game
 * Initializes the game when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get the canvas element
    const canvas = document.getElementById('game-canvas');
    
    // Make sure canvas exists
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    // Create directories for assets
    createAssetDirectories();
    
    // Create placeholder audio files
    createPlaceholderAudioFiles();
    
    // Initialize the game
    const game = new Game(canvas);
    
    console.log('Game initialized successfully!');
    
    // For mobile: try to hide address bar
    hideAddressBar();
    
    // Listen for orientation changes and resize events
    window.addEventListener('orientationchange', () => {
        setTimeout(hideAddressBar, 100);
        resizeGameForMobile(game);
    });
    
    window.addEventListener('resize', () => {
        hideAddressBar();
        resizeGameForMobile(game);
    });
    
    // Initial resize for mobile
    resizeGameForMobile(game);
});

/**
 * Attempt to hide the browser address bar
 */
function hideAddressBar() {
    // iOS Safari and some other mobile browsers
    if (typeof window.scrollTo === 'function') {
        // We need a slight delay for this to work reliably
        setTimeout(() => {
            // Scroll to hide address bar
            window.scrollTo(0, 1);
            
            // For some browsers, a second scroll might be needed
            setTimeout(() => window.scrollTo(0, 0), 50);
        }, 300);
    }
}

/**
 * Resize game for mobile devices
 * @param {Game} game - Game instance
 */
function resizeGameForMobile(game) {
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 900;
    
    if (isMobile) {
        const gameContainer = document.getElementById('game-container');
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // In landscape, we want the game to fill the screen width
            // Calculate dimensions based on the original aspect ratio
            const aspectRatio = 800 / 600; // Original width / height
            
            // Set the container width to screen width
            gameContainer.style.width = '100%';
            
            // Adjust the HUD height based on screen size
            const hudHeight = window.innerHeight <= 400 ? 25 : 30;
            document.getElementById('hud').style.height = `${hudHeight}px`;
            
            // Update game canvas position
            game.canvas.style.top = `${hudHeight}px`;
            game.canvas.style.height = `calc(100% - ${hudHeight}px)`;
            
            // Also update mobile controls position
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls) {
                mobileControls.style.top = `${hudHeight}px`;
                mobileControls.style.height = `calc(100% - ${hudHeight}px)`;
            }
        }
    }
}

/**
 * Create asset directories
 */
function createAssetDirectories() {
    // This function would normally create directories in a real project
    // In a web context, this is just a placeholder
    console.log('Creating asset directories (placeholder)');
    
    // In a real project, you might do something like:
    // fs.mkdirSync('assets/audio', { recursive: true });
}

/**
 * Create placeholder audio files
 */
function createPlaceholderAudioFiles() {
    // This function would normally create placeholder audio files in a real project
    // In a web context, this is just a placeholder
    console.log('Creating placeholder audio files (placeholder)');
    
    // List of audio files that would be needed in a real project:
    const audioFiles = [
        'assets/audio/menu_music.mp3',
        'assets/audio/platform_move.mp3',
        'assets/audio/drone_hum.mp3',
        'assets/audio/reb_activate.mp3',
        'assets/audio/drone_destroyed.mp3',
        'assets/audio/mission_complete.mp3'
    ];
    
    // Log the audio files that would be created
    audioFiles.forEach(file => {
        console.log(`Would create: ${file}`);
    });
} 