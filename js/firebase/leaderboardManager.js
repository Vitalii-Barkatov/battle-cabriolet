/**
 * LeaderboardManager class
 * Handles saving scores and retrieving the leaderboard using Firebase
 */
class LeaderboardManager {
  constructor() {
    this.leaderboardRef = database.ref('leaderboard');
    this.maxEntries = Number.MAX_SAFE_INTEGER; // Unlimited entries
    this.displayLimit = 100; // Display up to 100 entries at once, but can be changed
  }

  /**
   * Submit a new score to the leaderboard
   * @param {string} playerName - Name of the player
   * @param {number} score - Score achieved
   * @returns {Promise} Promise that resolves when the score is submitted
   */
  submitScore(playerName, score) {
    // Create a simple ID based on timestamp
    const scoreId = Date.now().toString();
    
    return this.leaderboardRef.child(scoreId).set({
      name: playerName,
      score: score,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      console.log(`Score ${score} submitted for ${playerName}`);
      return Promise.resolve();
    }).catch(error => {
      console.error("Error submitting score:", error);
      throw error;
    });
  }

  /**
   * Get the top scores from the leaderboard
   * @param {number} limit - Maximum number of scores to retrieve (default: 100)
   * @returns {Promise<Array>} Promise that resolves to an array of score objects
   */
  getTopScores(limit = this.displayLimit) {
    return this.leaderboardRef
      .orderByChild('score')
      .limitToLast(limit)
      .once('value')
      .then(snapshot => {
        const scores = [];
        snapshot.forEach(childSnapshot => {
          scores.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        // Sort by score (highest first)
        return scores.sort((a, b) => b.score - a.score);
      }).catch(error => {
        console.error("Error getting leaderboard:", error);
        return [];
      });
  }

  /**
   * Check if the given score is greater than zero
   * (All non-zero scores can now be submitted to the unlimited leaderboard)
   * @param {number} score - Score to check
   * @returns {Promise<boolean>} Promise that resolves to true if the score is greater than zero
   */
  wouldPlaceOnLeaderboard(score) {
    // Any score greater than zero can be added to the leaderboard
    return Promise.resolve(score > 0);
  }
} 