// --- Game Logic Core ---
// Depends on: player, enemies, enemyKillCount, impactFrame, playerDamagedShakeTimer, particles from state.js
// Depends on: checkWallCollision, checkCollision from collision.js
// Depends on: TILE_SIZE from config.js
// Depends on: updateHealthUI from uiUpdates.js
// Depends on: handlePlayerDeath (from main game file - game.js)
// Depends on: displayWatcherMessage from utils.js
// Depends on: spawnEnemies (from main game file - game.js)
// Depends on: ctx, canvas from dom.js
// Depends on: levelGrid from state.js; MAP_HEIGHT_TILES, MAP_WIDTH_TILES from config.js
// Depends on: PLAYER_SPEED, DODGE_SPEED_MULTIPLIER, DODGE_DURATION, PARRY_DURATION, PARRY_WINDOW, ENEMY_RECOIL_DURATION, ENEMY_STUN_DURATION, IMPACT_FRAME_DURATION, PLAYER_DAMAGE_SHAKE_DURATION, PARTICLE_COUNT_ON_ENEMY_DEATH, PARTICLE_SPEED, PARTICLE_LIFESPAN, PARTICLE_COLOR from config.js

function updateGame() {
  // Update Player State (Stamina, Cooldowns, Durations)
  updatePlayerState();
  
  // Update hit flash effect
  if (player.hitFlash > 0) {
    player.hitFlash--;
  }

  // Player movement & actions
  if (player.isDodging) {
    let nextPlayerX = player.x + player.dx;
    let nextPlayerY = player.y + player.dy;
    if (!checkWallCollision(player, nextPlayerX, player.y)) {
      player.x = nextPlayerX;
    }
    if (!checkWallCollision(player, player.x, nextPlayerY)) {
      player.y = nextPlayerY;
    }
    createPlayerDodgeParticles(player); // Create dodge particles
  } else if (!player.isParrying) {
    let nextPlayerX = player.x + player.dx;
    let nextPlayerY = player.y + player.dy;

    if (!checkWallCollision(player, nextPlayerX, player.y)) {
      player.x = nextPlayerX;
    }
    if (!checkWallCollision(player, player.x, nextPlayerY)) {
      player.y = nextPlayerY;
    }
  }

  enemies.forEach((enemy, enemyIndex) => {
    if (enemy.stunTimer > 0) {
      enemy.stunTimer--;
      enemy.aiState = "stunned";
      return;
    }

    if (enemy.recoilTimer > 0) {
      enemy.recoilTimer--;
      if (enemy.recoilTimer <= 0) {
        enemy.aiState = "idle";
      } else {
        return;
      }
    }

    updateEnemyAI(enemy);

    if (
      enemy.aiState === "chasing" ||
      (enemy.aiState === "attacking" && enemy.attackWindUp > 0)
    ) {
      const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      const enemyNextX = enemy.x + Math.cos(angle) * enemy.speed;
      const enemyNextY = enemy.y + Math.sin(angle) * enemy.speed;

      if (!checkWallCollision(enemy, enemyNextX, enemy.y)) {
        enemy.x = enemyNextX;
      }
      if (!checkWallCollision(enemy, enemy.x, enemyNextY)) {
        enemy.y = enemyNextY;
      }
    }

    if (enemy.isAttacking && enemy.attackActive > 0) {
      const enemyAttackHitbox = {
        x: enemy.x - TILE_SIZE * 0.25,
        y: enemy.y - TILE_SIZE * 0.25,
        width: enemy.width + TILE_SIZE * 0.5,
        height: enemy.height + TILE_SIZE * 0.5,
      };

      if (checkCollision(enemyAttackHitbox, player)) {
        if (player.isParrying && player.parryWindow > 0) {
          enemy.aiState = "stunned";
          enemy.stunTimer = ENEMY_STUN_DURATION;
          enemy.isAttacking = false;
          enemy.attackActive = 0;
          player.isParrying = false;
          player.parryWindow = 0;
          displayWatcherMessage("parry_success");
          createParryParticles(player.x + player.width / 2, player.y + player.height / 2); // Create parry particles        } else if (!player.dodgeInvulnerability) {
          player.health -= 1;
          playerDamagedShakeTimer = PLAYER_DAMAGE_SHAKE_DURATION; // Trigger screen shake
          
          // Create damaged particles
          createPlayerDamagedParticles(player);
          
          // Add a brief red flash effect
          player.hitFlash = 10; // Flash duration
          
          updateHealthUI();
          if (player.health <= 0) {
            handlePlayerDeath();
          }
        }
      }
    }

    if (player.attacking) {
      const attackReach = TILE_SIZE * 0.7;
      let attackHitbox = { x: 0, y: 0, width: 0, height: 0 };

      if (player.attackDir.x !== 0) {
        attackHitbox.width = TILE_SIZE * 1.2;
        attackHitbox.height = player.height * 0.9;
        attackHitbox.y = player.y + player.height * 0.05;
        if (player.attackDir.x > 0)
          attackHitbox.x = player.x + player.width * 0.5;
        else attackHitbox.x = player.x - TILE_SIZE * 0.7;
      } else if (player.attackDir.y !== 0) {
        attackHitbox.height = TILE_SIZE * 1.2;
        attackHitbox.width = player.width * 0.9;
        attackHitbox.x = player.x + player.width * 0.05;
        if (player.attackDir.y > 0)
          attackHitbox.y = player.y + player.height * 0.5;
        else attackHitbox.y = player.y - TILE_SIZE * 0.7;
      }

      if (checkCollision(attackHitbox, enemy) && enemy.stunTimer <= 0) {
        enemy.health -= 1;
        enemy.aiState = "recoiling";
        enemy.recoilTimer = ENEMY_RECOIL_DURATION;
        impactFrame = IMPACT_FRAME_DURATION; // Trigger impact frame on successful hit
        const knockbackStrength = TILE_SIZE * 0.3;
        let kbX = enemy.x + player.attackDir.x * knockbackStrength;
        let kbY = enemy.y + player.attackDir.y * knockbackStrength;
        if (!checkWallCollision(enemy, kbX, enemy.y)) enemy.x = kbX;
        if (!checkWallCollision(enemy, enemy.x, kbY)) enemy.y = kbY;

        if (enemy.health <= 0) {
          enemies.splice(enemyIndex, 1);
          enemyKillCount++;
          createEnemyDeathParticles(enemy); // Create particles on enemy death
          if (enemyKillCount % 3 === 0) {
            displayWatcherMessage("kill");
          }
          spawnEnemies(1);
        }
      }
    }
  });

  if (player.health <= 0) {
    return;
  }

  if (impactFrame > 0) {
    impactFrame--;
  }
  if (playerDamagedShakeTimer > 0) {
    playerDamagedShakeTimer--;
  }
  updateParticles();
}

function updatePlayerState() {
  if (player.stamina < player.maxStamina) {
    player.stamina = Math.min(
      player.maxStamina,
      player.stamina + player.staminaRegenRate
    );
  }
  updateStaminaUI();

  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.attacking) {
    player.attackDuration--;
    if (player.attackDuration <= 0) {
      player.attacking = false;
    }
  }
  if (player.dodgeCooldown > 0) player.dodgeCooldown--;
  if (player.isDodging) {
    player.dodgeDuration--;
    
    // Create dodge trail particles throughout the dodge animation
    if (player.dodgeDuration > 0 && player.dodgeDuration % 2 === 0) {
      createPlayerDodgeParticles(player);
    }
    
    if (player.dodgeDuration <= 0) {
      player.isDodging = false;
      player.dodgeInvulnerability = false;
      updatePlayerMovementDirection();
    }
  }

  if (player.parryCooldown > 0) player.parryCooldown--;
  if (player.isParrying) {
    if (player.parryWindow > 0) player.parryWindow--;
    player.parryDuration--;
    if (player.parryDuration <= 0) {
      player.isParrying = false;
      player.parryWindow = 0;
    }
  }
}

function updateEnemyAI(enemy) {
  if (enemy.aiState === "stunned" || enemy.aiState === "recoiling") return;

  const distanceToPlayer = Math.sqrt(
    Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
  );

  if (enemy.attackCooldown > 0) enemy.attackCooldown--;
  if (enemy.isAttacking) {
    if (enemy.attackWindUp > 0) {
      enemy.attackWindUp--;
      if (enemy.attackWindUp <= 0) {
        enemy.attackActive = 10;
      }
      return;
    }
    if (enemy.attackActive > 0) {
      enemy.attackActive--;
      if (enemy.attackActive <= 0) {
        enemy.isAttacking = false;
        enemy.attackCooldown = 60;
        enemy.aiState = "chasing";
      }
      return;
    }
  }

  if (distanceToPlayer <= enemy.detectionRadius) {
    enemy.lastKnownPlayerPos = { x: player.x, y: player.y };
    if (distanceToPlayer <= enemy.attackRadius && enemy.attackCooldown <= 0) {
      enemy.aiState = "attacking";
      enemy.isAttacking = true;
      enemy.attackType = Math.random() < 0.5 ? "lunge" : "swipe";
      enemy.attackWindUp = 30;
    } else if (enemy.aiState !== "attacking") {
      enemy.aiState = "chasing";
    }
  } else {
    if (enemy.lastKnownPlayerPos) {
      enemy.aiState = "idle";
      enemy.lastKnownPlayerPos = null;
    }
    if (enemy.aiState === "idle") {
      if (enemy.patrolTimer <= 0) {
        if (Math.random() < 0.1) {
          const patrolDist = TILE_SIZE * 3;
          enemy.patrolPoint = {
            x: enemy.x + (Math.random() * patrolDist * 2 - patrolDist),
            y: enemy.y + (Math.random() * patrolDist * 2 - patrolDist),
          };
        }
        enemy.patrolTimer = 120;
      } else {
        enemy.patrolTimer--;
        if (enemy.patrolPoint) {
          const angle = Math.atan2(
            enemy.patrolPoint.y - enemy.y,
            enemy.patrolPoint.x - enemy.x
          );
          const distToPatrol = Math.sqrt(
            Math.pow(enemy.patrolPoint.x - enemy.x, 2) +
              Math.pow(enemy.patrolPoint.y - enemy.y, 2)
          );
          if (distToPatrol > TILE_SIZE * 0.5) {
            const patrolNextX = enemy.x + Math.cos(angle) * enemy.speed * 0.5;
            const patrolNextY = enemy.y + Math.sin(angle) * enemy.speed * 0.5;
            if (!checkWallCollision(enemy, patrolNextX, enemy.y))
              enemy.x = patrolNextX;
            if (!checkWallCollision(enemy, enemy.x, patrolNextY))
              enemy.y = patrolNextY;
          } else {
            enemy.patrolPoint = null;
          }
        }
      }
    }
  }
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Camera Centering ---
  // Calculate the camera position to center the player
  let cameraX = player.x - canvas.width / 2 + player.width / 2;
  let cameraY = player.y - canvas.height / 2 + player.height / 2;

  // Translate the canvas context
  ctx.save(); // Save the current state
  ctx.translate(-cameraX, -cameraY);

  // Apply impact frame effect
  if (impactFrame > 0) {
    const intensity = impactFrame / IMPACT_FRAME_DURATION;
    const shakeX = (Math.random() - 0.5) * 10 * intensity;
    const shakeY = (Math.random() - 0.5) * 10 * intensity;
    ctx.translate(shakeX, shakeY);
  }

  // Apply player damage screen shake effect
  if (playerDamagedShakeTimer > 0) {
    const intensity = playerDamagedShakeTimer / PLAYER_DAMAGE_SHAKE_DURATION;
    const shakeX = (Math.random() - 0.5) * 15 * intensity; // Slightly stronger shake
    const shakeY = (Math.random() - 0.5) * 15 * intensity;
    ctx.translate(shakeX, shakeY);
  }
  // --- Map, Player, and Enemy Drawing ---  // Draw a background pattern/texture for the entire map area
  const patternSize = 200;
  for (let py = 0; py < canvas.height; py += patternSize) {
    for (let px = 0; px < canvas.width; px += patternSize) {
      const bgGradient = ctx.createRadialGradient(
        px + patternSize/2, py + patternSize/2, 0,
        px + patternSize/2, py + patternSize/2, patternSize
      );
      bgGradient.addColorStop(0, "#180818");
      bgGradient.addColorStop(1, "#100010");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(px, py, patternSize, patternSize);
    }
  }

  // Add some ambient floating particles in the background
  const time = Date.now() / 1000;
  for (let i = 0; i < 20; i++) {
    const particleX = (Math.sin(time * 0.1 + i * 50) * 0.5 + 0.5) * canvas.width;
    const particleY = (Math.cos(time * 0.15 + i * 30) * 0.5 + 0.5) * canvas.height;
    const size = Math.sin(time * 0.2 + i) * 1 + 2;
    
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#4040ff";
    ctx.beginPath();
    ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw map tiles
  for (let y = 0; y < MAP_HEIGHT_TILES; y++) {
    for (let x = 0; x < MAP_WIDTH_TILES; x++) {
      if (levelGrid[y][x] === 1) { // Wall tiles
        // Gradient for wall tiles to give them depth
        const wallGradient = ctx.createLinearGradient(
          x * TILE_SIZE, y * TILE_SIZE,
          x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE
        );
        wallGradient.addColorStop(0, "#563656");
        wallGradient.addColorStop(0.5, "#402040");
        wallGradient.addColorStop(1, "#351035");
        ctx.fillStyle = wallGradient;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Add 3D effect to walls by adding a lighter top edge and darker bottom edge
        ctx.fillStyle = "rgba(100, 70, 100, 0.5)"; 
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 3); // Top edge highlight
        ctx.fillStyle = "rgba(20, 10, 20, 0.5)";
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE - 3, TILE_SIZE, 3); // Bottom edge shadow
        
        // Add texture to walls
        ctx.fillStyle = "rgba(70, 30, 70, 0.5)";
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
        
        // Add some random stone patterns to walls
        if (Math.abs((x * 263 + y * 71) % 7) === 0) {
          const numCracks = Math.floor(Math.abs((x * 13 + y * 17) % 3)) + 1;
          ctx.strokeStyle = "rgba(80, 40, 80, 0.4)";
          ctx.lineWidth = 1;
          for (let c = 0; c < numCracks; c++) {
            const startX = x * TILE_SIZE + Math.floor((x * 29 + y * 31 + c * 13) % (TILE_SIZE - 8)) + 4;
            const startY = y * TILE_SIZE + Math.floor((x * 37 + y * 41 + c * 11) % (TILE_SIZE - 8)) + 4;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + (Math.floor((x * 7 + y * 5 + c * 3) % 7) - 3), 
                       startY + (Math.floor((x * 11 + y * 13 + c * 5) % 7) - 3));
            ctx.stroke();
          }
        }
        
        // Wall border
        ctx.strokeStyle = "#663366";
        ctx.lineWidth = 1;
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else { // Floor tiles
        // Gradient for floor tiles
        const floorGradient = ctx.createLinearGradient(
          x * TILE_SIZE, y * TILE_SIZE,
          x * TILE_SIZE + TILE_SIZE, y * TILE_SIZE + TILE_SIZE
        );
        floorGradient.addColorStop(0, "#231323");
        floorGradient.addColorStop(1, "#1a0a1a");
        ctx.fillStyle = floorGradient;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Add subtle floor pattern and variation
        const variation = (x * 37 + y * 23) % 4;
        if (variation === 0) {
          ctx.fillStyle = "rgba(50, 25, 50, 0.3)";
          ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        } else if (variation === 1) {
          ctx.fillStyle = "rgba(40, 15, 40, 0.2)";
          ctx.beginPath();
          ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 
                 TILE_SIZE/5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Add subtle floor lines
          ctx.strokeStyle = "rgba(40, 20, 40, 0.15)";
          ctx.lineWidth = 0.5;
          if (variation === 2) {
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE + 4, y * TILE_SIZE + 4);
            ctx.lineTo(x * TILE_SIZE + TILE_SIZE - 4, y * TILE_SIZE + TILE_SIZE - 4);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE + 4, y * TILE_SIZE + TILE_SIZE - 4);
            ctx.lineTo(x * TILE_SIZE + TILE_SIZE - 4, y * TILE_SIZE + 4);
            ctx.stroke();
          }
        }
        
        // Floor tile outline
        ctx.strokeStyle = "#331833";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }// Player drawing with improved aesthetics
  ctx.save();
  
  // Create a color based on player state
  let playerBaseColor = player.hitFlash > 0
    ? "#ff0000" // Red flash when hit
    : player.dodgeInvulnerability
    ? "#00a0ff" // Dodge blue
    : player.isParrying
    ? "#f0c000" // Parry gold
    : "#00e0e0"; // Default cyan
  
  // Draw player body (rounded rectangle)
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  const radius = Math.min(player.width, player.height) / 5;
  
  // Create gradient for player
  const playerGradient = ctx.createRadialGradient(
    centerX, centerY, 1,
    centerX, centerY, player.width / 1.5
  );
  playerGradient.addColorStop(0, playerBaseColor);
  playerGradient.addColorStop(0.7, playerBaseColor);
  playerGradient.addColorStop(1, '#004040');
  
  ctx.fillStyle = playerGradient;
  
  // Draw rounded rectangle for player body
  ctx.beginPath();
  ctx.moveTo(player.x + radius, player.y);
  ctx.lineTo(player.x + player.width - radius, player.y);
  ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + radius);
  ctx.lineTo(player.x + player.width, player.y + player.height - radius);
  ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - radius, player.y + player.height);
  ctx.lineTo(player.x + radius, player.y + player.height);
  ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - radius);
  ctx.lineTo(player.x, player.y + radius);
  ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
  ctx.closePath();
  ctx.fill();
  
  // Add player outline
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Add directional indicator (show which way player is facing)
  const dirX = player.attackDir.x;
  const dirY = player.attackDir.y;
  const indicatorSize = player.width / 3;
  
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(
    centerX + dirX * (player.width / 2 - 2),
    centerY + dirY * (player.height / 2 - 2)
  );
  ctx.arc(centerX, centerY, indicatorSize, 
    Math.atan2(dirY, dirX) - 0.3, 
    Math.atan2(dirY, dirX) + 0.3);
  ctx.closePath();
  ctx.fill();
  
  // Add glowing effect when player has special state
  if (player.dodgeInvulnerability || player.isParrying) {
    ctx.globalAlpha = 0.5;
    ctx.shadowColor = playerBaseColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, player.width * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = playerBaseColor;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  
  // Add hit flash effect
  if (player.hitFlash > 0) {
    ctx.globalAlpha = player.hitFlash / 10 * 0.8; // Fade out over time
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, player.width * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3030";
    ctx.fill();
    
    // Add impact lines radiating outward
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = player.hitFlash / 10 * 3;
    const impactLines = 8;
    for (let i = 0; i < impactLines; i++) {
      const angle = (i / impactLines) * Math.PI * 2;
      const startRadius = player.width * 0.5;
      const endRadius = player.width * (0.8 + player.hitFlash / 10);
      
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * startRadius, 
        centerY + Math.sin(angle) * startRadius
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * endRadius, 
        centerY + Math.sin(angle) * endRadius
      );
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  
  ctx.restore();
  if (player.attacking) {
    ctx.save();
    let ax, ay, aw, ah;

    if (player.attackDir.x !== 0) {
      aw = TILE_SIZE * 1.2;
      ah = player.height * 0.9;
      ay = player.y + player.height * 0.05;
      ax =
        player.attackDir.x > 0
          ? player.x + player.width * 0.5
          : player.x - aw + player.width * 0.5;
    } else if (player.attackDir.y !== 0) {
      ah = TILE_SIZE * 1.2;
      aw = player.width * 0.9;
      ax = player.x + player.width * 0.05;
      ay =
        player.attackDir.y > 0
          ? player.y + player.height * 0.5
          : player.y - ah + player.height * 0.5;
    } else {
      const attackReach = TILE_SIZE * 0.7;
      ax = player.x + player.width / 2 - attackReach / 2;
      ay = player.y + player.height / 2 - attackReach / 2;
      aw = attackReach;
      ah = attackReach;
    }
    
    // Calculate the attack animation progress (0 to 1)
    const attackProgress = 1 - (player.attackDuration / 15);
    
    // Create a gradient for the attack slash
    const slashGradient = ctx.createRadialGradient(
      ax + aw/2, ay + ah/2, 0,
      ax + aw/2, ay + ah/2, Math.max(aw, ah)
    );
    
    // Cyan-white gradient for attack
    slashGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    slashGradient.addColorStop(0.2, "rgba(120, 255, 255, 0.7)");
    slashGradient.addColorStop(0.6, "rgba(0, 200, 255, 0.4)");
    slashGradient.addColorStop(1, "rgba(0, 100, 255, 0)");
    
    ctx.fillStyle = slashGradient;
    
    // Center of the attack
    const centerX = ax + aw / 2;
    const centerY = ay + ah / 2;
    
    // Create a slashing arc effect
    ctx.beginPath();
    
    // Different arc based on attack direction
    if (player.attackDir.x !== 0) {
      const startAngle = player.attackDir.x > 0 ? -Math.PI/3 : 2*Math.PI/3;
      const endAngle = player.attackDir.x > 0 ? Math.PI/3 : 4*Math.PI/3;
      const radius = Math.max(aw, ah) * (0.8 + attackProgress * 0.2);
      
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
    } else if (player.attackDir.y !== 0) {
      const startAngle = player.attackDir.y > 0 ? Math.PI/6 : -5*Math.PI/6;
      const endAngle = player.attackDir.y > 0 ? 5*Math.PI/6 : -Math.PI/6;
      const radius = Math.max(aw, ah) * (0.8 + attackProgress * 0.2);
      
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
    } else {
      // Default attack direction if none specified
      ctx.arc(centerX, centerY, Math.max(aw, ah), 0, Math.PI * 2);
    }
    
    ctx.fill();
    
    // Add a sharper slash line highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add motion streaks
    ctx.globalAlpha = 0.6 * (1 - attackProgress);
    const streakCount = 4;
    for (let i = 0; i < streakCount; i++) {
      const offsetX = player.attackDir.x * (i+1) * 3 * -1; // Reverse direction for trail effect
      const offsetY = player.attackDir.y * (i+1) * 3 * -1;
      
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.7 - i * 0.15})`;
      ctx.lineWidth = 3 - i * 0.5;
      
      // Draw the trail with slight offset
      ctx.beginPath();
      if (player.attackDir.x !== 0) {
        const startAngle = player.attackDir.x > 0 ? -Math.PI/3 : 2*Math.PI/3;
        const endAngle = player.attackDir.x > 0 ? Math.PI/3 : 4*Math.PI/3;
        const radius = Math.max(aw, ah) * (0.7 - i * 0.1);
        
        ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle);
      } else if (player.attackDir.y !== 0) {
        const startAngle = player.attackDir.y > 0 ? Math.PI/6 : -5*Math.PI/6;
        const endAngle = player.attackDir.y > 0 ? 5*Math.PI/6 : -Math.PI/6;
        const radius = Math.max(aw, ah) * (0.7 - i * 0.1);
        
        ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle);
      }
      ctx.stroke();
    }
    
    ctx.restore();
  }
  enemies.forEach((enemy) => {
    ctx.save();
    
    const enemyCenterX = enemy.x + enemy.width / 2;
    const enemyCenterY = enemy.y + enemy.height / 2;
    
    // Determine base color based on enemy state
    let enemyBaseColor;
    let pulseRate = 0;
    let enemyShape = 'normal';
    
    if (enemy.aiState === "stunned") {
      enemyBaseColor = "#6464ff"; // Blue for stunned
      pulseRate = 0.2;
      enemyShape = 'stunned';
    } else if (enemy.isAttacking && enemy.attackWindUp > 0) {
      enemyBaseColor = "#ff6400"; // Orange for winding up attack
      pulseRate = 0.1;
      enemyShape = 'charging';
    } else if (enemy.isAttacking && enemy.attackActive > 0) {
      enemyBaseColor = "#ff0000"; // Red for active attack
      pulseRate = 0.3;
      enemyShape = 'attacking';
    } else if (enemy.aiState === "chasing") {
      enemyBaseColor = "#ff00ff"; // Magenta for normal/chasing
      enemyShape = 'aggressive';
    } else {
      enemyBaseColor = "#cc00cc"; // Darker magenta for idle
      enemyShape = 'normal';
    }
    
    // Create enemy gradient
    const enemyGradient = ctx.createRadialGradient(
      enemyCenterX, enemyCenterY, 1,
      enemyCenterX, enemyCenterY, enemy.width * 0.8
    );
    
    enemyGradient.addColorStop(0, enemyBaseColor);
    enemyGradient.addColorStop(0.6, enemyBaseColor);
    enemyGradient.addColorStop(1, '#330033');
    
    ctx.fillStyle = enemyGradient;
    
    // Draw different enemy shapes based on state
    if (enemyShape === 'stunned') {
      // Wavy, unstable shape for stunned enemies
      ctx.beginPath();
      const wobbleAmount = 3;
      const points = 8;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wobble = Math.sin(Date.now() / 100 + i) * wobbleAmount;
        const radius = enemy.width / 2 + wobble;
        const x = enemyCenterX + Math.cos(angle) * radius;
        const y = enemyCenterY + Math.sin(angle) * radius;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Add stars/dizzy effect
      for (let i = 0; i < 3; i++) {
        const starX = enemyCenterX + Math.cos(Date.now() / 500 + i * 2) * (enemy.width / 2);
        const starY = enemyCenterY + Math.sin(Date.now() / 500 + i * 2) * (enemy.height / 2);
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(starX, starY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
    } else if (enemyShape === 'charging' || enemyShape === 'attacking') {
      // Spiky, threatening shape for attacking
      ctx.beginPath();
      const spikeCount = enemyShape === 'attacking' ? 12 : 8;
      const innerRadius = enemy.width / 3;
      const outerRadius = enemy.width / 2 + (enemyShape === 'attacking' ? 6 : 3);
      
      for (let i = 0; i < spikeCount * 2; i++) {
        const angle = (i / (spikeCount * 2)) * Math.PI * 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = enemyCenterX + Math.cos(angle) * radius;
        const y = enemyCenterY + Math.sin(angle) * radius;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Add glowing effect for attacking enemies
      if (pulseRate > 0) {
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * pulseRate) * 0.2;
        ctx.shadowColor = enemyBaseColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(enemyCenterX, enemyCenterY, enemy.width * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = enemyBaseColor;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    } else if (enemyShape === 'aggressive') {
      // Diamond shape for chasing enemies
      ctx.beginPath();
      ctx.moveTo(enemyCenterX, enemyCenterY - enemy.height / 2);
      ctx.lineTo(enemyCenterX + enemy.width / 2, enemyCenterY);
      ctx.lineTo(enemyCenterX, enemyCenterY + enemy.height / 2);
      ctx.lineTo(enemyCenterX - enemy.width / 2, enemyCenterY);
      ctx.closePath();
      ctx.fill();
      
      // Add small notches to make it look more menacing
      ctx.beginPath();
      ctx.moveTo(enemyCenterX + enemy.width / 3, enemyCenterY - enemy.height / 4);
      ctx.lineTo(enemyCenterX + enemy.width / 2, enemyCenterY - enemy.height / 3);
      ctx.lineTo(enemyCenterX + enemy.width / 3, enemyCenterY - enemy.height / 2);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(enemyCenterX - enemy.width / 3, enemyCenterY + enemy.height / 4);
      ctx.lineTo(enemyCenterX - enemy.width / 2, enemyCenterY + enemy.height / 3);
      ctx.lineTo(enemyCenterX - enemy.width / 3, enemyCenterY + enemy.height / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Normal hexagonal shape for idle enemies
      ctx.beginPath();
      const sides = 6;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 + Math.PI / 6;
        const x = enemyCenterX + Math.cos(angle) * (enemy.width / 2);
        const y = enemyCenterY + Math.sin(angle) * (enemy.height / 2);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    
    // Add outline to all enemies
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw attack hitbox with improved visual
    if (enemy.isAttacking && enemy.attackActive > 0) {
      const pulseIntensity = Math.sin(Date.now() / 50) * 0.2 + 0.3;
      ctx.fillStyle = `rgba(255, 0, 0, ${pulseIntensity})`;
      ctx.beginPath();
      const attackBoxX = enemy.x - TILE_SIZE * 0.25;
      const attackBoxY = enemy.y - TILE_SIZE * 0.25;
      const attackBoxWidth = enemy.width + TILE_SIZE * 0.5;
      const attackBoxHeight = enemy.height + TILE_SIZE * 0.5;
      
      ctx.moveTo(attackBoxX + 10, attackBoxY);
      ctx.lineTo(attackBoxX + attackBoxWidth - 10, attackBoxY);
      ctx.quadraticCurveTo(attackBoxX + attackBoxWidth, attackBoxY, attackBoxX + attackBoxWidth, attackBoxY + 10);
      ctx.lineTo(attackBoxX + attackBoxWidth, attackBoxY + attackBoxHeight - 10);
      ctx.quadraticCurveTo(attackBoxX + attackBoxWidth, attackBoxY + attackBoxHeight, attackBoxX + attackBoxWidth - 10, attackBoxY + attackBoxHeight);
      ctx.lineTo(attackBoxX + 10, attackBoxY + attackBoxHeight);
      ctx.quadraticCurveTo(attackBoxX, attackBoxY + attackBoxHeight, attackBoxX, attackBoxY + attackBoxHeight - 10);
      ctx.lineTo(attackBoxX, attackBoxY + 10);
      ctx.quadraticCurveTo(attackBoxX, attackBoxY, attackBoxX + 10, attackBoxY);
      
      ctx.fill();
      
      // Add danger lines radiating from enemy
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
      ctx.lineWidth = 1;
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(enemyCenterX, enemyCenterY);
        ctx.lineTo(
          enemyCenterX + Math.cos(angle) * (enemy.width + TILE_SIZE * 0.5),
          enemyCenterY + Math.sin(angle) * (enemy.height + TILE_SIZE * 0.5)
        );
        ctx.stroke();
      }
    }
    
    ctx.restore();
  });
  // Draw particles just before restoring the context, so they are on top of other game elements
  particles.forEach((particle) => {
    ctx.save();
    
    // Apply alpha if defined
    if (particle.alpha !== undefined) {
      ctx.globalAlpha = particle.alpha;
    }
    
    if (particle.type === 'shockwave') {
      // Draw shockwave as a ring
      ctx.beginPath();
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = particle.alpha;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.stroke();
    } 
    else if (particle.type === 'spark') {
      // Draw spark as a star-like shape
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      
      // Draw a star shape
      const spikes = 4;
      const innerRadius = particle.size / 2;
      const outerRadius = particle.size;
      
      ctx.beginPath();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation || 0);
      
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.closePath();
      ctx.fill();
    }
    else if (particle.type === 'trail') {
      // Draw trail with glow effect
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = particle.alpha;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } 
    else if (particle.type === 'blood') {
      // Draw blood splatter
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      
      if (Math.random() > 0.5) {
        // Small droplet
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      } else {
        // Splash droplet (slightly elongated)
        ctx.ellipse(
          particle.x, 
          particle.y, 
          particle.size, 
          particle.size * 1.5, 
          Math.atan2(particle.vy, particle.vx), 
          0, 
          Math.PI * 2
        );
      }
      ctx.fill();
    }
    else if (particle.type === 'fragment') {
      // Draw geometric fragments
      ctx.fillStyle = particle.color;
      
      ctx.beginPath();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation || 0);
      
      // Draw a simple geometric shard
      ctx.moveTo(0, -particle.size);
      ctx.lineTo(particle.size, 0);
      ctx.lineTo(0, particle.size);
      ctx.lineTo(-particle.size, 0);
      ctx.closePath();
      ctx.fill();
    }
    else {
      // Default circular particle
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  });

  drawLighting();

  // --- Restore Canvas Context ---
  ctx.restore(); // Restore the context to its original state (before translation)
  // --- End Restore Canvas Context ---
}

function createEnemyDeathParticles(enemy) {
  // Create explosion-like particles
  for (let i = 0; i < PARTICLE_COUNT_ON_ENEMY_DEATH; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * PARTICLE_SPEED + 2;
    
    // Create color variations for more interesting effects
    const colors = ['#ff00ff', '#ff40ff', '#ff80ff', '#ff0080', '#800080'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Add different particle types
    const particleType = Math.random() < 0.3 ? 'spark' : 'fragment';
    
    particles.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2,
      lifespan: PARTICLE_LIFESPAN + Math.random() * 20,
      color: randomColor,
      alpha: 1,
      gravity: Math.random() * 0.1,
      type: particleType,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  }
  
  // Create a shockwave effect
  particles.push({
    x: enemy.x + enemy.width / 2,
    y: enemy.y + enemy.height / 2,
    size: 5,
    maxSize: 50,
    lifespan: 15,
    color: '#ffffff',
    alpha: 0.7,
    type: 'shockwave'
  });
}

function createPlayerDodgeParticles(player) {
  // Create trail particles for dodge effect
  const trailCount = 8;
  const trailColors = ['#00a0ff', '#80d0ff', '#00ffff'];
  
  // Create particles in the opposite direction of movement to create trail effect
  const dirX = player.dx * -0.1;
  const dirY = player.dy * -0.1;
  
  for (let i = 0; i < trailCount; i++) {
    // Randomize position slightly along player width/height
    const offsetX = (Math.random() - 0.5) * player.width * 0.5;
    const offsetY = (Math.random() - 0.5) * player.height * 0.5;
    
    // Position particles at the player location plus offset
    const x = player.x + player.width/2 + offsetX;
    const y = player.y + player.height/2 + offsetY;
    
    particles.push({
      x: x,
      y: y,
      vx: dirX + (Math.random() - 0.5) * 0.5,
      vy: dirY + (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 2,
      lifespan: 10 + Math.random() * 5,
      color: trailColors[Math.floor(Math.random() * trailColors.length)], 
      alpha: 0.7,
      type: 'trail',
      fadeSpeed: 0.08 + Math.random() * 0.05
    });
  }
}

function createPlayerDamagedParticles(player) {
  // Create particles when player takes damage
  const damageCount = 12;
  const damageColors = ['#ff0000', '#ff4000', '#ff6000', '#ffff00'];
  
  for (let i = 0; i < damageCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    
    particles.push({
      x: player.x + player.width/2,
      y: player.y + player.height/2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 1,
      lifespan: 20 + Math.random() * 10,
      color: damageColors[Math.floor(Math.random() * damageColors.length)],
      alpha: 1,
      type: 'blood',
      gravity: 0.05
    });
  }
}

function createParryParticles(x, y) {
  // Create particles for successful parry effect
  const parryCount = 10;
  const parryColors = ['#ffff00', '#ffffaa', '#ffffff'];
  
  for (let i = 0; i < parryCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 2;
    
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 5 + 2,
      lifespan: 15 + Math.random() * 10,
      color: parryColors[Math.floor(Math.random() * parryColors.length)],
      alpha: 1,
      type: 'spark',
      fadeSpeed: 0.1,
      gravity: -0.05 // These particles float upward slightly
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    if (p.type === 'shockwave') {
      // Update shockwave particle
      p.size += (p.maxSize - p.size) * 0.2;
      p.alpha = p.lifespan / 15;
    } else {
      // Update regular particles
      p.x += p.vx;
      p.y += p.vy;
      
      // Add gravity effect to some particles
      if (p.gravity) {
        p.vy += p.gravity;
      }
      
      // Update rotation if applicable
      if (p.rotation !== undefined) {
        p.rotation += p.rotationSpeed;
      }
      
      // Fade out particles as they age
      if (p.alpha !== undefined) {
        p.alpha = Math.max(0, p.lifespan / (PARTICLE_LIFESPAN + 20));
      }
    }
    
    p.lifespan--;
    if (p.lifespan <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawLighting() {
  // Create a dynamic lighting effect centered on the player
  const lightLayer = ctx.createRadialGradient(
    player.x + player.width / 2, player.y + player.height / 2, TILE_SIZE * 2,
    player.x + player.width / 2, player.y + player.height / 2, TILE_SIZE * 8
  );
  
  // Gradient from transparent to dark
  lightLayer.addColorStop(0, "rgba(0, 0, 0, 0)");
  lightLayer.addColorStop(1, "rgba(0, 0, 0, 0.7)");
  
  // Apply the lighting effect
  ctx.fillStyle = lightLayer;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add dynamic light flickering around player
  const flickerIntensity = Math.sin(Date.now() / 200) * 0.05 + 0.95;
  const playerLight = ctx.createRadialGradient(
    player.x + player.width / 2, player.y + player.height / 2, 0,
    player.x + player.width / 2, player.y + player.height / 2, TILE_SIZE * 3 * flickerIntensity
  );
  
  // Player emits cyan-colored light
  playerLight.addColorStop(0, "rgba(0, 255, 255, 0.2)");
  playerLight.addColorStop(0.5, "rgba(0, 100, 100, 0.1)");
  playerLight.addColorStop(1, "rgba(0, 50, 50, 0)");
  
  ctx.fillStyle = playerLight;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add enemy lights
  enemies.forEach(enemy => {
    let enemyLightColor;
    if (enemy.isAttacking && enemy.attackActive > 0) {
      // Attacking enemies emit red light
      enemyLightColor = "rgba(255, 0, 0, 0.25)";
    } else if (enemy.aiState === "stunned") {
      // Stunned enemies emit blue light
      enemyLightColor = "rgba(50, 50, 255, 0.2)";
    } else {
      // Regular enemies emit magenta light
      enemyLightColor = "rgba(255, 0, 255, 0.15)";
    }
    
    const enemyLight = ctx.createRadialGradient(
      enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 0,
      enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, TILE_SIZE * 2
    );
    
    enemyLight.addColorStop(0, enemyLightColor);
    enemyLight.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.fillStyle = enemyLight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}
