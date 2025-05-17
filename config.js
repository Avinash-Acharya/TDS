// --- Game Configuration ---
const TILE_SIZE = 32; // Size of each tile in pixels
const MAP_WIDTH_TILES = 25; // e.g., 25 tiles wide
const MAP_HEIGHT_TILES = 18; // e.g., 18 tiles tall

const PLAYER_SPEED = 3;
const ENEMY_SPEED = 1.5;
const PLAYER_HEALTH_MAX = 10;

// Dark Souls Mechanics additions
const DODGE_DURATION = 15; // in game ticks (e.g., 15 ticks = 0.25 seconds at 60FPS)
const DODGE_COOLDOWN = 45; // in game ticks
const DODGE_SPEED_MULTIPLIER = 2.0; // How much faster player moves during dodge

const PARRY_DURATION = 20; // Total duration parry attempt lasts
const PARRY_WINDOW = 8; // Active frames for successful parry (at the start of PARRY_DURATION)
const PARRY_COOLDOWN = 60;

const ENEMY_RECOIL_DURATION = 10; // How long enemy recoils after being hit
const ENEMY_STUN_DURATION = 90; // How long enemy is stunned after successful parry
const IMPACT_FRAME_DURATION = 5; // Duration of impact frame in game ticks
const PLAYER_DAMAGE_SHAKE_DURATION = 10; // Duration of screen shake when player takes damage

// Particle Effects Configuration
const PARTICLE_LIFESPAN = 30; // In game ticks
const PARTICLE_COUNT_ON_ENEMY_DEATH = 15;
const PARTICLE_SPEED = 2;
const PARTICLE_COLOR = "#FF00FF"; // Magenta, same as enemy color for now

// Stamina System (Example Values)
const STAMINA_MAX = 100;
const STAMINA_REGEN_RATE = 0.5; // Stamina points per game tick
const STAMINA_COST_ATTACK = 15;
const STAMINA_COST_DODGE = 25;
const STAMINA_COST_PARRY = 10; // Cost to attempt a parry
