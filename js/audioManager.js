/**
 * AudioManager class
 * Handles loading and playing all audio in the game
 */
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.loopingSounds = {};
        this.currentMusic = null;
        this.muted = false;
        this.volume = 0.7;
        this.audioEnabled = true; // Flag to enable/disable audio
        
        // Special handling for drone hum - we'll create a dedicated instance
        this.droneHumTemplate = null;
        
        // Flag to track if menu music has been played
        this.menuMusicPlayed = false;
        
        // Try to detect if audio is supported
        try {
            const audio = new Audio();
            this.audioEnabled = (audio && typeof audio.canPlayType === 'function');
        } catch (e) {
            console.warn('Audio might not be fully supported in this browser');
            this.audioEnabled = false;
        }
    }

    /**
     * Load a sound file
     * @param {string} soundId - Identifier for the sound
     * @param {string} filePath - Path to the sound file
     * @returns {Promise} - Promise that resolves when the sound is loaded, even if loading fails
     */
    load(soundId, filePath) {
        // If audio is disabled, resolve immediately with a dummy object
        if (!this.audioEnabled) {
            console.log(`Audio disabled, skipping load for ${soundId}`);
            
            // Create a dummy audio object that does nothing
            const dummyAudio = {
                play: () => Promise.resolve(),
                pause: () => {},
                volume: 0,
                currentTime: 0,
                cloneNode: () => dummyAudio,
                muted: true,
                loop: false
            };
            
            // Store the dummy object
            if (soundId.startsWith('music_')) {
                this.music[soundId] = dummyAudio;
            } else {
                this.sounds[soundId] = dummyAudio;
            }
            
            return Promise.resolve(dummyAudio);
        }
        
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = filePath;
            
            // Handle successful load
            audio.addEventListener('canplaythrough', () => {
                if (soundId.startsWith('music_')) {
                    this.music[soundId] = audio;
                    // Only set loop to true for non-menu music
                    audio.loop = soundId !== 'music_menu';
                } else {
                    this.sounds[soundId] = audio;
                    
                    // Special handling for drone hum sound
                    if (soundId === 'sfx_drone_hum') {
                        this.droneHumTemplate = audio;
                    }
                }
                audio.volume = this.volume;
                resolve(audio);
            }, { once: true });
            
            // Handle load error - but don't reject the promise
            audio.addEventListener('error', (error) => {
                console.warn(`Error loading audio ${soundId} from ${filePath}:`, error);
                
                // Create a dummy audio object that does nothing
                const dummyAudio = {
                    play: () => Promise.resolve(),
                    pause: () => {},
                    volume: 0,
                    currentTime: 0,
                    cloneNode: () => dummyAudio,
                    muted: true,
                    loop: false
                };
                
                // Store the dummy object so calls to play this sound won't error
                if (soundId.startsWith('music_')) {
                    this.music[soundId] = dummyAudio;
                } else {
                    this.sounds[soundId] = dummyAudio;
                }
                
                resolve(dummyAudio);
            }, { once: true });
            
            // Start loading the audio
            audio.load();
            
            // Set a timeout in case the file doesn't load or error event doesn't fire
            setTimeout(() => {
                if (!this.sounds[soundId] && !this.music[soundId]) {
                    console.warn(`Timeout loading audio ${soundId} from ${filePath}`);
                    
                    // Create dummy audio as above
                    const dummyAudio = {
                        play: () => Promise.resolve(),
                        pause: () => {},
                        volume: 0,
                        currentTime: 0,
                        cloneNode: () => dummyAudio,
                        muted: true,
                        loop: false
                    };
                    
                    // Store the dummy
                    if (soundId.startsWith('music_')) {
                        this.music[soundId] = dummyAudio;
                    } else {
                        this.sounds[soundId] = dummyAudio;
                    }
                    
                    resolve(dummyAudio);
                }
            }, 3000); // 3 second timeout
        });
    }

    /**
     * Create a fresh drone hum sound instance
     * @param {string} uniqueId - Unique identifier for this drone hum instance
     * @param {boolean} loop - Whether to loop the sound
     * @returns {HTMLAudioElement|null} - The sound object or null if failed
     */
    createDroneHumSound(uniqueId, loop = true) {
        if (!this.audioEnabled || this.muted || !this.droneHumTemplate) return null;
        
        try {
            // Create a completely fresh Audio element
            const sound = new Audio();
            sound.src = this.droneHumTemplate.src;
            sound.loop = loop;
            sound.volume = Math.min(this.volume * 1.5, 1.0); // Higher volume but max 1.0
            
            // Add a handler for debugging
            sound.addEventListener('ended', () => {
                console.log(`Drone hum sound ${uniqueId} ended naturally (should loop: ${loop})`);
            });
            
            // Store in our tracking object
            this.loopingSounds[uniqueId] = sound;
            
            // Start playing
            sound.play().catch(error => console.warn(`Error playing drone hum ${uniqueId}:`, error));
            
            return sound;
        } catch (e) {
            console.warn(`Error creating drone hum sound:`, e);
            return null;
        }
    }

    /**
     * Play a sound effect
     * @param {string} soundId - Identifier for the sound to play
     * @param {boolean} loop - Whether the sound should loop (default: false)
     * @returns {HTMLAudioElement|null} - The sound object or null if there was an error
     */
    playSfx(soundId, loop = false) {
        // Special case for drone hum sounds
        if (soundId.startsWith('sfx_drone_hum_')) {
            return this.createDroneHumSound(soundId, loop);
        }
        
        // Handle standard sound effects
        let actualSoundId = soundId.startsWith('sfx_') ? soundId : `sfx_${soundId}`;
        let baseSound = this.sounds[actualSoundId];
        
        if (!this.audioEnabled || this.muted || !baseSound) return null;
        
        try {
            // Create a clone to allow multiple instances of the same sound
            const sound = baseSound.cloneNode();
            
            // Set volume
            sound.volume = this.volume;
            
            // Set loop property
            sound.loop = loop;
            
            // Play the sound
            let playPromise = sound.play();
            if (playPromise) {
                playPromise.catch(error => console.warn(`Error playing ${soundId}:`, error));
            }
            
            // If this is a looping sound, store a reference to it
            if (loop) {
                this.loopingSounds = this.loopingSounds || {};
                this.loopingSounds[actualSoundId] = sound;
            }
            
            return sound; // Return the sound object for potential reference
        } catch (e) {
            console.warn(`Error playing sound ${soundId}:`, e);
            return null;
        }
    }

    /**
     * Play background music
     * @param {string} musicId - Identifier for the music to play
     */
    playMusic(musicId) {
        if (!this.audioEnabled) return;
        
        const fullMusicId = `music_${musicId}`;
        if (this.muted || !this.music[fullMusicId]) return;
        
        try {
            // Stop current music if playing
            if (this.currentMusic) {
                this.stopMusic();
            }
            
            const music = this.music[fullMusicId];
            music.currentTime = 0;
            music.volume = this.volume * 0.5; // Music a bit quieter than SFX
            
            // Set loop property based on music type
            if (musicId === 'menu') {
                music.loop = false; // Menu music should not loop
            } else {
                music.loop = true; // Other music can loop
            }
            
            music.play().catch(error => console.warn(`Error playing music ${musicId}:`, error));
            this.currentMusic = fullMusicId;
        } catch (e) {
            console.warn(`Error playing music ${musicId}:`, e);
        }
    }

    /**
     * Stop the currently playing music
     */
    stopMusic() {
        if (!this.audioEnabled) return;
        
        try {
            if (this.currentMusic && this.music[this.currentMusic]) {
                this.music[this.currentMusic].pause();
                this.music[this.currentMusic].currentTime = 0;
                this.currentMusic = null;
            }
        } catch (e) {
            console.warn('Error stopping music:', e);
        }
    }

    /**
     * Toggle mute state
     * @returns {boolean} - New mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        
        if (!this.audioEnabled) return this.muted;
        
        try {
            // Mute/unmute all sounds
            Object.values(this.sounds).forEach(sound => {
                sound.muted = this.muted;
            });
            
            // Mute/unmute all music
            Object.values(this.music).forEach(music => {
                music.muted = this.muted;
            });
            
            // Mute/unmute all looping sounds
            if (this.loopingSounds) {
                Object.values(this.loopingSounds).forEach(sound => {
                    if (sound) sound.muted = this.muted;
                });
            }
        } catch (e) {
            console.warn('Error toggling mute:', e);
        }
        
        return this.muted;
    }

    /**
     * Set the volume for all audio
     * @param {number} value - Volume level (0.0 to 1.0)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        
        if (!this.audioEnabled) return;
        
        try {
            // Update volume for all sounds
            Object.values(this.sounds).forEach(sound => {
                sound.volume = this.volume;
            });
            
            // Update volume for all music (slightly lower)
            Object.values(this.music).forEach(music => {
                music.volume = this.volume * 0.5;
            });
            
            // Update volume for all looping sounds
            if (this.loopingSounds) {
                Object.values(this.loopingSounds).forEach(sound => {
                    if (sound && sound.volume !== undefined) {
                        // Special handling for drone hum sounds (higher volume)
                        if (sound.src && sound.src.includes('drone_hum')) {
                            sound.volume = Math.min(this.volume * 1.5, 1.0);
                        } else {
                            sound.volume = this.volume;
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('Error setting volume:', e);
        }
    }

    /**
     * Preload all game audio assets
     * @returns {Promise} - Promise that resolves when all assets are loaded
     */
    preloadAudio() {
        // If we want just one music file for testing, uncomment this
        // and comment out the full list below
        /*
        const audioAssets = [
            { id: 'music_menu', path: 'assets/audio/menu_music.mp3' }
        ];
        */
        
        const audioAssets = [
            { id: 'music_menu', path: 'assets/audio/menu_music.mp3' },
            { id: 'sfx_platform_move', path: 'assets/audio/platform_move.mp3' },
            { id: 'sfx_drone_hum', path: 'assets/audio/drone_hum.mp3' },
            { id: 'sfx_reb_activate', path: 'assets/audio/reb_activate.mp3' },
            { id: 'sfx_drone_destroyed', path: 'assets/audio/drone_destroyed.mp3' },
            { id: 'sfx_explosion', path: 'assets/audio/explosion.mp3' },
            { id: 'sfx_mission_complete', path: 'assets/audio/mission_complete.mp3' }
        ];

        console.log("Loading audio assets:", audioAssets.map(a => a.id).join(", "));
        
        // We'll use Promise.all, but the individual promises never reject
        // so this Promise.all will always resolve, even if some audio fails to load
        const loadPromises = audioAssets.map(asset => this.load(asset.id, asset.path));
        return Promise.all(loadPromises).then(() => {
            console.log("Audio assets loaded (or placeholders created)");
        });
    }

    /**
     * Stop a specific sound effect
     * @param {string} soundId - Identifier for the sound to stop
     */
    stopSfx(soundId) {
        if (!this.audioEnabled) return;
        
        try {
            // Special handling for drone hum sounds
            if (soundId.startsWith('sfx_drone_hum_')) {
                const sound = this.loopingSounds[soundId];
                if (sound) {
                    // Be aggressive with stopping
                    sound.loop = false;
                    sound.pause();
                    sound.currentTime = 0;
                    
                    // Remove the sound from our tracking
                    delete this.loopingSounds[soundId];
                    console.log(`Stopped drone hum: ${soundId}`);
                }
                return;
            }
            
            // Standard sound handling
            const actualSoundId = soundId.startsWith('sfx_') ? soundId : `sfx_${soundId}`;
            
            // If this is a looping sound and we have a reference to it
            if (this.loopingSounds && this.loopingSounds[actualSoundId]) {
                console.log(`Stopping sound: ${actualSoundId}`);
                
                // More aggressively stop the sound
                try {
                    const sound = this.loopingSounds[actualSoundId];
                    sound.loop = false; // Make sure loop is off
                    sound.pause();
                    sound.currentTime = 0;
                } catch (e) {
                    console.warn(`Error stopping looping sound: ${e}`);
                }
                
                // Remove from tracking object
                delete this.loopingSounds[actualSoundId];
                return;
            }
            
            // Otherwise, just try to stop the original sound
            if (this.sounds[actualSoundId]) {
                this.sounds[actualSoundId].pause();
                this.sounds[actualSoundId].currentTime = 0;
            }
        } catch (e) {
            console.warn(`Error stopping sound ${soundId}:`, e);
        }
    }

    /**
     * Stop all sound effects, particularly useful for game over
     */
    stopAllSfx() {
        if (!this.audioEnabled) return;
        
        try {
            // Stop all looping sounds
            if (this.loopingSounds) {
                Object.keys(this.loopingSounds).forEach(soundId => {
                    try {
                        const sound = this.loopingSounds[soundId];
                        sound.loop = false; // Make sure loop is off
                        sound.pause();
                        sound.currentTime = 0;
                    } catch (e) {
                        console.warn(`Error stopping looping sound ${soundId}:`, e);
                    }
                });
                // Clear the looping sounds object
                this.loopingSounds = {};
            }
            
            // Also try to stop all regular sound effects
            Object.keys(this.sounds).forEach(soundId => {
                if (soundId.startsWith('sfx_')) {
                    try {
                        const sound = this.sounds[soundId];
                        sound.pause();
                        if (sound.currentTime) {
                            sound.currentTime = 0;
                        }
                    } catch (e) {
                        // Ignore errors on regular sounds
                    }
                }
            });
            
            console.log("All sound effects stopped");
        } catch (e) {
            console.warn('Error stopping all sound effects:', e);
        }
    }
} 