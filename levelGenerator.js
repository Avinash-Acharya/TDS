// --- Level Generation (Simple Random Walk) ---
// Depends on: levelGrid, gameSeed from state.js
// Depends on: MAP_HEIGHT_TILES, MAP_WIDTH_TILES from config.js
// Depends on: seededRandom from utils.js

function generateLevel() {
  levelGrid = Array(MAP_HEIGHT_TILES)
    .fill(null)
    .map(() => Array(MAP_WIDTH_TILES).fill(1));

  let currentX = Math.floor(MAP_WIDTH_TILES / 2);
  let currentY = Math.floor(MAP_HEIGHT_TILES / 2);
  levelGrid[currentY][currentX] = 0;

  const directions = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  // Increased density of pathways for a more claustrophobic, challenging feel
  const numTilesToCarve = Math.floor(MAP_WIDTH_TILES * MAP_HEIGHT_TILES * 0.45); // Increased from 0.3

  for (let i = 0; i < numTilesToCarve; i++) {
    const dir =
      directions[Math.floor(seededRandom(gameSeed + i) * directions.length)];
    // Try to carve longer, straighter corridors, but with some randomness
    let length = Math.floor(seededRandom(gameSeed + i * 2) * 5) + 2; // Corridors of 2-6 units long
    let prevX = currentX;
    let prevY = currentY;

    for (let l = 0; l < length; l++) {
      let nextX = currentX + dir[0];
      let nextY = currentY + dir[1];

      // Check bounds more strictly to prevent carving into edges too much
      if (
        nextX > 1 && // Keep a 1-tile border
        nextX < MAP_WIDTH_TILES - 2 &&
        nextY > 1 && // Keep a 1-tile border
        nextY < MAP_HEIGHT_TILES - 2
      ) {
        if (levelGrid[nextY][nextX] === 1) {
          // Only carve if it's a wall
          levelGrid[nextY][nextX] = 0;
          currentX = nextX;
          currentY = nextY;
        }
      } else {
        // If we hit a boundary, try to backtrack and find a new path from a random floor tile
        currentX = prevX;
        currentY = prevY;
        break; // Stop carving this corridor
      }
    }

    // If carving stopped or failed to extend, pick a new random floor tile to start from
    // This helps create more disconnected areas and less of a single sprawling maze
    if (currentX === prevX && currentY === prevY) {
      let floorTiles = [];
      for (let r = 0; r < MAP_HEIGHT_TILES; r++) {
        for (let c = 0; c < MAP_WIDTH_TILES; c++) {
          if (levelGrid[r][c] === 0) floorTiles.push({ x: c, y: r });
        }
      }
      if (floorTiles.length > 0) {
        const randomTile =
          floorTiles[
            Math.floor(seededRandom(gameSeed + i + 1) * floorTiles.length)
          ];
        currentX = randomTile.x;
        currentY = randomTile.y;
      }
    }
  }

  // Add some more random single wall removals to create more open, but still tight, spaces
  const extraOpenings = Math.floor(MAP_WIDTH_TILES * MAP_HEIGHT_TILES * 0.05);
  for (let k = 0; k < extraOpenings; k++) {
    const rx =
      Math.floor(seededRandom(gameSeed - k) * (MAP_WIDTH_TILES - 2)) + 1;
    const ry =
      Math.floor(seededRandom(gameSeed - k - 1) * (MAP_HEIGHT_TILES - 2)) + 1;
    if (levelGrid[ry][rx] === 1) {
      // If it's a wall
      let adjacentFloors = 0;
      if (levelGrid[ry - 1][rx] === 0) adjacentFloors++;
      if (levelGrid[ry + 1][rx] === 0) adjacentFloors++;
      if (levelGrid[ry][rx - 1] === 0) adjacentFloors++;
      if (levelGrid[ry][rx + 1] === 0) adjacentFloors++;
      if (adjacentFloors >= 1 && adjacentFloors <= 2) {
        // Only open up if it connects to 1 or 2 floor tiles, not creating huge open areas
        levelGrid[ry][rx] = 0;
      }
    }
  }
}

function getSpawnPosition() {
  // Depends on levelGrid from state.js, MAP_HEIGHT_TILES, MAP_WIDTH_TILES from config.js
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      if (levelGrid[y][x] === 0) return { x, y };
    }
  }
  return { x: 1, y: 1 }; // Fallback
}
