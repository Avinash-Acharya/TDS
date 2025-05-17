// --- Event Listeners & Input State ---
// Depends on: player from state.js
// Depends on: PLAYER_SPEED, DODGE_SPEED_MULTIPLIER, DODGE_DURATION, DODGE_COOLDOWN, PARRY_DURATION, PARRY_COOLDOWN, PARRY_WINDOW from config.js

const moveKeys = {
  w: { x: 0, y: -1, pressed: false },
  arrowup: { x: 0, y: -1, pressed: false },
  s: { x: 0, y: 1, pressed: false },
  arrowdown: { x: 0, y: 1, pressed: false },
  a: { x: -1, y: 0, pressed: false },
  arrowleft: { x: -1, y: 0, pressed: false },
  d: { x: 1, y: 0, pressed: false },
  arrowright: { x: 1, y: 0, pressed: false },
};

const attackKeys = [" ", "enter"]; // Space or Enter for attack
const dodgeKey = "shift"; // Shift for dodge
const parryKey = "control"; // Control for parry

function initializeInputHandlers() {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    // If game is over and Enter is pressed, restart and do nothing else for this key press.
    if (key === "enter" && gameOverScreen.style.display !== "none") {
      resetGame();
      e.preventDefault(); // Prevent default action for 'Enter'
      return; // Stop further processing for this key event in this handler
    }

    // Movement Keys
    if (moveKeys[key] && !player.isDodging && !player.isParrying) {
      // Prevent movement during dodge/parry
      e.preventDefault();
      moveKeys[key].pressed = true;
    }

    // Attack Key
    if (
      attackKeys.includes(key) &&
      player.attackCooldown <= 0 &&
      !player.attacking &&
      !player.isDodging &&
      !player.isParrying &&
      player.stamina >= player.staminaCostAttack
    ) {
      e.preventDefault();
      player.attacking = true;
      player.attackDuration = 10; // Duration in game ticks
      player.attackCooldown = 20; // Cooldown in game ticks
      player.stamina -= player.staminaCostAttack;

      // Determine attack direction based on current movement or last movement
      let currentMoveDir = { x: 0, y: 0 };
      for (const k in moveKeys) {
        if (moveKeys[k].pressed) {
          currentMoveDir.x += moveKeys[k].x;
          currentMoveDir.y += moveKeys[k].y;
        }
      }
      if (currentMoveDir.x !== 0 || currentMoveDir.y !== 0) {
        player.attackDir = {
          x: Math.sign(currentMoveDir.x),
          y: Math.sign(currentMoveDir.y),
        };
      } else if (player.attackDir.x === 0 && player.attackDir.y === 0) {
        // If no movement and no prior attack direction, default to right
        player.attackDir = { x: 1, y: 0 };
      }
      // Prioritize horizontal attack if moving diagonally
      if (player.attackDir.x !== 0 && player.attackDir.y !== 0) {
        player.attackDir.y = 0;
      }
    }

    // Dodge Key
    if (
      key === dodgeKey &&
      !player.isDodging &&
      player.dodgeCooldown <= 0 &&
      !player.attacking && // Cannot dodge while attacking
      player.stamina >= player.staminaCostDodge
    ) {
      e.preventDefault();
      player.isDodging = true;
      player.dodgeInvulnerability = true;
      player.dodgeDuration = DODGE_DURATION; // From config.js
      player.dodgeCooldown = DODGE_COOLDOWN; // From config.js
      player.stamina -= player.staminaCostDodge;

      // Dodge direction based on current movement or last attack direction
      let dodgeDir = { x: player.attackDir.x, y: player.attackDir.y }; // Default to last attack/move dir
      let currentMoveDir = { x: 0, y: 0 };
      for (const k in moveKeys) {
        if (moveKeys[k].pressed) {
          currentMoveDir.x += moveKeys[k].x;
          currentMoveDir.y += moveKeys[k].y;
        }
      }
      if (currentMoveDir.x !== 0 || currentMoveDir.y !== 0) {
        dodgeDir = {
          x: Math.sign(currentMoveDir.x),
          y: Math.sign(currentMoveDir.y),
        };
      }

      // If no specific direction, dodge backwards from where player is facing (if possible) or default
      if (dodgeDir.x === 0 && dodgeDir.y === 0) {
        dodgeDir = { x: -player.attackDir.x, y: -player.attackDir.y }; // try to dodge opposite to facing
        if (dodgeDir.x === 0 && dodgeDir.y === 0) dodgeDir = { x: 1, y: 0 }; // final fallback
      }

      player.dx = dodgeDir.x * player.speed * DODGE_SPEED_MULTIPLIER; // From config.js
      player.dy = dodgeDir.y * player.speed * DODGE_SPEED_MULTIPLIER;

      // Normalize diagonal dodge speed
      if (player.dx !== 0 && player.dy !== 0) {
        player.dx /= Math.sqrt(2);
        player.dy /= Math.sqrt(2);
      }
    }

    // Parry Key
    if (
      key === parryKey &&
      !player.isParrying &&
      player.parryCooldown <= 0 &&
      !player.attacking && // Cannot parry while attacking
      !player.isDodging && // Cannot parry while dodging
      player.stamina >= player.staminaCostParry
    ) {
      e.preventDefault();
      player.isParrying = true;
      player.parryDuration = PARRY_DURATION; // From config.js
      player.parryWindow = PARRY_WINDOW; // From config.js - active parry frames
      player.parryCooldown = PARRY_COOLDOWN; // From config.js
      player.stamina -= player.staminaCostParry;
      // Player is stationary during parry attempt
      player.dx = 0;
      player.dy = 0;
    }

    // Update player movement direction if not dodging or parrying
    if (!player.isDodging && !player.isParrying) {
      updatePlayerMovementDirection();
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (moveKeys[key]) {
      e.preventDefault();
      moveKeys[key].pressed = false;
    }

    // Update player movement direction if not dodging or parrying
    if (!player.isDodging && !player.isParrying) {
      updatePlayerMovementDirection();
    }
  });
}

function updatePlayerMovementDirection() {
  if (player.isDodging || player.isParrying) return; // Movement is handled by dodge/parry logic

  player.dx = 0;
  player.dy = 0;
  let currentMoveDir = { x: 0, y: 0 };

  if (moveKeys["w"].pressed || moveKeys["arrowup"].pressed) {
    player.dy = -player.speed;
    currentMoveDir.y = -1;
  }
  if (moveKeys["s"].pressed || moveKeys["arrowdown"].pressed) {
    player.dy = player.speed;
    currentMoveDir.y = 1;
  }
  if (moveKeys["a"].pressed || moveKeys["arrowleft"].pressed) {
    player.dx = -player.speed;
    currentMoveDir.x = -1;
  }
  if (moveKeys["d"].pressed || moveKeys["arrowright"].pressed) {
    player.dx = player.speed;
    currentMoveDir.x = 1;
  }

  // Normalize diagonal movement
  if (player.dx !== 0 && player.dy !== 0) {
    player.dx /= Math.sqrt(2);
    player.dy /= Math.sqrt(2);
  }

  // Update attackDir based on movement, but not if player is currently attacking
  if (!player.attacking) {
    if (currentMoveDir.x !== 0 || currentMoveDir.y !== 0) {
      if (currentMoveDir.x !== 0 && currentMoveDir.y !== 0) {
        // If moving diagonally, prioritize horizontal for attackDir
        player.attackDir = { x: currentMoveDir.x, y: 0 };
      } else {
        player.attackDir = currentMoveDir;
      }
    }
    // If no movement, attackDir remains as it was (last direction faced)
  }
}
