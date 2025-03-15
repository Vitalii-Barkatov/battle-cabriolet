/**
 * UI class
 * Responsible for rendering on-screen elements and handling UI interactions
 */
class UI {
    constructor(audioManager, imageManager) {
        this.audioManager = audioManager;
        this.imageManager = imageManager;  // Store image manager from initialization
        this.score = 0;
        this.bestScore = loadFromLocalStorage('bestScore', 0);
        
        // Create leaderboard manager
        this.leaderboardManager = new LeaderboardManager();
        
        // UI state flags
        this.shouldStart = false;
        this.shouldRestart = false;
        this.playerRevived = false;
        this.promoCodeUsed = false; // Track if a promo code has been used this session
        this.previousScreen = 'menu'; // Track which screen the user came from
        this.menuMusicStarted = false; // Track if menu music has started
        
        // UI elements
        this.menuScreen = document.getElementById('menu-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.donationScreen = document.getElementById('donation-screen');
        this.uiOverlay = document.getElementById('ui-overlay');
        this.hud = document.getElementById('hud');
        
        // Buttons
        this.startButton = document.getElementById('start-button');
        this.donateButton = document.getElementById('donate-button');
        this.leaderboardButton = document.getElementById('leaderboard-button');
        this.backFromDonationButton = document.getElementById('back-from-donation-button');
        this.restartButton = document.getElementById('restart-button');
        this.submitCodeButton = document.getElementById('submit-code-button');
        
        // Promo code input
        this.promoCodeInput = document.getElementById('promo-code');
        
        // QR code placeholder
        this.qrPlaceholder = document.querySelector('.qr-placeholder');
        this.donationQrPlaceholder = document.querySelector('.donation-qr');
        
        // Initialize UI elements and event listeners
        this._initializeUI();
        
        // Score elements - fetch these AFTER initializeUI as they are dynamically created
        this.currentScoreElement = document.getElementById('current-score');
        this.finalScoreElement = document.getElementById('final-score');
        this.bestScoreElement = document.getElementById('best-score');
        
        // Mission objective
        this.objectiveTextElement = document.getElementById('objective-text');
        
        // EW cooldown bar
        this.rebCooldownFill = document.getElementById('reb-cooldown-fill');
        
        // Set initial best score after all elements are initialized
        this.updateBestScore();
    }

    /**
     * Initialize UI elements and event listeners
     * @private
     */
    _initializeUI() {
        // Initialize text content from GameTexts
        this._initializeTextContent();
        
        // Add event listeners
        this._addEventListeners();
        
        // Check if this is a mobile device
        const isMobile = document.body.classList.contains('mobile-device');
        
        // If on mobile, show fullscreen prompt before showing the menu
        if (isMobile && !localStorage.getItem('fullscreenPromptShown')) {
            this._showInitialFullscreenPrompt();
        } else {
            // Show menu screen initially
            this.showScreen('menu');
        }
        
        // Initialize mobile-specific UI adjustments
        this._initMobileUI();
    }

    /**
     * Initialize text content from GameTexts
     * @private
     */
    _initializeTextContent() {
        // Global elements
        document.getElementById('game-title').textContent = GameTexts.global.gameTitle;
        document.getElementById('best-score-label').textContent = GameTexts.global.bestScore;
        document.getElementById('footer-link').textContent = GameTexts.global.footerLink;
        
        // Menu screen
        this.startButton.textContent = GameTexts.menu.startGame;
        this.donateButton.textContent = GameTexts.menu.donate;
        this.leaderboardButton.textContent = GameTexts.menu.leaderboard;
        
        // Add fullscreen button to menu for mobile devices
        if (document.body.classList.contains('mobile-device') && !document.getElementById('menu-fullscreen-button')) {
            const menuButtons = document.querySelector('.menu-buttons');
            if (menuButtons) {
                const fullscreenButton = document.createElement('button');
                fullscreenButton.id = 'menu-fullscreen-button';
                fullscreenButton.textContent = 'Повний екран';
                fullscreenButton.addEventListener('click', () => {
                    const gameContainer = document.getElementById('game-container');
                    if (gameContainer) {
                        if (gameContainer.requestFullscreen) {
                            gameContainer.requestFullscreen();
                        } else if (gameContainer.webkitRequestFullscreen) {
                            gameContainer.webkitRequestFullscreen();
                        } else if (gameContainer.msRequestFullscreen) {
                            gameContainer.msRequestFullscreen();
                        }
                    }
                });
                
                // Insert after leaderboard button
                menuButtons.appendChild(fullscreenButton);
            }
        }
        
        // Set introduction text - check if on mobile device
        const introTextElement = document.getElementById('intro-text');
        if (introTextElement) {
            // Check if this is a mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                             window.innerWidth <= 900;
            
            if (isMobile) {
                // For mobile, show a simplified version without keyboard controls
                introTextElement.innerHTML = this._getMobileIntroText();
            } else {
                // For desktop, show the full introduction with keyboard controls
                introTextElement.innerHTML = GameTexts.menu.introduction.replace(/\n/g, '<br>');
            }
        }
        
        // Game over screen
        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.querySelector('h1').textContent = GameTexts.gameOver.title;
        
        // Set final score label
        const finalScoreDiv = gameOverScreen.querySelector('.final-score');
        finalScoreDiv.innerHTML = GameTexts.gameOver.finalScore + '<span id="final-score">0</span>';
        
        // Reset final score element reference
        this.finalScoreElement = document.getElementById('final-score');
        
        // Set donation text
        const donationP = gameOverScreen.querySelector('.donation-section p');
        donationP.innerHTML = GameTexts.gameOver.donationText.replace(/\n/g, '<br>');
        
        // Set promo code instructions
        const promoInstructions = document.querySelector('.promo-code-instructions');
        if (promoInstructions) {
            promoInstructions.textContent = GameTexts.gameOver.promoCodeInstructions;
        }
        
        // Set donation screen text and elements
        const donationScreen = document.getElementById('donation-screen');
        document.getElementById('donation-title').textContent = GameTexts.donation.title;
        this.backFromDonationButton.textContent = GameTexts.donation.backToMenu;
        
        // Set donation links text for both screens
        const donationScreenLinks = {
            'monobank-link': GameTexts.donation.links.monobank
        };
        
        // Set text for game over screen links
        document.querySelectorAll('#game-over-screen .donation-links a').forEach(link => {
            const id = link.id;
            if (donationScreenLinks[id]) {
                link.textContent = donationScreenLinks[id];
            }
        });
        
        // Set text for donation screen links
        document.querySelectorAll('#donation-screen .donation-links a').forEach(link => {
            const id = link.id;
            if (donationScreenLinks[id]) {
                link.textContent = donationScreenLinks[id];
            }
        });
        
        // Set donation screen text (same as game over screen)
        const donationScreenP = donationScreen.querySelector('.donation-section p');
        if (donationScreenP) {
            donationScreenP.innerHTML = GameTexts.gameOver.donationText.replace(/\n/g, '<br>');
        }
        
        // Set promo code placeholder
        this.promoCodeInput.placeholder = GameTexts.gameOver.promoCodePlaceholder;
        
        // Set button text
        this.submitCodeButton.textContent = GameTexts.gameOver.submitCode;
        this.restartButton.textContent = GameTexts.gameOver.restartGame;
        
        // Mission preparation screen
        const missionPrepScreen = document.getElementById('mission-preparation-screen');
        missionPrepScreen.querySelector('h1').textContent = GameTexts.missionPrep.title;
        missionPrepScreen.querySelector('h2').innerHTML = GameTexts.missionPrep.missionTypeLabel + 
            '<span id="mission-type">' + GameTexts.missionPrep.missionTypes.evacuation + '</span>';
        
        // Set countdown initial value
        document.getElementById('countdown').textContent = GameTexts.missionPrep.countdownInitial;
            
        // HUD elements
        document.getElementById('score').innerHTML = GameTexts.hud.score + 
            '<span id="current-score">0</span>';
            
        document.getElementById('mission-objective').innerHTML = GameTexts.hud.missionObjective + 
            '<span id="objective-text">' + GameTexts.mission.none + '</span>';
            
        document.getElementById('reb-cooldown-label').textContent = GameTexts.hud.ewLabel;
        
        // Leaderboard screen
        document.getElementById('leaderboard-title').textContent = GameTexts.leaderboard.title;
        document.getElementById('leaderboard-loading').textContent = GameTexts.leaderboard.loading;
        document.getElementById('leaderboard-error').textContent = GameTexts.leaderboard.error;
        document.getElementById('leaderboard-rank-header').textContent = GameTexts.leaderboard.rank;
        document.getElementById('leaderboard-name-header').textContent = GameTexts.leaderboard.name;
        document.getElementById('leaderboard-score-header').textContent = GameTexts.leaderboard.score;
        document.getElementById('leaderboard-close-button').textContent = GameTexts.leaderboard.close;
        
        // Submit score screen
        document.getElementById('submit-score-title').textContent = GameTexts.leaderboard.title;
        document.getElementById('player-name-label').textContent = GameTexts.leaderboard.enterName;
        document.getElementById('submit-score-button').textContent = GameTexts.leaderboard.submit;
        document.getElementById('cancel-submit-button').textContent = GameTexts.leaderboard.close;
        document.getElementById('name-required-error').textContent = GameTexts.leaderboard.nameRequired;
        
        // Use the existing leaderboard button from HTML instead of creating a new one
        const viewLeaderboardButton = document.getElementById('view-leaderboard-button');
        if (viewLeaderboardButton) {
            viewLeaderboardButton.textContent = GameTexts.leaderboard.viewLeaderboard;
        } else {
            // If for some reason the button doesn't exist in HTML, create it
            const leaderboardButton = document.createElement('button');
            leaderboardButton.id = 'view-leaderboard-button';
            leaderboardButton.textContent = GameTexts.leaderboard.viewLeaderboard;
            gameOverScreen.querySelector('.donation-section').insertAdjacentElement('afterend', leaderboardButton);
        }
    }

    /**
     * Get a mobile-friendly version of the introduction text
     * @returns {string} HTML for mobile introduction
     * @private
     */
    _getMobileIntroText() {
        return "<div class='instructions-table'>" +
            "<div class='instruction-row'><div class='instruction-label'>Виконана місія</div><div class='instruction-value'>+10 очок</div></div>" +
            "<div class='instruction-row'><div class='instruction-label'>Знищений дрон</div><div class='instruction-value'>+5 очок</div></div>" +
            "</div>" +
            "<div class='instructions-spacing'></div>" +
            "<div class='instructions-warning'>Уникайте мін та ворожих дронів - одне влучення означає знищення!</div>";
    }

    /**
     * Add event listeners
     * @private
     */
    _addEventListeners() {
        // Start button
        this.startButton.addEventListener('click', () => {
            this._handleStartGame();
        });
        
        // Donate button
        this.donateButton.addEventListener('click', () => {
            this.showScreen('donation');
            // Update QR code if image manager is available
            if (this.imageManager) {
                this._updateDonationQRCode(this.imageManager);
            }
        });
        
        // Back from donation button
        this.backFromDonationButton.addEventListener('click', () => {
            this.showScreen('menu');
        });
        
        // Restart button
        this.restartButton.addEventListener('click', () => {
            this._handleRestartGame();
        });
        
        // Submit code button
        this.submitCodeButton.addEventListener('click', () => {
            this._handlePromoCodeSubmit();
        });
        
        // Promo code input - listen for Enter key
        this.promoCodeInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this._handlePromoCodeSubmit();
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Enter to submit promo code
            if (e.key === 'Enter' && !this.uiOverlay.classList.contains('hidden') && 
                !this.gameOverScreen.classList.contains('hidden')) {
                this._handlePromoCodeSubmit();
            }
            
            // M to toggle music
            if (e.key === 'm' || e.key === 'M') {
                this.audioManager.toggleMute();
            }
        });
        
        // Leaderboard button on game over screen
        document.getElementById('view-leaderboard-button').addEventListener('click', () => {
            this._loadAndShowLeaderboard();
        });
        
        // Leaderboard close button
        document.getElementById('leaderboard-close-button').addEventListener('click', () => {
            this.showScreen(this.previousScreen || 'menu');
        });
        
        // Submit score button
        document.getElementById('submit-score-button').addEventListener('click', () => {
            this._handleScoreSubmit();
        });
        
        // Cancel submit button
        document.getElementById('cancel-submit-button').addEventListener('click', () => {
            this.showScreen('gameOver');
        });
        
        // Player name input - listen for Enter key
        document.getElementById('player-name').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this._handleScoreSubmit();
            }
        });
        
        // Leaderboard button (main menu)
        this.leaderboardButton.addEventListener('click', () => {
            this._loadAndShowLeaderboard();
        });
    }

    /**
     * Show a specific screen
     * @param {string} screenName - Name of the screen to show ('menu', 'howToPlay', 'gameOver', 'game', 'missionPreparation')
     */
    showScreen(screenName) {
        // Get all screen elements
        const missionPreparationScreen = document.getElementById('mission-preparation-screen');
        const leaderboardScreen = document.getElementById('leaderboard-screen');
        const submitScoreScreen = document.getElementById('submit-score-screen');
        
        // Save previous screen if we're switching to leaderboard
        if (screenName === 'leaderboard') {
            // Don't track 'leaderboard' or 'submitScore' as previous screens
            if (this.previousScreen !== 'leaderboard' && this.previousScreen !== 'submitScore') {
                this.previousScreen = this._getCurrentVisibleScreen();
            }
        }
        
        // Hide all screens
        this.menuScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.donationScreen.classList.add('hidden');
        if (missionPreparationScreen) {
            missionPreparationScreen.classList.add('hidden');
        }
        if (leaderboardScreen) {
            leaderboardScreen.classList.add('hidden');
        }
        if (submitScoreScreen) {
            submitScoreScreen.classList.add('hidden');
        }
        this.uiOverlay.classList.add('hidden');
        this.hud.classList.add('hidden');
        
        // Show the requested screen
        switch (screenName) {
            case 'menu':
                this.uiOverlay.classList.remove('hidden');
                this.menuScreen.classList.remove('hidden');
                // Only play menu music the first time the menu is shown
                if (!this.menuMusicStarted) {
                    this.audioManager.playMusic('menu');
                    this.menuMusicStarted = true;
                }
                break;
            case 'gameOver':
                this.uiOverlay.classList.remove('hidden');
                this.gameOverScreen.classList.remove('hidden');
                break;
            case 'donation':
                this.uiOverlay.classList.remove('hidden');
                this.donationScreen.classList.remove('hidden');
                // Update the donation QR code when showing the donation screen
                this._updateDonationQRCode(this.imageManager);
                break;
            case 'missionPreparation':
                this.uiOverlay.classList.remove('hidden');
                missionPreparationScreen.classList.remove('hidden');
                break;
            case 'leaderboard':
                this.uiOverlay.classList.remove('hidden');
                leaderboardScreen.classList.remove('hidden');
                break;
            case 'submitScore':
                this.uiOverlay.classList.remove('hidden');
                submitScoreScreen.classList.remove('hidden');
                document.getElementById('your-score-text').textContent = 
                    GameTexts.leaderboard.yourScore + this.score;
                break;
            case 'game':
                this.hud.classList.remove('hidden');
                break;
        }
    }

    /**
     * Handle start game action
     * @private
     */
    _handleStartGame() {
        this.resetScore();
        this.showScreen('game');
        
        // Set this property so Game class can check if we started a new game
        this.gameStarted = true;
        this.shouldStart = true;
        this.uiOverlay.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.menuMusicStarted = false; // Reset flag when starting a new game
    }

    /**
     * Handle restart game action
     * @private
     */
    _handleRestartGame() {
        this.resetScore();
        this.showScreen('game');
        
        // Set this property so Game class can check if we should restart
        this.gameRestarted = true;
        this.shouldRestart = true;
        this.uiOverlay.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.menuMusicStarted = false; // Reset flag when restarting
    }

    /**
     * Handle promo code submission
     * @private
     */
    _handlePromoCodeSubmit() {
        const promoCode = this.promoCodeInput.value.trim();
        
        // Check if the code is valid
        if (promoCode === "RUSNIPYZDA") {
            // Set the flag to revive the player
            this.playerRevived = true;
            // Mark that a promo code has been used this session
            this.promoCodeUsed = true;
            
            // Display success message
            this.showMessage(GameTexts.messages.codeAccepted);
            
            // Hide the UI overlay and show the HUD to return to the game
            this.showScreen('game');
        } else {
            // Display error message
            this.showMessage(GameTexts.messages.invalidCode);
        }
    }

    /**
     * Update score display
     * @param {number} score - Current score
     */
    updateScore(score) {
        this.score = score;
        
        // Update current score display if element exists
        if (this.currentScoreElement) {
            this.currentScoreElement.textContent = score;
        } else {
            // Try to get a fresh reference
            this.currentScoreElement = document.getElementById('current-score');
            if (this.currentScoreElement) {
                this.currentScoreElement.textContent = score;
            } else {
                console.error('Current score element not found when trying to update score');
            }
        }
        
        // Update best score if needed
        if (score > this.bestScore) {
            this.bestScore = score;
            saveToLocalStorage('bestScore', this.bestScore);
            this.updateBestScore();
        }
    }

    /**
     * Update best score display
     */
    updateBestScore() {
        // Get the latest reference to ensure it exists
        this.bestScoreElement = document.getElementById('best-score');
        if (this.bestScoreElement) {
            this.bestScoreElement.textContent = this.bestScore;
        } else {
            console.error('Best score element not found when trying to update best score');
        }
    }

    /**
     * Reset score to zero
     */
    resetScore() {
        this.score = 0;
        // Get the latest reference to the current score element (in case it was not available earlier)
        this.currentScoreElement = document.getElementById('current-score');
        if (this.currentScoreElement) {
            this.currentScoreElement.textContent = '0';
        } else {
            console.error('Current score element not found when trying to reset score');
        }
    }

    /**
     * Update the QR code display with the actual image if available
     * @param {ImageManager} [imageManager] - Image manager to get QR code image
     * @private
     */
    _updateQRCode(imageManager) {
        // Check if we're on mobile device - skip QR code on mobile
        const isMobile = document.body.classList.contains('mobile-device');
        if (isMobile) {
            // On mobile, hide only the QR code placeholder, not the entire donation section
            if (this.qrPlaceholder) {
                this.qrPlaceholder.classList.add('mobile-hidden');
                
                // Note: We don't need to add mobile-enhanced class here anymore
                // as we handle the donation links in showGameOver method
                
                // Make sure the Monobank link is visible and styled properly
                const monobankLink = document.getElementById('monobank-link');
                if (monobankLink) {
                    monobankLink.classList.add('mobile-donation-button');
                    // Set the text content if it's empty
                    if (!monobankLink.textContent) {
                        monobankLink.textContent = 'Підтримати';
                    }
                }
            }
            return;
        }
        
        // Use class's imageManager if available and none was provided
        imageManager = imageManager || this.imageManager;
        
        if (!imageManager || !this.qrPlaceholder) return;
        
        // Clear any previous content
        this.qrPlaceholder.innerHTML = '';
        
        // Try to get the QR code image
        const qrImage = imageManager.getImage('qr_code');
        
        if (qrImage) {
            // Create an image element
            const img = document.createElement('img');
            img.src = qrImage.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.alt = 'Donation QR Code';
            
            // Add the image to the placeholder
            this.qrPlaceholder.appendChild(img);
        } else {
            // Fallback text if image not available
            this.qrPlaceholder.textContent = 'QR CODE PLACEHOLDER';
        }
    }
    
    /**
     * Update the donation QR code display with the actual image if available
     * @param {ImageManager} [imageManager] - Image manager to get QR code image
     * @private
     */
    _updateDonationQRCode(imageManager) {
        // Use class's imageManager if available and none was provided
        imageManager = imageManager || this.imageManager;
        
        if (!imageManager || !this.donationQrPlaceholder) return;
        
        // Clear any previous content
        this.donationQrPlaceholder.innerHTML = '';
        
        // Try to get the QR code image
        const qrImage = imageManager.getImage('qr_code');
        
        if (qrImage) {
            // Create an image element
            const img = document.createElement('img');
            img.src = qrImage.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.alt = 'Donation QR Code';
            
            // Add the image to the placeholder
            this.donationQrPlaceholder.appendChild(img);
        } else {
            // Fallback text if image not available
            this.donationQrPlaceholder.textContent = 'QR CODE PLACEHOLDER';
        }
    }

    /**
     * Update mission objective text
     * @param {string} text - Objective text
     */
    updateObjectiveText(text) {
        if (this.objectiveTextElement) {
            this.objectiveTextElement.textContent = text;
        } else {
            // Try to get a fresh reference
            this.objectiveTextElement = document.getElementById('objective-text');
            if (this.objectiveTextElement) {
                this.objectiveTextElement.textContent = text;
            } else {
                console.error('Objective text element not found when trying to update objective');
            }
        }
    }

    /**
     * Update EW cooldown display
     * @param {number} progress - Cooldown progress (0-100)
     */
    updateEWCooldown(progress) {
        this.rebCooldownFill.style.width = `${progress}%`;
        
        // Change color based on status
        if (progress === 100) {
            this.rebCooldownFill.style.backgroundColor = '#2ecc71'; // Green when ready
        } else {
            this.rebCooldownFill.style.backgroundColor = '#3498db'; // Blue when cooling down
        }
    }

    /**
     * Show a temporary message in the HUD
     * @param {string} message - Message to display
     * @param {number} duration - Duration in milliseconds
     */
    showMessage(message, duration = 3000) {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        // Add to document
        document.getElementById('game-container').appendChild(messageElement);
        
        // Remove after duration
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                messageElement.remove();
            }, 500);
        }, duration);
    }

    /**
     * Reset UI state for a new game
     */
    reset() {
        this.gameStarted = false;
        this.gameRestarted = false;
        this.playerRevived = false;
        this.promoCodeUsed = false; // Reset promo code usage on new game
    }

    /**
     * Check if a new game should be started
     * @returns {boolean} Whether a new game should be started
     */
    shouldStartNewGame() {
        if (this.gameStarted) {
            this.gameStarted = false;
            return true;
        }
        return false;
    }

    /**
     * Check if the game should be restarted
     * @returns {boolean} Whether the game should be restarted
     */
    shouldRestartGame() {
        if (this.gameRestarted) {
            this.gameRestarted = false;
            return true;
        }
        return false;
    }

    /**
     * Check if the player should be revived
     * @returns {boolean} Whether the player should be revived
     */
    shouldRevivePlayer() {
        if (this.playerRevived) {
            this.playerRevived = false;
            return true;
        }
        return false;
    }

    /**
     * Show mission preparation screen with countdown
     * @param {string} missionType - Type of mission (evacuation or delivery)
     * @param {function} callback - Function to call after countdown completes
     */
    showMissionPreparation(missionType, callback) {
        // Get mission description based on type
        const missionTitle = GameTexts.missionPrep.missionTypes[missionType] || 
                             GameTexts.missionPrep.missionTypes.evacuation;
        
        const missionDescription = GameTexts.missionPrep.missionDescriptions[missionType] || 
                                   GameTexts.missionPrep.missionDescriptions.fallback;
        
        // Update mission info
        document.getElementById('mission-type').textContent = missionTitle;
        document.getElementById('mission-description').textContent = missionDescription;
        
        // Show the preparation screen
        this.showScreen('missionPreparation');
        
        // Play menu music once
        this.audioManager.playMusic('menu');
        
        // Check if this is a mobile device
        const isMobile = document.body.classList.contains('mobile-device');
        
        // Set up countdown
        let countdown = 5;
        const countdownElement = document.getElementById('countdown');
        countdownElement.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            // Add visual effect on countdown change
            countdownElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                countdownElement.style.transform = 'scale(1)';
            }, 300);
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                
                if (isMobile) {
                    // On mobile, show fullscreen prompt instead of starting game immediately
                    this._showFullscreenPrompt(callback);
                } else {
                    // On desktop, proceed as normal
                    this.showScreen('game');
                    
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            }
        }, 1000);
    }
    
    /**
     * Show fullscreen prompt for mobile users
     * @param {function} callback - Function to call after user goes fullscreen
     * @private
     */
    _showFullscreenPrompt(callback) {
        // If fullscreen prompt has already been shown at startup, skip straight to game
        if (localStorage.getItem('fullscreenPromptShown')) {
            this.showScreen('game');
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }
        
        // Create or get the mission preparation screen
        const missionPrepScreen = document.getElementById('mission-preparation-screen');
        
        // Hide the mission info and countdown
        const missionInfo = document.querySelector('.mission-info');
        const countdownContainer = document.querySelector('.countdown-container');
        
        if (missionInfo) {
            missionInfo.style.display = 'none';
        }
        
        if (countdownContainer) {
            countdownContainer.style.display = 'none';
        }
        
        // Create fullscreen prompt if it doesn't exist
        let fullscreenPrompt = document.getElementById('fullscreen-prompt');
        if (!fullscreenPrompt) {
            fullscreenPrompt = document.createElement('div');
            fullscreenPrompt.id = 'fullscreen-prompt';
            fullscreenPrompt.className = 'fullscreen-prompt';
            
            // Create prompt content
            fullscreenPrompt.innerHTML = `
                <div class="fullscreen-icon">⛶</div>
                <p>Для кращого досвіду, перейдіть в повноекранний режим</p>
                <button id="go-fullscreen-button" class="highlight-button">Повний екран</button>
                <button id="skip-fullscreen-button">Пропустити</button>
            `;
            
            // Add to mission preparation screen
            missionPrepScreen.appendChild(fullscreenPrompt);
        } else {
            // Show the prompt if it already exists
            fullscreenPrompt.style.display = 'flex';
        }
        
        // Get the buttons
        const goFullscreenButton = document.getElementById('go-fullscreen-button');
        const skipFullscreenButton = document.getElementById('skip-fullscreen-button');
        
        // Add event listeners
        const startGameAfterChoice = () => {
            // Hide the prompt
            fullscreenPrompt.style.display = 'none';
            
            // Show the game screen
            this.showScreen('game');
            
            // Call the callback
            if (typeof callback === 'function') {
                callback();
            }
            
            // Remove event listeners to prevent memory leaks
            goFullscreenButton.removeEventListener('click', handleGoFullscreen);
            skipFullscreenButton.removeEventListener('click', handleSkipFullscreen);
            
            // Reset mission info and countdown display for next time
            if (missionInfo) {
                missionInfo.style.display = 'block';
            }
            
            if (countdownContainer) {
                countdownContainer.style.display = 'block';
            }
            
            // Record that the prompt has been shown
            localStorage.setItem('fullscreenPromptShown', 'true');
        };
        
        const handleGoFullscreen = () => {
            // Request fullscreen
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                if (gameContainer.requestFullscreen) {
                    gameContainer.requestFullscreen();
                } else if (gameContainer.webkitRequestFullscreen) {
                    gameContainer.webkitRequestFullscreen();
                } else if (gameContainer.msRequestFullscreen) {
                    gameContainer.msRequestFullscreen();
                }
                
                // Add fullscreen-active class
                gameContainer.classList.add('fullscreen-active');
            }
            
            // Show menu after a short delay to allow fullscreen transition
            setTimeout(startGameAfterChoice, 500);
        };
        
        const handleSkipFullscreen = () => {
            // Show a brief message about fullscreen benefits
            this.showMessage('Ви можете перейти в повноекранний режим через меню гри', 3000);
            
            // Show the menu screen
            startGameAfterChoice();
        };
        
        // Add event listeners
        goFullscreenButton.addEventListener('click', handleGoFullscreen);
        skipFullscreenButton.addEventListener('click', handleSkipFullscreen);
    }

    /**
     * Load and display the leaderboard
     * @private
     */
    _loadAndShowLeaderboard() {
        // Show the leaderboard screen first
        this.showScreen('leaderboard');
        
        // Get references to elements
        const loadingMsg = document.getElementById('leaderboard-loading');
        const errorMsg = document.getElementById('leaderboard-error');
        const table = document.getElementById('leaderboard-table');
        const tableBody = document.getElementById('leaderboard-body');
        
        // Show loading message
        loadingMsg.classList.remove('hidden');
        errorMsg.classList.add('hidden');
        table.classList.add('hidden');
        
        // Clear any existing scores
        tableBody.innerHTML = '';
        
        // Check if the submit score button exists, and remove it if it does
        const existingSubmitBtn = document.getElementById('open-submit-score-btn');
        if (existingSubmitBtn) {
            existingSubmitBtn.remove();
        }
        
        // Load scores from Firebase
        this.leaderboardManager.getTopScores()
            .then(scores => {
                // Hide loading message, show table
                loadingMsg.classList.add('hidden');
                table.classList.remove('hidden');
                
                // Generate table rows
                scores.forEach((score, index) => {
                    const row = document.createElement('tr');
                    
                    // Check if this is the current player's score
                    const isMyScore = score.score === this.score;
                    if (isMyScore) {
                        row.classList.add('my-score-row');
                    }
                    
                    // Rank column
                    const rankCell = document.createElement('td');
                    rankCell.textContent = (index + 1);
                    row.appendChild(rankCell);
                    
                    // Name column
                    const nameCell = document.createElement('td');
                    nameCell.textContent = score.name;
                    row.appendChild(nameCell);
                    
                    // Score column
                    const scoreCell = document.createElement('td');
                    scoreCell.textContent = score.score;
                    row.appendChild(scoreCell);
                    
                    tableBody.appendChild(row);
                });
                
                // If no scores, show message
                if (scores.length === 0) {
                    const noScoresRow = document.createElement('tr');
                    const noScoresCell = document.createElement('td');
                    noScoresCell.colSpan = 3;
                    noScoresCell.textContent = 'Ще немає результатів';
                    noScoresRow.appendChild(noScoresCell);
                    tableBody.appendChild(noScoresRow);
                }
                
                // Check if player's score qualifies for leaderboard
                return this.leaderboardManager.wouldPlaceOnLeaderboard(this.score);
            })
            .then(qualifies => {
                if (qualifies && this.score > 0) {
                    // Add a button to submit score
                    const leaderboardScreen = document.getElementById('leaderboard-screen');
                    const closeButton = document.getElementById('leaderboard-close-button');
                    
                    const submitBtn = document.createElement('button');
                    submitBtn.id = 'open-submit-score-btn';
                    submitBtn.textContent = GameTexts.leaderboard.enterName;
                    submitBtn.classList.add('highlight-button');
                    
                    // Insert before close button
                    if (closeButton && leaderboardScreen) {
                        leaderboardScreen.insertBefore(submitBtn, closeButton);
                    }
                    
                    // Add event listener
                    submitBtn.addEventListener('click', () => {
                        this.showScreen('submitScore');
                    });
                }
            })
            .catch(error => {
                console.error("Error loading leaderboard:", error);
                loadingMsg.classList.add('hidden');
                errorMsg.classList.remove('hidden');
            });
    }

    /**
     * Handle score submission
     * @private
     */
    _handleScoreSubmit() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput.value.trim();
        const errorElement = document.getElementById('name-required-error');
        
        // Validate player name
        if (!playerName) {
            errorElement.classList.remove('hidden');
            nameInput.focus();
            return;
        }
        
        // Hide error message if visible
        errorElement.classList.add('hidden');
        
        // Submit the score
        this.leaderboardManager.submitScore(playerName, this.score)
            .then(() => {
                // Show success message
                this.showMessage(GameTexts.leaderboard.scoreSubmitted);
                
                // Show the leaderboard
                this._loadAndShowLeaderboard();
                
                // Save player name for next time
                saveToLocalStorage('playerName', playerName);
            })
            .catch(error => {
                console.error("Error submitting score:", error);
                this.showMessage("Error submitting score. Please try again.");
            });
    }

    /**
     * Get the current visible screen
     * @private
     * @returns {string} The name of the currently visible screen
     */
    _getCurrentVisibleScreen() {
        if (!this.menuScreen.classList.contains('hidden')) return 'menu';
        if (!this.gameOverScreen.classList.contains('hidden')) return 'gameOver';
        if (!this.donationScreen.classList.contains('hidden')) return 'donation';
        
        const missionPreparationScreen = document.getElementById('mission-preparation-screen');
        if (missionPreparationScreen && !missionPreparationScreen.classList.contains('hidden')) return 'missionPreparation';
        
        return 'menu'; // Default to menu if nothing else is visible
    }

    /**
     * Initialize mobile-specific UI adjustments
     * @private
     */
    _initMobileUI() {
        // Use the same detection logic as in Game class for consistency
        const hasTouchScreen = ('ontouchstart' in window) || 
                              (navigator.maxTouchPoints > 0) || 
                              (navigator.msMaxTouchPoints > 0);
        
        const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone|Pixel|Galaxy|Xperia|Redmi|Huawei|OnePlus/i.test(navigator.userAgent);
        
        const isSmallScreen = window.innerWidth <= 1024;
        
        const hasMobileFeatures = 'orientation' in window || 'userAgentData' in navigator;
        
        const isMobile = userAgentCheck || (hasTouchScreen && (isSmallScreen || hasMobileFeatures));
        
        if (isMobile) {
            // Add class to body for mobile-specific CSS
            document.body.classList.add('mobile-device');
            
            // Set up the REB cooldown visualization for the REB button
            this._setupRebButtonCooldown();
            
            // Setup screen orientation warning if needed
            this._setupOrientationWarning();
            
            // Listen for orientation changes to update the introduction text
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this._updateIntroTextForMobile(), 300);
            });
            
            window.addEventListener('resize', () => {
                this._updateIntroTextForMobile();
            });
            
            // Handle iOS safe areas
            if ((/iPhone|iPad|iPod/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent)) || 
                document.documentElement.style.getPropertyValue('--safe-area-inset-top')) {
                document.body.classList.add('ios-device');
            }
        }
    }
    
    /**
     * Set up the REB cooldown visualization for the mobile REB button
     * @private
     */
    _setupRebButtonCooldown() {
        const rebButton = document.getElementById('reb-button');
        
        // Update the REB button to show cooldown state
        setInterval(() => {
            if (!this.playerReference) return;
            
            const cooldownProgress = this.playerReference.getEWCooldownProgress();
            
            if (cooldownProgress < 1) {
                rebButton.classList.add('cooldown');
                rebButton.textContent = `РЕБ ${Math.floor(cooldownProgress * 100)}%`;
            } else {
                rebButton.classList.remove('cooldown');
                rebButton.textContent = 'РЕБ';
            }
        }, 100);
    }
    
    /**
     * Setup orientation warning for mobile devices
     * @private
     */
    _setupOrientationWarning() {
        // Create orientation warning element if it doesn't exist
        if (!document.getElementById('orientation-warning')) {
            const warning = document.createElement('div');
            warning.id = 'orientation-warning';
            warning.textContent = 'Будь ласка, переверніть пристрій для кращого ігрового досвіту.';
            warning.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                padding: 20px;
                z-index: 9999;
                font-size: 24px;
            `;
            document.body.appendChild(warning);
            
            // Check orientation and show/hide warning
            const checkOrientation = () => {
                if (window.innerHeight > window.innerWidth) { // Portrait
                    warning.style.display = 'flex';
                } else { // Landscape
                    warning.style.display = 'none';
                }
            };
            
            // Check immediately and on resize
            checkOrientation();
            window.addEventListener('resize', checkOrientation);
        }
    }
    
    /**
     * Update the introduction text for mobile devices
     * @private
     */
    _updateIntroTextForMobile() {
        const introTextElement = document.getElementById('intro-text');
        if (introTextElement && document.body.classList.contains('mobile-device')) {
            introTextElement.innerHTML = this._getMobileIntroText();
        }
    }

    /**
     * Show fullscreen prompt before main menu on mobile
     * @private
     */
    _showInitialFullscreenPrompt() {
        // Create or get the uiOverlay
        this.uiOverlay.classList.remove('hidden');
        
        // Create fullscreen prompt if it doesn't exist
        let fullscreenPrompt = document.getElementById('initial-fullscreen-prompt');
        if (!fullscreenPrompt) {
            fullscreenPrompt = document.createElement('div');
            fullscreenPrompt.id = 'initial-fullscreen-prompt';
            fullscreenPrompt.className = 'fullscreen-prompt';
            
            // Create prompt content
            fullscreenPrompt.innerHTML = `
                <div class="fullscreen-icon">⛶</div>
                <p>Для кращого досвіду, перейдіть в повноекранний режим</p>
                <button id="initial-go-fullscreen-button" class="highlight-button">Повний екран</button>
                <button id="initial-skip-fullscreen-button">Пропустити</button>
            `;
            
            // Add to UI overlay
            this.uiOverlay.appendChild(fullscreenPrompt);
        } else {
            // Show the prompt if it already exists
            fullscreenPrompt.style.display = 'flex';
        }
        
        // Get the buttons
        const goFullscreenButton = document.getElementById('initial-go-fullscreen-button');
        const skipFullscreenButton = document.getElementById('initial-skip-fullscreen-button');
        
        // Add event listeners
        const showMenuAfterChoice = () => {
            // Hide the prompt
            fullscreenPrompt.style.display = 'none';
            
            // Show the menu screen
            this.showScreen('menu');
            
            // Record that the prompt has been shown
            localStorage.setItem('fullscreenPromptShown', 'true');
            
            // Remove event listeners to prevent memory leaks
            goFullscreenButton.removeEventListener('click', handleGoFullscreen);
            skipFullscreenButton.removeEventListener('click', handleSkipFullscreen);
        };
        
        const handleGoFullscreen = () => {
            // Request fullscreen
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                if (gameContainer.requestFullscreen) {
                    gameContainer.requestFullscreen();
                } else if (gameContainer.webkitRequestFullscreen) {
                    gameContainer.webkitRequestFullscreen();
                } else if (gameContainer.msRequestFullscreen) {
                    gameContainer.msRequestFullscreen();
                }
                
                // Add fullscreen-active class
                gameContainer.classList.add('fullscreen-active');
            }
            
            // Show menu after a short delay to allow fullscreen transition
            setTimeout(showMenuAfterChoice, 500);
        };
        
        const handleSkipFullscreen = () => {
            // Show a brief message about fullscreen benefits
            this.showMessage('Ви можете перейти в повноекранний режим через меню гри', 3000);
            
            // Show the menu screen
            showMenuAfterChoice();
        };
        
        // Add event listeners
        goFullscreenButton.addEventListener('click', handleGoFullscreen);
        skipFullscreenButton.addEventListener('click', handleSkipFullscreen);
    }

    /**
     * Show game over screen
     * @param {ImageManager} [imageManager] - Optional image manager to display QR code
     */
    showGameOver(imageManager) {
        this.finalScoreElement.textContent = this.score;
        this.showScreen('gameOver');
        this.audioManager.stopMusic();
        
        // Always use the stored imageManager first, then fall back to parameter if needed
        this._updateQRCode(this.imageManager || imageManager);
        
        // Check if we're on a mobile device
        const isMobile = document.body.classList.contains('mobile-device');
        
        // Optimize layout for mobile devices
        if (isMobile) {
            // Add mobile-optimized class to game over screen
            const gameOverScreen = document.getElementById('game-over-screen');
            gameOverScreen.classList.add('mobile-optimized');
            
            // Create a container for title and score on mobile
            const titleElement = gameOverScreen.querySelector('h1');
            const finalScoreDiv = gameOverScreen.querySelector('.final-score');
            
            // Check if we need to create the title-score container
            if (titleElement && finalScoreDiv && !gameOverScreen.querySelector('.title-score-container')) {
                // Create container
                const titleScoreContainer = document.createElement('div');
                titleScoreContainer.className = 'title-score-container';
                
                // Move the elements to the container
                titleElement.parentNode.insertBefore(titleScoreContainer, titleElement);
                titleScoreContainer.appendChild(titleElement);
                titleScoreContainer.appendChild(finalScoreDiv);
            }
            
            // Make sure donation section is properly styled
            const donationSection = document.querySelector('.donation-section');
            if (donationSection) {
                donationSection.classList.add('mobile-donation-section');
            }
            
            // Get and hide the donation links container if it exists
            // since we're moving its only child (monobank-link) to a new row
            const donationLinks = document.querySelector('.donation-links');
            if (donationLinks) {
                donationLinks.classList.add('hidden');
            }
            
            // Handle the promo code section layout
            const promoCodeSection = document.querySelector('.promo-code-section');
            
            if (promoCodeSection) {
                // Clear any existing rows
                const existingRows = promoCodeSection.querySelectorAll('.mobile-input-row');
                existingRows.forEach(row => row.remove());
                
                // Create a new container for promo input and submit button
                const inputRow = document.createElement('div');
                inputRow.className = 'mobile-input-row';
                
                // Get the original elements
                const promoCodeInput = document.getElementById('promo-code');
                const submitCodeButton = document.getElementById('submit-code-button');
                
                // Get the original monobank link
                const originalMonobankLink = document.getElementById('monobank-link');
                let monobankLink = null;
                
                if (originalMonobankLink) {
                    // Instead of hiding the original and creating a clone with the same ID, 
                    // let's just move the original element
                    monobankLink = originalMonobankLink;
                    
                    // Set the link text if it's not already set
                    if (!monobankLink.textContent || monobankLink.textContent.trim() === '') {
                        monobankLink.textContent = 'Підтримати проєкт';
                    }
                    
                    monobankLink.classList.add('mobile-row-item');
                    monobankLink.classList.add('mobile-donation-button');
                    
                    // Remove it from its current parent
                    if (monobankLink.parentNode) {
                        monobankLink.parentNode.removeChild(monobankLink);
                    }
                    
                    // Add it to our new row
                    inputRow.appendChild(monobankLink);
                }
                
                // Add the input and button to the row
                if (promoCodeInput) {
                    const promoCodeWrapper = document.createElement('div');
                    promoCodeWrapper.className = 'mobile-row-item';
                    
                    // Clone the input
                    const promoCodeClone = promoCodeInput.cloneNode(true);
                    promoCodeClone.classList.add('mobile-input');
                    promoCodeWrapper.appendChild(promoCodeClone);
                    inputRow.appendChild(promoCodeWrapper);
                    
                    // Hide the original input
                    promoCodeInput.style.display = 'none';
                    
                    // Add event listener to sync the values
                    promoCodeClone.addEventListener('input', () => {
                        promoCodeInput.value = promoCodeClone.value;
                    });
                }
                
                if (submitCodeButton) {
                    const submitButtonWrapper = document.createElement('div');
                    submitButtonWrapper.className = 'mobile-row-item';
                    
                    // Clone the button
                    const submitButtonClone = submitCodeButton.cloneNode(true);
                    submitButtonWrapper.appendChild(submitButtonClone);
                    inputRow.appendChild(submitButtonWrapper);
                    
                    // Hide the original button
                    submitCodeButton.style.display = 'none';
                    
                    // Add event listener to the clone
                    submitButtonClone.addEventListener('click', () => {
                        submitCodeButton.click();
                    });
                }
                
                // Add the row to the promo code section
                promoCodeSection.appendChild(inputRow);
            }
            
            // Create the buttons row for leaderboard and restart buttons
            // Get references to the buttons
            const leaderboardButton = document.getElementById('view-leaderboard-button');
            const restartButton = document.getElementById('restart-button');
            
            // Check if buttons exist
            if (leaderboardButton && restartButton) {
                // Remove any existing mobile-buttons-row
                const existingContainer = gameOverScreen.querySelector('.mobile-buttons-row');
                if (existingContainer) {
                    existingContainer.remove();
                }
                
                // Create a new container
                const buttonsRow = document.createElement('div');
                buttonsRow.className = 'mobile-buttons-row';
                
                // Clone the buttons
                const leaderboardClone = leaderboardButton.cloneNode(true);
                const restartClone = restartButton.cloneNode(true);
                
                // Add classes to the clones
                leaderboardClone.classList.add('mobile-row-button');
                restartClone.classList.add('mobile-row-button');
                
                // Add buttons to the row
                buttonsRow.appendChild(leaderboardClone);
                buttonsRow.appendChild(restartClone);
                
                // Add the row to the game over screen
                gameOverScreen.appendChild(buttonsRow);
                
                // Hide the original buttons
                leaderboardButton.style.display = 'none';
                restartButton.style.display = 'none';
                
                // Copy event listeners
                leaderboardClone.addEventListener('click', () => {
                    leaderboardButton.click();
                });
                
                restartClone.addEventListener('click', () => {
                    restartButton.click();
                });
            }
        }
        
        // Hide promo code section if already used this session
        const promoCodeSection = document.querySelector('.promo-code-section');
        if (promoCodeSection) {
            if (this.promoCodeUsed) {
                promoCodeSection.classList.add('hidden');
            } else {
                promoCodeSection.classList.remove('hidden');
            }
        }
        
        // Check if score qualifies for leaderboard
        this.leaderboardManager.wouldPlaceOnLeaderboard(this.score)
            .then(qualifies => {
                if (qualifies) {
                    // Instead of automatically showing submit screen, show a notification
                    setTimeout(() => {
                        const leaderboardButton = document.getElementById('view-leaderboard-button');
                        if (leaderboardButton) {
                            // Add a visual indicator that this score can be submitted
                            leaderboardButton.classList.add('highlight-button');
                            leaderboardButton.innerHTML = `<span class="blink-icon">★</span> ${GameTexts.leaderboard.viewLeaderboard}`;
                            
                            // Also update cloned button if it exists
                            const leaderboardClone = document.querySelector('.mobile-buttons-row #view-leaderboard-button');
                            if (leaderboardClone) {
                                leaderboardClone.classList.add('highlight-button');
                                leaderboardClone.innerHTML = `<span class="blink-icon">★</span> ${GameTexts.leaderboard.viewLeaderboard}`;
                            }
                            
                            // Show a message that the score qualifies for the leaderboard
                            this.showMessage(GameTexts.leaderboard.scoreQualifies, 5000);
                        }
                    }, 2000);
                }
            })
            .catch(error => {
                console.error("Error checking leaderboard placement:", error);
            });
        
        // Check if the device is in portrait mode on mobile
        if (isMobile && window.innerHeight > window.innerWidth) {
            // Show message to rotate for better gameplay
            this.showMessage(GameTexts.messages.rotateDevice || "Поверніть пристрій для кращої гри", 5000);
        }
    }
} 