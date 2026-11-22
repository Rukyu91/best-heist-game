// Core world simulation, stealth logic, AI guards, and raycasting for ShadowVault Heist
import {
  ALARM_CONFIG,
  CAMERA_CONFIG,
  GUARD_CONFIG,
  LOOT_CONFIG,
  PLAYER_CONFIG,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  STEP,
} from './config.js';

export const STATE_PATROL = 0;
export const STATE_SUSPICIOUS = 1;
export const STATE_ALERT = 2;

export const EVENT_NONE = 0;
export const EVENT_SUSPICIOUS = 1;
export const EVENT_ALARM_SPIKE = 2;
export const EVENT_HACK_TICK = 4;
export const EVENT_LOOT_GRABBED = 8;
export const EVENT_VICTORY = 16;
export const EVENT_CAUGHT = 32;

// Standard line intersection helper for line-of-sight and laser trips
function lineIntersects(p1, p2, p3, p4) {
  const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(d) < 1e-9) return false;
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

export function createWorld(randomSeed = 1) {
  let rngVal = randomSeed;
  function random() {
    rngVal = (rngVal * 1664525 + 1013904223) % 4294967296;
    return rngVal / 4294967296;
  }

  // Room walls and architectural layout (outer frame + interior rooms + pillars)
  const walls = [
    // Outer boundaries (leaving room for top HUD)
    { x1: 40, y1: 70, x2: 1240, y2: 70 },
    { x1: 1240, y1: 70, x2: 1240, y2: 690 },
    { x1: 1240, y1: 690, x2: 40, y2: 690 },
    { x1: 40, y1: 690, x2: 40, y2: 70 },

    // West security wing partition
    { x1: 300, y1: 70, x2: 300, y2: 280 },
    { x1: 300, y1: 380, x2: 300, y2: 690 },

    // East archive wing partition
    { x1: 980, y1: 70, x2: 980, y2: 320 },
    { x1: 980, y1: 420, x2: 980, y2: 690 },

    // Central Vault Chamber (around the diamond pedestal)
    { x1: 520, y1: 240, x2: 760, y2: 240 },
    { x1: 760, y1: 240, x2: 760, y2: 480 },
    { x1: 760, y1: 480, x2: 520, y2: 480 },
    { x1: 520, y1: 480, x2: 520, y2: 240 },

    // Cover Pillars
    { x1: 160, y1: 200, x2: 200, y2: 200 },
    { x1: 200, y1: 200, x2: 200, y2: 240 },
    { x1: 200, y1: 240, x2: 160, y2: 240 },
    { x1: 160, y1: 240, x2: 160, y2: 200 },

    { x1: 160, y1: 460, x2: 200, y2: 460 },
    { x1: 200, y1: 460, x2: 200, y2: 500 },
    { x1: 200, y1: 500, x2: 160, y2: 500 },
    { x1: 160, y1: 500, x2: 160, y2: 460 },

    { x1: 1080, y1: 220, x2: 1120, y2: 220 },
    { x1: 1120, y1: 220, x2: 1120, y2: 260 },
    { x1: 1120, y1: 260, x2: 1080, y2: 260 },
    { x1: 1080, y1: 260, x2: 1080, y2: 220 },

    { x1: 1080, y1: 480, x2: 1120, y2: 480 },
    { x1: 1120, y1: 480, x2: 1120, y2: 520 },
    { x1: 1120, y1: 520, x2: 1080, y2: 520 },
    { x1: 1080, y1: 520, x2: 1080, y2: 480 },
  ];

  // The stealth operative
  const player = {
    x: 100,
    y: 620,
    angle: -Math.PI / 2,
    radius: PLAYER_CONFIG.radius,
    speed: 0,
    isSneaking: false,
    hasLoot: false,
    isHacking: false,
    hackProgress: 0,
    alive: true,
    escaped: false,
  };

  // 4 Guards with sophisticated patrol waypoints
  const guards = [
    {
      id: 1,
      x: 220,
      y: 160,
      angle: Math.PI / 2,
      targetAngle: Math.PI / 2,
      waypoints: [
        { x: 220, y: 160 },
        { x: 220, y: 480 },
        { x: 120, y: 480 },
        { x: 120, y: 160 },
      ],
      waypointIdx: 0,
      state: STATE_PATROL,
      suspicion: 0,
      investigateTimer: 0,
      investigateTarget: null,
    },
    {
      id: 2,
      x: 420,
      y: 150,
      angle: 0,
      targetAngle: 0,
      waypoints: [
        { x: 420, y: 150 },
        { x: 860, y: 150 },
        { x: 860, y: 200 },
        { x: 420, y: 200 },
      ],
      waypointIdx: 0,
      state: STATE_PATROL,
      suspicion: 0,
      investigateTimer: 0,
      investigateTarget: null,
    },
    {
      id: 3,
      x: 440,
      y: 560,
      angle: 0,
      targetAngle: 0,
      waypoints: [
        { x: 440, y: 560 },
        { x: 840, y: 560 },
        { x: 840, y: 360 },
        { x: 440, y: 360 },
      ],
      waypointIdx: 0,
      state: STATE_PATROL,
      suspicion: 0,
      investigateTimer: 0,
      investigateTarget: null,
    },
    {
      id: 4,
      x: 1080,
      y: 160,
      angle: Math.PI / 2,
      targetAngle: Math.PI / 2,
      waypoints: [
        { x: 1080, y: 160 },
        { x: 1080, y: 440 },
        { x: 1180, y: 440 },
        { x: 1180, y: 160 },
      ],
      waypointIdx: 0,
      state: STATE_PATROL,
      suspicion: 0,
      investigateTimer: 0,
      investigateTarget: null,
    },
  ];

  // 2 Wall-Mounted Security Cameras
  const cameras = [
    {
      id: 1,
      x: 45,
      y: 280,
      baseAngle: 0,
      sweepRange: 0.8, // +/- 0.8 rad
      angle: 0,
      timer: 0,
      detecting: false,
    },
    {
      id: 2,
      x: 1235,
      y: 350,
      baseAngle: Math.PI,
      sweepRange: 0.75,
      angle: Math.PI,
      timer: 1.5,
      detecting: false,
    },
  ];

  // Laser security tripwires
  const lasers = [
    { id: 1, x1: 530, y1: 240, x2: 750, y2: 240, active: true, disabled: false, timer: 0, period: 4.0 },
    { id: 2, x1: 980, y1: 320, x2: 980, y2: 420, active: true, disabled: false, timer: 1.2, period: 3.5 },
    { id: 3, x1: 530, y1: 480, x2: 750, y2: 480, active: true, disabled: false, timer: 2.0, period: 4.0 },
  ];

  // Hackable security terminals
  const terminals = [
    { id: 1, x: 250, y: 120, hacked: false, targetLaser: 1, label: 'LASER A CONSOLE' },
    { id: 2, x: 1040, y: 110, hacked: false, targetLaser: 2, label: 'VAULT BYPASS' },
  ];

  // Central Vault Objective
  const vault = {
    x: 640,
    y: 360,
    radius: 35,
    loot: LOOT_CONFIG.name,
    value: LOOT_CONFIG.value,
    unlocked: false,
    hackDuration: LOOT_CONFIG.hackDuration,
  };

  // Escape zone (extraction van outside western loading dock)
  const escapeZone = {
    x: 80,
    y: 640,
    radius: 50,
    label: 'EXTRACTION VAN',
  };

  // State metrics
  const state = {
    player,
    guards,
    cameras,
    lasers,
    terminals,
    vault,
    escapeZone,
    walls,
    alarm: 0,
    score: 0,
    timeElapsed: 0,
    detectedByGuard: false,
    detectedByCamera: false,
    detectedByLaser: false,
    statusText: 'INFILTRATING VAULT FACILITY',
  };

  function hasLineOfSight(x1, y1, x2, y2) {
    const p1 = { x: x1, y: y1 };
    const p2 = { x: x2, y: y2 };
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (lineIntersects(p1, p2, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 })) {
        return false;
      }
    }
    return true;
  }

  function reset() {
    player.x = 100;
    player.y = 620;
    player.angle = -Math.PI / 2;
    player.speed = 0;
    player.isSneaking = false;
    player.hasLoot = false;
    player.isHacking = false;
    player.hackProgress = 0;
    player.alive = true;
    player.escaped = false;

    state.alarm = 0;
    state.score = 0;
    state.timeElapsed = 0;
    state.statusText = 'INFILTRATING VAULT FACILITY';

    vault.unlocked = false;
    terminals.forEach((t) => (t.hacked = false));
    lasers.forEach((l) => (l.disabled = false));

    guards.forEach((g) => {
      g.waypointIdx = 0;
      g.x = g.waypoints[0].x;
      g.y = g.waypoints[0].y;
      g.state = STATE_PATROL;
      g.suspicion = 0;
      g.investigateTimer = 0;
      g.investigateTarget = null;
    });
  }

  function step(dt, input) {
    if (!player.alive || player.escaped) return EVENT_NONE;

    let events = EVENT_NONE;
    state.timeElapsed += dt;

    // Movement calculation
    let targetSpeed = PLAYER_CONFIG.walkSpeed;
    if (input.isSneaking) targetSpeed = PLAYER_CONFIG.sneakSpeed;

    const moveX = input.dx * targetSpeed * dt;
    const moveY = input.dy * targetSpeed * dt;

    if (input.dx !== 0 || input.dy !== 0) {
      player.angle = Math.atan2(input.dy, input.dx);
      player.speed = targetSpeed;
    } else {
      player.speed = 0;
    }
    player.isSneaking = input.isSneaking;

    // Wall collision resolution (circle vs line segment)
    let newX = player.x + moveX;
    let newY = player.y + moveY;

    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      const wx = w.x2 - w.x1;
      const wy = w.y2 - w.y1;
      const lenSq = wx * wx + wy * wy;
      let t = ((newX - w.x1) * wx + (newY - w.y1) * wy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = w.x1 + t * wx;
      const projY = w.y1 + t * wy;
      const dist = Math.hypot(newX - projX, newY - projY);

      if (dist < player.radius + 2) {
        const overlap = player.radius + 2 - dist;
        const pushX = dist > 0 ? (newX - projX) / dist : 0;
        const pushY = dist > 0 ? (newY - projY) / dist : 0;
        newX += pushX * overlap;
        newY += pushY * overlap;
      }
    }
    player.x = Math.max(50, Math.min(1230, newX));
    player.y = Math.max(80, Math.min(680, newY));

    // Update Cameras
    state.detectedByCamera = false;
    for (let i = 0; i < cameras.length; i++) {
      const cam = cameras[i];
      cam.timer += dt * CAMERA_CONFIG.sweepSpeed;
      cam.angle = cam.baseAngle + Math.sin(cam.timer) * cam.sweepRange;

      const dist = Math.hypot(player.x - cam.x, player.y - cam.y);
      if (dist <= CAMERA_CONFIG.viewDistance) {
        const angleToPlayer = Math.atan2(player.y - cam.y, player.x - cam.x);
        let diff = Math.abs(angleToPlayer - cam.angle);
        while (diff > Math.PI) diff -= Math.PI * 2;
        diff = Math.abs(diff);

        if (diff <= CAMERA_CONFIG.fov / 2) {
          if (hasLineOfSight(cam.x, cam.y, player.x, player.y)) {
            state.detectedByCamera = true;
            cam.detecting = true;
            state.alarm += ALARM_CONFIG.cameraDetectionRate * dt;
            events |= EVENT_ALARM_SPIKE;
          }
        }
      }
      if (!state.detectedByCamera) cam.detecting = false;
    }

    // Update Lasers
    state.detectedByLaser = false;
    for (let i = 0; i < lasers.length; i++) {
      const laser = lasers[i];
      if (laser.disabled) continue;

      laser.timer += dt;
      laser.active = Math.sin(laser.timer * 2) > -0.2; // Blinks periodically

      if (laser.active) {
        const playerLine = {
          x1: player.x - player.radius,
          y1: player.y,
          x2: player.x + player.radius,
          y2: player.y,
        };
        if (lineIntersects(playerLine, { x: player.x, y: player.y }, { x: laser.x1, y: laser.y1 }, { x: laser.x2, y: laser.y2 })) {
          state.detectedByLaser = true;
          state.alarm += ALARM_CONFIG.laserDetectionRate * dt;
          events |= EVENT_ALARM_SPIKE;
        }
      }
    }

    // Update Guards AI
    state.detectedByGuard = false;
    for (let i = 0; i < guards.length; i++) {
      const guard = guards[i];
      const distToPlayer = Math.hypot(player.x - guard.x, player.y - guard.y);

      // Vision cone check
      if (distToPlayer <= GUARD_CONFIG.viewDistance) {
        const angleToPlayer = Math.atan2(player.y - guard.y, player.x - guard.x);
        let diff = Math.abs(angleToPlayer - guard.angle);
        while (diff > Math.PI) diff -= Math.PI * 2;
        diff = Math.abs(diff);

        if (diff <= GUARD_CONFIG.fov / 2) {
          if (hasLineOfSight(guard.x, guard.y, player.x, player.y)) {
            state.detectedByGuard = true;
            guard.state = STATE_ALERT;
            guard.suspicion = 100;
            guard.investigateTarget = { x: player.x, y: player.y };
            state.alarm += GUARD_CONFIG.detectionRate || ALARM_CONFIG.guardDetectionRate * dt;
            events |= EVENT_ALARM_SPIKE;
          }
        }
      }

      // Sound detection (hearing footsteps if not sneaking)
      const noiseRadius = player.isSneaking ? PLAYER_CONFIG.sneakNoiseRadius : PLAYER_CONFIG.walkNoiseRadius;
      if (player.speed > 0 && distToPlayer < noiseRadius && guard.state === STATE_PATROL) {
        guard.state = STATE_SUSPICIOUS;
        guard.suspicion = Math.max(guard.suspicion, 60);
        guard.investigateTarget = { x: player.x, y: player.y };
        events |= EVENT_SUSPICIOUS;
      }

      // Guard movement behavior
      let targetX = guard.x;
      let targetY = guard.y;
      let curSpeed = GUARD_CONFIG.patrolSpeed;

      if (guard.state === STATE_ALERT && guard.investigateTarget) {
        targetX = guard.investigateTarget.x;
        targetY = guard.investigateTarget.y;
        curSpeed = GUARD_CONFIG.pursuitSpeed;

        if (distToPlayer < guard.radius + player.radius + 4) {
          player.alive = false;
          events |= EVENT_CAUGHT;
          state.statusText = 'CAUGHT BY SECURITY FORCE!';
        }
      } else if (guard.state === STATE_SUSPICIOUS && guard.investigateTarget) {
        targetX = guard.investigateTarget.x;
        targetY = guard.investigateTarget.y;
        curSpeed = GUARD_CONFIG.searchSpeed;

        if (Math.hypot(guard.x - targetX, guard.y - targetY) < 15) {
          guard.investigateTimer += dt;
          if (guard.investigateTimer > 3.0) {
            guard.state = STATE_PATROL;
            guard.investigateTimer = 0;
            guard.investigateTarget = null;
          }
        }
      } else {
        const wp = guard.waypoints[guard.waypointIdx];
        targetX = wp.x;
        targetY = wp.y;
        curSpeed = GUARD_CONFIG.patrolSpeed;

        if (Math.hypot(guard.x - targetX, guard.y - targetY) < 10) {
          guard.waypointIdx = (guard.waypointIdx + 1) % guard.waypoints.length;
        }
      }

      const gdx = targetX - guard.x;
      const gdy = targetY - guard.y;
      const gDist = Math.hypot(gdx, gdy);

      if (gDist > 1) {
        guard.targetAngle = Math.atan2(gdy, gdx);
        let angleDiff = guard.targetAngle - guard.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        guard.angle += angleDiff * Math.min(1, 5 * dt);

        guard.x += Math.cos(guard.angle) * curSpeed * dt;
        guard.y += Math.sin(guard.angle) * curSpeed * dt;
      }
    }

    // Alarm cooldown when safe
    if (!state.detectedByGuard && !state.detectedByCamera && !state.detectedByLaser) {
      state.alarm = Math.max(0, state.alarm - ALARM_CONFIG.decayRate * dt);
    }
    state.alarm = Math.min(100, Math.max(0, state.alarm));

    // Interaction handling (Hacking terminals & stealing vault diamond)
    player.isHacking = false;
    if (input.isInteracting) {
      // Check terminals
      for (let i = 0; i < terminals.length; i++) {
        const term = terminals[i];
        if (!term.hacked && Math.hypot(player.x - term.x, player.y - term.y) < 45) {
          term.hacked = true;
          player.isHacking = true;
          events |= EVENT_HACK_TICK;
          if (lasers[term.targetLaser - 1]) {
            lasers[term.targetLaser - 1].disabled = true;
          }
          state.statusText = `DEACTIVATED ${term.label}`;
        }
      }

      // Check Vault Pedestal
      if (!vault.unlocked && Math.hypot(player.x - vault.x, player.y - vault.y) < vault.radius + 30) {
        player.isHacking = true;
        player.hackProgress += dt;
        events |= EVENT_HACK_TICK;

        if (player.hackProgress >= vault.hackDuration) {
          vault.unlocked = true;
          player.hasLoot = true;
          state.score += vault.value;
          events |= EVENT_LOOT_GRABBED;
          state.statusText = 'HEIST OBJECTIVE ACQUIRED! ESCAPE TO THE VAN!';
        }
      }
    }

    // Check Exfiltration
    if (player.hasLoot && Math.hypot(player.x - escapeZone.x, player.y - escapeZone.y) < escapeZone.radius) {
      player.escaped = true;
      events |= EVENT_VICTORY;
      state.statusText = 'MISSION ACCOMPLISHED: $2,500,000 EXTRACTED!';
    }

    return events;
  }

  return {
    state,
    reset,
    step,
  };
}
