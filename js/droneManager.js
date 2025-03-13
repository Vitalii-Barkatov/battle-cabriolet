// Stop warning sound if it's still playing
if (this.warningSound) {
    // Remove the ended listener to avoid callbacks after stopping
    this.warningSound.removeEventListener('ended', this.warningSound.onended);
    this.warningSound.pause();
    this.warningSound = null;
    this.audioManager.stopSfx(this.warningSoundId);
} 