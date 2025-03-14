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
    // Instead of scaling via CSS, use the game's internal resize method
    if (game && typeof game.handleResize === 'function') {
        game.handleResize();
    }
    
    // Update the mobile controls position to match the new canvas
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        // Determine HUD height based on screen size and device
        let hudHeight = window.innerHeight <= 400 ? 25 : 30;
        
        // Account for iOS notches and safe areas
        if (document.body.classList.contains('ios-device')) {
            const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0');
            if (safeAreaTop > 0) {
                hudHeight += safeAreaTop;
            }
        }
        
        // Apply the calculated height
        mobileControls.style.top = `${hudHeight}px`;
        mobileControls.style.height = `calc(100% - ${hudHeight}px)`;
        
        // Adjust D-pad and REB button positions for different screen sizes
        const dpadContainer = document.getElementById('dpad-container');
        const rebButton = document.getElementById('reb-button');
        
        if (dpadContainer && rebButton) {
            // For larger phones (Pro/Max/XL models), increase size and adjust position
            if (window.innerWidth >= 428 || window.innerHeight >= 926) {
                dpadContainer.style.width = '180px';
                dpadContainer.style.height = '180px';
                rebButton.style.width = '100px';
                rebButton.style.height = '100px';
            } else {
                // Reset to default sizes for smaller phones
                dpadContainer.style.width = '150px';
                dpadContainer.style.height = '150px';
                rebButton.style.width = '80px';
                rebButton.style.height = '80px';
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