// --- DOM Elements ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const healthValueUI = document.getElementById("healthValue");
const healthBarUI = document.getElementById("healthBar");
const deathCountUI = document.getElementById("deathCount");
const watcherMessageUI = document.getElementById("watcherMessage");
const restartButton = document.getElementById("restartButton"); // General restart button
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverRestartButton = document.getElementById("gameOverRestartButton");

// Set canvas dimensions using config variables
// Assumes config.js is loaded before this file
canvas.width = MAP_WIDTH_TILES * TILE_SIZE;
canvas.height = MAP_HEIGHT_TILES * TILE_SIZE;
