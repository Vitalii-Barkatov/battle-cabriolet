# Cabriolet Game

A retro-style 2D top-down game inspired by classic "tanks"/"battle city" games on the NES.

## Game Overview

In Cabriolet Game, you control a drone-like platform navigating through a dangerous environment. Your missions include evacuation (rescuing wounded soldiers) and delivery (transporting cargo).

### Core Mechanics

- Move your platform using arrow keys (←↑↓→)
- Activate Electronic Warfare (EW) with the Space key (3-second duration, then 10-second cooldown)
- Avoid or destroy incoming FPV drones
- Complete missions by reaching objectives and returning to your starting point
- Different terrain types affect movement speed (asphalt, dirt, water)
- Watch out for mines!

### Scoring

- +10 points for each completed mission
- +5 points for each destroyed drone
- Game Over on collision with a drone or mine
- Use the donation mechanic to revive if killed

## How to Play

1. Open `index.html` in a modern web browser
2. Click "Start Game" to begin
3. Complete missions and destroy enemy drones to earn points
4. If you're destroyed, you can enter a promo code (simulating a donation) to continue

## Game Controls

- Arrow keys (←↑↓→): Move the platform
- Space: Activate Electronic Warfare (EW)
- M: Toggle music on/off

## Technical Details

The game is built using vanilla JavaScript and HTML5 Canvas, with a modular architecture:

- **Game**: Main controller that initializes and orchestrates all components
- **AudioManager**: Handles loading and playing all game audio
- **MapGenerator**: Generates random tile-based maps for each mission
- **Player**: Manages the platform's position, movement, and abilities
- **Drone & DroneManager**: Controls enemy drones that pursue the player
- **MissionManager**: Handles mission types, objectives, and completion
- **UI**: Manages all user interface elements and interactions

## Development

### Project Structure

```
cabriolet-game/
│
├── index.html        # Main HTML file
├── css/
│   └── styles.css    # Game styles
├── js/
│   ├── audioManager.js   # Audio handling
│   ├── drone.js          # Enemy drone logic
│   ├── game.js           # Main game controller
│   ├── main.js           # Entry point
│   ├── mapGenerator.js   # Map generation
│   ├── missionManager.js # Mission handling
│   ├── player.js         # Player control
│   ├── ui.js             # User interface
│   └── utils.js          # Utility functions
└── assets/
    └── audio/           # Game audio files (placeholder)
```

### Asset Requirements

The game requires the following audio assets (not included):

- `menu_music.mp3`: Background music for menu screen
- `game_music.mp3`: Background music during gameplay
- `platform_move.mp3`: Sound when the platform moves
- `drone_hum.mp3`: Warning sound before drone appears
- `reb_activate.mp3`: Sound when EW is activated
- `drone_destroyed.mp3`: Sound when a drone is destroyed
- `mission_complete.mp3`: Sound when mission is completed
- `game_over.mp3`: Sound when game is over
- `button_click.mp3`: Sound when a button is clicked

## Future Improvements

- Mobile support with touch controls
- More diverse mission types
- Power-ups and special abilities
- Multiple levels with increasing difficulty
- Multiplayer capabilities

## License

This project is available under the MIT License. See the LICENSE file for more details.

---

Enjoy the game! 