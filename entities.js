// --- Data Structures ---
// Depends on: TILE_SIZE, PLAYER_HEALTH_MAX, ENEMY_SPEED, PLAYER_SPEED from config.js

function createPlayer(x, y) {
  return {
    x: x * TILE_SIZE,
    y: y * TILE_SIZE,
    width: TILE_SIZE * 0.8,
    height: TILE_SIZE * 0.8,
    health: PLAYER_HEALTH_MAX,
    dx: 0,
    dy: 0,
    speed: PLAYER_SPEED, // Added player speed for dodge calculations
    hitFlash: 0, // Counter for hit flash effect
    attackCooldown: 0,
    attackDuration: 0,
    attacking: false,
    attackDir: { x: 1, y: 0 }, // Default attack direction
    isDodging: false,
    dodgeCooldown: 0,
    dodgeDuration: 0,
    dodgeInvulnerability: false,
    isParrying: false,
    parryCooldown: 0,
    parryDuration: 0,
    parryWindow: 0, // Time window for a successful parry
    stamina: 100, // Max stamina
    maxStamina: 100,
    staminaRegenRate: 1, // Points per game tick
    staminaCostAttack: 20,
    staminaCostDodge: 30,
    staminaCostParry: 10, // Cost to attempt a parry
  };
}

function createEnemy(x, y) {
  return {
    x: x * TILE_SIZE,
    y: y * TILE_SIZE,
    width: TILE_SIZE * 0.8,
    height: TILE_SIZE * 0.8,
    speed: ENEMY_SPEED,
    health: 3, // Enemies can take a few hits
    aiState: "idle", // idle, chasing, attacking, recoiling, stunned
    attackPattern: null, // To be defined (e.g., 'rush', 'ranged_then_melee', 'circle_strafe')
    attackCooldown: 0,
    attackWindUp: 0, // Time before an attack lands
    attackActive: 0, // Duration the attack hitbox is active
    isAttacking: false,
    attackType: null, // e.g., 'lunge', 'swipe'
    detectionRadius: TILE_SIZE * 8,
    attackRadius: TILE_SIZE * 1.5,
    lastKnownPlayerPos: null,
    recoilTimer: 0, // Timer for how long enemy recoils after being hit
    stunTimer: 0, // Timer for how long enemy is stunned after being parried
    patrolPoint: null, // For idle patrolling
    patrolTimer: 0,
  };
}
