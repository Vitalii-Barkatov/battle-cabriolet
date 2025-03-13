/**
 * LeaderboardManager class
 * Handles saving scores and retrieving the leaderboard using Firebase
 */
class LeaderboardManager {
  constructor() {
    this.leaderboardRef = database.ref('leaderboard');
    this.maxEntries = 10; // Store only top 10 scores
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
      
      // After submitting, trim the leaderboard to keep only top scores
      return this.trimLeaderboard();
    }).catch(error => {
      console.error("Error submitting score:", error);
      throw error;
    });
  }

  /**
   * Get the top scores from the leaderboard
   * @param {number} limit - Maximum number of scores to retrieve
   * @returns {Promise<Array>} Promise that resolves to an array of score objects
   */
  getTopScores(limit = this.maxEntries) {
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
   * Trim the leaderboard to keep only the top scores
   * @private
   */
  trimLeaderboard() {
    return this.getTopScores(this.maxEntries + 10) // Get more than we need
      .then(scores => {
        // If we have more entries than maxEntries, remove the lowest scores
        if (scores.length > this.maxEntries) {
          const scoresToRemove = scores.slice(this.maxEntries);
          
          // Create a batch of delete operations
          const updates = {};
          scoresToRemove.forEach(score => {
            updates[score.id] = null; // null value deletes the entry
          });
          
          // Apply the batch delete
          return this.leaderboardRef.update(updates);
        }
        return Promise.resolve();
      });
  }

  /**
   * Check if the given score would place on the leaderboard
   * @param {number} score - Score to check
   * @returns {Promise<boolean>} Promise that resolves to true if the score places on the leaderboard
   */
  wouldPlaceOnLeaderboard(score) {
    return this.getTopScores()
      .then(scores => {
        // If we have fewer than maxEntries, any score places
        if (scores.length < this.maxEntries) {
          return true;
        }
        
        // Otherwise, check if this score is higher than the lowest on the board
        const lowestScore = scores[scores.length - 1].score;
        return score > lowestScore;
      });
  }
} 