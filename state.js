// --- Game State ---
let player; // Will be initialized in game.js
let enemies = [];
let levelGrid = []; // 0 for floor, 1 for wall
let deathCount = 0;
let enemyKillCount = 0;
let gameSeed = Date.now(); // For procedural generation, fixed per session initially
let impactFrame = 0; // Duration of the impact frame effect
let playerDamagedShakeTimer = 0; // Duration of the screen shake when player takes damage
let particles = []; // Array to store active particles

// --- Watcher Messages ---
const watcherMessages = {
  spawn: [
    "You're back. Again.",
    "Let's see how long you last this time.",
    "The cycle continues.",
    "Welcome to your personal hell.",
    "They are waiting for you.",
  ],
  death: [
    "Pathetic.",
    "As I expected.",
    "You disappoint me. Every time.",
    "Is that all you've got?",
    "Perhaps this isn't for you.",
    "Git gud.",
    "You died.",
  ],
  kill: [
    // Messages for every 3rd kill
    "Impressive. For a mortal.",
    "You're getting the hang of this... or are you?",
    "Don't get cocky.",
    "They felt that. Good.",
    "More fuel for the fire.",
    "One less threat... for now.",
  ],
  parry_success: [
    "Denied!",
    "Too predictable!",
    "A momentary advantage.",
    "Nicely timed!",
    "They didn't see that coming!",
  ],
  stamina_low: [
    "Running on fumes!",
    "Careful, you're exhausted.",
    "Need to catch your breath!",
  ],
  enemy_taunt: [
    "Is that all?",
    "You fight like a novice.",
    "My turn!",
    "You can't win!",
    "Feel despair!",
  ],
};
