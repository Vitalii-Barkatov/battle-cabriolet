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
        
        // UI elements
        this.menuScreen = document.getElementById('menu-screen');
        this.howToPlayScreen = document.getElementById('how-to-play-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.donationScreen = document.getElementById('donation-screen');
        this.uiOverlay = document.getElementById('ui-overlay');
        this.hud = document.getElementById('hud');
        
        // Buttons
        this.startButton = document.getElementById('start-button');
        this.howToPlayButton = document.getElementById('how-to-play-button');
        this.donateButton = document.getElementById('donate-button');
        this.backToMenuButton = document.getElementById('back-to-menu-button');
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
        
        // Show menu screen initially
        this.showScreen('menu');
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
        this.howToPlayButton.textContent = GameTexts.menu.howToPlay;
        this.donateButton.textContent = GameTexts.menu.donate;
        
        // Set introduction text
        const introTextElement = document.getElementById('intro-text');
        if (introTextElement) {
            introTextElement.textContent = GameTexts.menu.introduction;
        }
        
        // How to play screen
        const howToPlayScreen = document.getElementById('how-to-play-screen');
        howToPlayScreen.querySelector('h1').textContent = GameTexts.howToPlay.title;
        
        // Update instructions
        const instructionsDiv = howToPlayScreen.querySelector('.instructions');
        instructionsDiv.innerHTML = ''; // Clear existing content
        
        // Add instruction paragraphs
        GameTexts.howToPlay.instructions.forEach(instruction => {
            const p = document.createElement('p');
            p.textContent = instruction;
            instructionsDiv.appendChild(p);
        });
        
        this.backToMenuButton.textContent = GameTexts.howToPlay.backToMenu;
        
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
        
        // Set donation links text
        document.getElementById('monobank-link').textContent = GameTexts.donation.links.monobank;
        document.getElementById('privat-link').textContent = GameTexts.donation.links.privat;
        document.getElementById('paypal-link').textContent = GameTexts.donation.links.paypal;
        
        // Set donation screen text (same as game over screen)
        const donationScreenP = donationScreen.querySelector('.donation-section p');
        donationScreenP.innerHTML = GameTexts.gameOver.donationText.replace(/\n/g, '<br>');
        
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
        
        // Add leaderboard button to game over screen
        const leaderboardButton = document.createElement('button');
        leaderboardButton.id = 'view-leaderboard-button';
        leaderboardButton.textContent = GameTexts.leaderboard.viewLeaderboard;
        gameOverScreen.querySelector('.donation-section').insertAdjacentElement('afterend', leaderboardButton);
    }

    /**
     * Add event listeners
     * @private
     */
    _addEventListeners() {
        // Start button
        this.startButton.addEventListener('click', () => {
            this.audioManager.playSfx('sfx_button_click');
            this._handleStartGame();
        });
        
        // How to play button
        this.howToPlayButton.addEventListener('click', () => {
            this.audioManager.playSfx('sfx_button_click');
            this.showScreen('howToPlay');
        });
        
        // Donate button
        this.donateButton.addEventListener('click', () => {
            this.audioManager.playSfx('sfx_button_click');
            this.showScreen('donation');
            // Update QR code if image manager is available
            if (this.imageManager) {
                this._updateDonationQRCode(this.imageManager);
            }
        });
        
        // Back to menu button
        this.backToMenuButton.addEventListener('click', () => {
            this.audioManager.playSfx('sfx_button_click');
            this.showScreen('menu');
        });
        
        // Back from donation button
        this.backFromDonationButton.addEventListener('click', () => {
            this.audioManager.playSfx('sfx_button_click');
            this.showScreen('menu');
        });
        
        // Restart button
        this.restartButton.addEventListener('click', () => {
            this.audioManager.playSfx('sfx_button_click');
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
            this.audioManager.playSfx('sfx_button_click');
            this._loadAndShowLeaderboard();
        });
        
        // Leaderboard close button
        document.getElementById('leaderboard-close-button').addEventListener('click', () => {
            this.audioManager.playSfx('sfx_button_click');
            this.showScreen('gameOver');
        });
        
        // Submit score button
        document.getElementById('submit-score-button').addEventListener('click', () => {
            this._handleScoreSubmit();
        });
        
        // Cancel submit button
        document.getElementById('cancel-submit-button').addEventListener('click', () => {
            this.audioManager.playSfx('sfx_button_click');
            this.showScreen('gameOver');
        });
        
        // Player name input - listen for Enter key
        document.getElementById('player-name').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this._handleScoreSubmit();
            }
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
        
        // Hide all screens
        this.menuScreen.classList.add('hidden');
        this.howToPlayScreen.classList.add('hidden');
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
                this.audioManager.playMusic('menu');
                break;
            case 'howToPlay':
                this.uiOverlay.classList.remove('hidden');
                this.howToPlayScreen.classList.remove('hidden');
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
                this.audioManager.playMusic('game');
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
    }

    /**
     * Handle promo code submission
     * @private
     */
    _handlePromoCodeSubmit() {
        const promoCode = this.promoCodeInput.value.trim();
        
        // Check if the code is valid
        if (promoCode === "UKRAINE" || promoCode === "CABRIOLET") {
            // Set the flag to revive the player
            this.playerRevived = true;
            
            // Display success message
            this.showMessage(GameTexts.messages.codeAccepted);
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
     * Show game over screen
     * @param {ImageManager} [imageManager] - Optional image manager to display QR code
     */
    showGameOver(imageManager) {
        this.finalScoreElement.textContent = this.score;
        this.showScreen('gameOver');
        this.audioManager.playSfx('sfx_game_over');
        this.audioManager.stopMusic();
        
        // Always use the stored imageManager first, then fall back to parameter if needed
        this._updateQRCode(this.imageManager || imageManager);
        
        // Check if score qualifies for leaderboard
        this.leaderboardManager.wouldPlaceOnLeaderboard(this.score)
            .then(qualifies => {
                if (qualifies) {
                    // Show submit score popup automatically
                    setTimeout(() => {
                        this.showScreen('submitScore');
                    }, 2000);
                }
            })
            .catch(error => {
                console.error("Error checking leaderboard placement:", error);
            });
    }
    
    /**
     * Update the QR code display with the actual image if available
     * @param {ImageManager} [imageManager] - Image manager to get QR code image
     * @private
     */
    _updateQRCode(imageManager) {
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
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageElement.style.color = '#fff';
        messageElement.style.padding = '10px 20px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.transition = 'opacity 0.5s';
        
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
                
                // Switch to game screen and call callback
                this.showScreen('game');
                this.audioManager.playMusic('game');
                
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }, 1000);
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
        this.audioManager.playSfx('sfx_button_click');
        
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
} 