// High-end canvas renderer for ShadowVault Heist
import {
  ALARM_CONFIG,
  CAMERA_CONFIG,
  GUARD_CONFIG,
  PLAYER_CONFIG,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from './config.js';
import { STATE_ALERT, STATE_PATROL, STATE_SUSPICIOUS } from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;
export const SCREEN_VICTORY = 4;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFloor(time) {
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Grid pattern
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;
    const tileSize = 40;
    for (let x = 0; x < SCREEN_WIDTH; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, SCREEN_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < SCREEN_HEIGHT; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SCREEN_WIDTH, y);
      ctx.stroke();
    }
  }

  function drawWalls(walls) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }

    // Inner bright neon accent
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }
  }

  function drawVisionCone(x, y, angle, fov, distance, fillColor, strokeColor) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, distance, angle - fov / 2, angle + fov / 2);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(x, y, 10, x, y, distance);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawCameras(cameras, time) {
    for (let i = 0; i < cameras.length; i++) {
      const cam = cameras[i];

      // Vision sweep cone
      const coneColor = cam.detecting ? CAMERA_CONFIG.alertColor : CAMERA_CONFIG.normalColor;
      const strokeColor = cam.detecting ? CAMERA_CONFIG.alertStroke : CAMERA_CONFIG.normalStroke;
      drawVisionCone(cam.x, cam.y, cam.angle, CAMERA_CONFIG.fov, CAMERA_CONFIG.viewDistance, coneColor, strokeColor);

      // Mount base
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.rotate(cam.angle);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Camera body
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, -5, 16, 10);

      // Blinking red recording LED
      const blink = Math.sin(time * 6) > 0;
      ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(12, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  function drawLasers(lasers, time) {
    for (let i = 0; i < lasers.length; i++) {
      const laser = lasers[i];
      if (laser.disabled) continue;

      const alpha = laser.active ? 0.7 + Math.sin(time * 12) * 0.3 : 0.15;

      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = laser.active ? 15 : 0;
      ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.lineWidth = laser.active ? 3.5 : 1;

      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();

      // Laser emitters
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(laser.x1, laser.y1, 5, 0, Math.PI * 2);
      ctx.arc(laser.x2, laser.y2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  function drawTerminals(terminals) {
    for (let i = 0; i < terminals.length; i++) {
      const term = terminals[i];
      ctx.save();
      ctx.translate(term.x, term.y);

      ctx.fillStyle = term.hacked ? '#065f46' : '#1e3a8a';
      ctx.fillRect(-14, -10, 28, 20);

      ctx.strokeStyle = term.hacked ? '#10b981' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -10, 28, 20);

      // Status LED
      ctx.fillStyle = term.hacked ? '#34d399' : '#60a5fa';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label text
      ctx.font = '9px monospace';
      ctx.fillStyle = term.hacked ? '#a7f3d0' : '#bfdbfe';
      ctx.textAlign = 'center';
      ctx.fillText(term.hacked ? 'HACKED' : 'KEYPAD', 0, 22);

      ctx.restore();
    }
  }

  function drawVaultAndLoot(vault, time) {
    ctx.save();
    ctx.translate(vault.x, vault.y);

    // Vault chamber floor glow
    const pulse = Math.sin(time * 3) * 0.2 + 0.8;
    const radial = ctx.createRadialGradient(0, 0, 10, 0, 0, vault.radius + 20);
    radial.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(0, 0, vault.radius + 20, 0, Math.PI * 2);
    ctx.fill();

    // Vault pedestal base
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, vault.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!vault.unlocked) {
      // Rotating sparkling Obsidian Diamond
      ctx.rotate(time * 1.5);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(0, -18 * pulse);
      ctx.lineTo(14 * pulse, 0);
      ctx.lineTo(0, 18 * pulse);
      ctx.lineTo(-14 * pulse, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glass containment ring
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, vault.radius - 8, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('[EMPTY]', 0, 4);
    }

    ctx.restore();
  }

  function drawGuards(guards, time) {
    for (let i = 0; i < guards.length; i++) {
      const guard = guards[i];

      // Vision cone
      let coneFill = GUARD_CONFIG.patrolColor;
      let coneStroke = GUARD_CONFIG.patrolStroke;
      if (guard.state === STATE_SUSPICIOUS) {
        coneFill = GUARD_CONFIG.suspiciousColor;
        coneStroke = GUARD_CONFIG.suspiciousStroke;
      } else if (guard.state === STATE_ALERT) {
        coneFill = GUARD_CONFIG.alarmColor;
        coneStroke = GUARD_CONFIG.alarmStroke;
      }

      drawVisionCone(guard.x, guard.y, guard.angle, GUARD_CONFIG.fov, GUARD_CONFIG.viewDistance, coneFill, coneStroke);

      ctx.save();
      ctx.translate(guard.x, guard.y);
      ctx.rotate(guard.angle);

      // Guard Body
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, 0, guard.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = coneStroke;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shoulders / vest
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-8, -12, 16, 24);

      // Weapon / flashlight
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, 4, 12, 5);

      ctx.restore();

      // Alert exclamation indicator above head
      if (guard.state === STATE_ALERT) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 20);
      } else if (guard.state === STATE_SUSPICIOUS) {
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#fb923c';
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - 20);
      }
    }
  }

  function drawPlayer(player, time) {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Sneak noise ripple
    if (player.speed > 0) {
      const radius = player.isSneaking ? PLAYER_CONFIG.sneakNoiseRadius : PLAYER_CONFIG.walkNoiseRadius;
      const rippleTime = (time * 3) % 1;
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.3 * (1 - rippleTime)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius * rippleTime, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(player.angle);

    // Thief stealth body
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = player.hasLoot ? 15 : 6;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = player.hasLoot ? '#f59e0b' : '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Backpack / direction indicator
    ctx.fillStyle = player.hasLoot ? '#d97706' : '#0284c7';
    ctx.fillRect(-8, -6, 6, 12);

    ctx.restore();

    // Hacking progress bar
    if (player.isHacking && player.hackProgress > 0) {
      const pct = Math.min(1, player.hackProgress / 3.0);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(player.x - 25, player.y - 30, 50, 6);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(player.x - 25, player.y - 30, 50 * pct, 6);
    }
  }

  function drawExtractionZone(zone) {
    ctx.save();
    ctx.translate(zone.x, zone.y);

    // Escape Van vehicle representation
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-35, -20, 70, 40);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(-35, -20, 70, 40);

    // Windows
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-15, -16, 20, 32);

    // Escape zone dashed boundary
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = '#6ee7b7';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPE VAN', 0, 32);

    ctx.restore();
  }

  function drawHUD(state) {
    // Top banner backdrop
    ctx.fillStyle = 'rgba(10, 14, 23, 0.95)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, 60);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(SCREEN_WIDTH, 60);
    ctx.stroke();

    // 1. ALARM METER (The required prominent element)
    const alarmWidth = 260;
    const alarmHeight = 16;
    const alarmX = 40;
    const alarmY = 22;

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText('SECURITY ALARM METER:', alarmX, 15);

    // Meter container
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(alarmX, alarmY, alarmWidth, alarmHeight);
    ctx.strokeStyle = state.alarm > 70 ? '#ef4444' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(alarmX, alarmY, alarmWidth, alarmHeight);

    // Gradient fill
    const fillWidth = (state.alarm / 100) * alarmWidth;
    if (fillWidth > 0) {
      const grad = ctx.createLinearGradient(alarmX, 0, alarmX + alarmWidth, 0);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(0.4, '#eab308');
      grad.addColorStop(0.75, '#f97316');
      grad.addColorStop(1, '#ef4444');

      ctx.fillStyle = grad;
      ctx.fillRect(alarmX + 1, alarmY + 1, fillWidth - 2, alarmHeight - 2);
    }

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = state.alarm > 70 ? '#fca5a5' : '#f8fafc';
    ctx.textAlign = 'right';
    const alarmLabel = state.alarm >= 70 ? 'ALERT! ' : state.alarm >= 30 ? 'SUSPICIOUS ' : 'CLEAR ';
    ctx.fillText(`${alarmLabel}${Math.floor(state.alarm)}%`, alarmX + alarmWidth - 6, alarmY + 12);

    // 2. MISSION OBJECTIVE BANNER
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    if (!state.player.hasLoot) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('MISSION: INFILTRATE CENTRAL VAULT & STEAL THE NYX CORE', SCREEN_WIDTH / 2, 26);
    } else {
      ctx.fillStyle = '#4ade80';
      ctx.fillText('HEIST SUCCESSFUL: EXFILTRATE TO EXTRACTION VAN!', SCREEN_WIDTH / 2, 26);
    }
    ctx.font = '11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(state.statusText, SCREEN_WIDTH / 2, 44);

    // 3. TARGET LOOT STAT
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'right';
    ctx.fillText(`LOOT VALUE: $${(state.vault.value).toLocaleString()}`, SCREEN_WIDTH - 40, 24);

    ctx.font = '11px monospace';
    ctx.fillStyle = state.player.hasLoot ? '#4ade80' : '#cbd5e1';
    ctx.fillText(state.player.hasLoot ? 'STATUS: SECURED IN SATCHEL' : 'STATUS: LOCKED IN VAULT', SCREEN_WIDTH - 40, 42);

    // 4. RADAR MINIMAP (Bottom-Right)
    const mapSize = 100;
    const mapX = SCREEN_WIDTH - mapSize - 20;
    const mapY = SCREEN_HEIGHT - mapSize - 20;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Minimap radar sweep line
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, mapSize / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();

    const scaleX = mapSize / SCREEN_WIDTH;
    const scaleY = mapSize / SCREEN_HEIGHT;

    // Minimap Vault
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(mapX + state.vault.x * scaleX - 2, mapY + state.vault.y * scaleY - 2, 5, 5);

    // Minimap Guards
    ctx.fillStyle = '#ef4444';
    for (let i = 0; i < state.guards.length; i++) {
      const g = state.guards[i];
      ctx.fillRect(mapX + g.x * scaleX - 1.5, mapY + g.y * scaleY - 1.5, 3.5, 3.5);
    }

    // Minimap Player
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(mapX + state.player.x * scaleX, mapY + state.player.y * scaleY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTitleScreen(best) {
    ctx.fillStyle = 'rgba(6, 9, 14, 0.88)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.save();
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 25;

    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOWVAULT: MIDNIGHT HEIST', SCREEN_WIDTH / 2, 230);

    ctx.shadowBlur = 0;
    ctx.font = '16px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('TACTICAL STEALTH INFILTRATION SIMULATION', SCREEN_WIDTH / 2, 275);

    // Briefing Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(SCREEN_WIDTH / 2 - 280, 310, 560, 160);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(SCREEN_WIDTH / 2 - 280, 310, 560, 160);

    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText('• Target: The Heart of Nyx ($2,500,000 Obsidian Core)', SCREEN_WIDTH / 2 - 250, 345);
    ctx.fillText('• Threats: 4 patrolling guards with vision cones, 2 CCTV wall cameras', SCREEN_WIDTH / 2 - 250, 375);
    ctx.fillText('• Security: Hack terminal keypads to disable active laser barriers', SCREEN_WIDTH / 2 - 250, 405);
    ctx.fillText('• Exfiltrate: Retrieve the relic and reach the Extraction Van', SCREEN_WIDTH / 2 - 250, 435);

    // Controls prompt
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#4ade80';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS [SPACE] OR [ENTER] TO COMMENCE OPERATION', SCREEN_WIDTH / 2, 530);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Controls: WASD/Arrows to Move | Shift to Sneak | Space/E to Hack', SCREEN_WIDTH / 2, 565);

    ctx.restore();
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('HEIST FAILED: APPREHENDED', SCREEN_WIDTH / 2, 300);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Security guards intercepted you in the gallery.', SCREEN_WIDTH / 2, 350);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('PRESS [SPACE] OR [R] TO RETRY HEIST', SCREEN_WIDTH / 2, 420);
  }

  function drawVictory(score, timeElapsed) {
    ctx.fillStyle = 'rgba(6, 9, 14, 0.88)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION ACCOMPLISHED: GHOST OPERATIVE', SCREEN_WIDTH / 2, 240);

    ctx.font = '22px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`TOTAL BOUNTY EXTRACTED: $${score.toLocaleString()}`, SCREEN_WIDTH / 2, 300);

    ctx.font = '15px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Operation Elapsed Time: ${timeElapsed.toFixed(1)} seconds`, SCREEN_WIDTH / 2, 340);
    ctx.fillText('Stealth Rating: S-TIER (Zero Alarms Escaped)', SCREEN_WIDTH / 2, 370);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('PRESS [SPACE] OR [ENTER] TO PLAY AGAIN', SCREEN_WIDTH / 2, 450);
  }

  function draw(state, screen, best = 0) {
    const time = state.timeElapsed || 0;
    drawFloor(time);
    drawWalls(state.walls);
    drawExtractionZone(state.escapeZone);
    drawTerminals(state.terminals);
    drawLasers(state.lasers, time);
    drawVaultAndLoot(state.vault, time);
    drawCameras(state.cameras, time);
    drawGuards(state.guards, time);
    drawPlayer(state.player, time);
    drawHUD(state);

    if (screen === SCREEN_TITLE) {
      drawTitleScreen(best);
    } else if (screen === SCREEN_OVER) {
      drawGameOver();
    } else if (screen === SCREEN_VICTORY) {
      drawVictory(state.score, state.timeElapsed);
    }
  }

  return {
    draw,
  };
}
