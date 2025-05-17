// --- Collision Detection ---
// Depends on: TILE_SIZE, MAP_WIDTH_TILES, MAP_HEIGHT_TILES from config.js
// Depends on: levelGrid from state.js

function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

function checkWallCollision(object, nextX, nextY) {
  const objectTileX1 = Math.floor(nextX / TILE_SIZE); // TILE_SIZE from config.js
  const objectTileY1 = Math.floor(nextY / TILE_SIZE);
  const objectTileX2 = Math.floor((nextX + object.width) / TILE_SIZE);
  const objectTileY2 = Math.floor((nextY + object.height) / TILE_SIZE);

  const tilesToCheck = [
    { x: objectTileX1, y: objectTileY1 },
    { x: objectTileX2, y: objectTileY1 },
    { x: objectTileX1, y: objectTileY2 },
    { x: objectTileX2, y: objectTileY2 },
  ];

  for (const tile of tilesToCheck) {
    if (
      tile.x >= 0 &&
      tile.x < MAP_WIDTH_TILES && // MAP_WIDTH_TILES from config.js
      tile.y >= 0 &&
      tile.y < MAP_HEIGHT_TILES // MAP_HEIGHT_TILES from config.js
    ) {
      if (levelGrid[tile.y][tile.x] === 1) {
        // levelGrid from state.js
        return true; // Collision with wall
      }
    } else {
      return true; // Collision with map boundary
    }
  }
  return false;
}
