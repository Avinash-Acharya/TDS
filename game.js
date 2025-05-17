// Main Game File
// This file orchestrates the game, relying on functions and variables
// defined in other files (config.js, dom.js, state.js, utils.js, etc.)
// Ensure all other JS files are loaded before this one in index.html,
// or switch to ES6 modules.

// --- Game Flow ---
// Dependencies are met by loading other script files first in HTML.

function handlePlayerDeath() {
  player.health = 0; // player from state.js
  updateHealthUI(); // from uiUpdates.js
  deathCount++; // deathCount from state.js
  updateDeathCountUI(); // from uiUpdates.js
  displayWatcherMessage("death"); // from utils.js
  gameOverScreen.style.display = "flex"; // gameOverScreen from dom.js
}

function spawnEnemies(count) {
  for (let i = 0; i < count; i++) {
    let spawnPos;
    let attempts = 0;
    do {
      const randX = Math.floor(
        seededRandom(gameSeed + enemies.length + i + attempts) * MAP_WIDTH_TILES // seededRandom from utils.js, gameSeed, enemies from state.js, MAP_WIDTH_TILES from config.js
      );
      const randY = Math.floor(
        seededRandom(gameSeed * 2 + enemies.length + i + attempts) *
          MAP_HEIGHT_TILES // MAP_HEIGHT_TILES from config.js
      );
      if (levelGrid[randY][randX] === 0) {
        // levelGrid from state.js
        const distToPlayer = Math.sqrt(
          Math.pow(player.x / TILE_SIZE - randX, 2) + // player from state.js, TILE_SIZE from config.js
            Math.pow(player.y / TILE_SIZE - randY, 2)
        );
        if (distToPlayer > 5) {
          spawnPos = { x: randX, y: randY };
        }
      }
      attempts++;
    } while (!spawnPos && attempts < 100);

    if (spawnPos) {
      enemies.push(createEnemy(spawnPos.x, spawnPos.y)); // enemies from state.js, createEnemy from entities.js
    } else {
      console.warn("Could not find a suitable spawn position for an enemy.");
      // Fallback: Try spawning at a corner if map allows and is a floor tile
      if (
        MAP_WIDTH_TILES > 1 &&
        MAP_HEIGHT_TILES > 1 &&
        levelGrid[1][MAP_WIDTH_TILES - 2] === 0
      ) {
        enemies.push(createEnemy(MAP_WIDTH_TILES - 2, 1));
      } else if (levelGrid[0][0] === 0) {
        // Absolute fallback to 0,0 if it's a floor
        enemies.push(createEnemy(0, 0));
      }
    }
  }
}

function resetGame() {
  gameSeed = Date.now(); // gameSeed from state.js
  generateLevel(); // from levelGenerator.js

  const startPos = getSpawnPosition(); // from levelGenerator.js
  player = createPlayer(startPos.x, startPos.y); // player from state.js, createPlayer from entities.js
  // player.attackDir is initialized in createPlayer

  enemies = []; // enemies from state.js
  spawnEnemies(3); // Initial enemies

  player.health = PLAYER_HEALTH_MAX; // PLAYER_HEALTH_MAX from config.js
  enemyKillCount = 0; // enemyKillCount from state.js

  updateHealthUI(); // from uiUpdates.js
  // deathCount persists across resets

  gameOverScreen.style.display = "none"; // gameOverScreen from dom.js
  displayWatcherMessage("spawn"); // from utils.js
  gameLoop(); // Restart the game loop
}

function gameLoop() {
  if (player.health > 0) {
    // player from state.js
    updateGame(); // from gameCore.js
    drawGame(); // from gameCore.js
    requestAnimationFrame(gameLoop);
  } else {
    // Ensure game over screen is shown if health is 0 or less
    if (gameOverScreen.style.display === "none") {
      // gameOverScreen from dom.js
      handlePlayerDeath(); // Call again to ensure UI is correct
    }
  }
}

// --- Initialization ---
function init() {
  updateDeathCountUI(); // from uiUpdates.js
  initializeInputHandlers(); // from inputHandlers.js - sets up global event listeners

  // Add event listeners for restart buttons
  restartButton.addEventListener("click", resetGame); // restartButton from dom.js
  gameOverRestartButton.addEventListener("click", resetGame); // gameOverRestartButton from dom.js

  resetGame(); // This will also call gameLoop for the first time
}

// --- Start Game ---
init();
