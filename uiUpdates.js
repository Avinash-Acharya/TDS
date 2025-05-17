// --- UI Updates ---
// Depends on: healthBar, healthValue, deathCountUI, enemyKillCountUI from dom.js
// Depends on: player from state.js

function updateHealthUI() {
  const healthPercentage = (player.health / player.maxHealth) * 100; // player.maxHealth should be PLAYER_HEALTH_MAX from config
  healthBar.style.width = healthPercentage + "%";
  healthValue.textContent = player.health;
}

function updateDeathCountUI() {
  deathCountUI.textContent = deathCount; // deathCount from state.js
}

function updateEnemyKillCountUI() {
  enemyKillCountUI.textContent = enemyKillCount; // enemyKillCount from state.js
}

// New UI function for Stamina
function updateStaminaUI() {
  const staminaBar = document.getElementById("staminaBar"); // Assuming you add a staminaBar element to index.html
  const staminaValue = document.getElementById("staminaValue"); // Assuming you add a staminaValue element
  if (staminaBar && staminaValue && player) {
    const staminaPercentage = (player.stamina / player.maxStamina) * 100;
    staminaBar.style.width = staminaPercentage + "%";
    staminaValue.textContent = Math.floor(player.stamina);

    // Optional: Visual cue for low stamina
    if (player.stamina < player.staminaCostDodge) {
      // Example threshold
      staminaBar.style.background = "orange";
      if (player.stamina < player.staminaCostAttack) {
        staminaBar.style.background = "red";
      }
    } else {
      staminaBar.style.background = "#00cc00"; // Default green stamina bar
    }
  }
}
