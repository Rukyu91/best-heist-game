// Staged scenes for deterministic screenshot generation (?shot=play|start|end)
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
import { STATE_ALERT, STATE_PATROL, STATE_SUSPICIOUS } from './world.js';

export function stageShot(name, world) {
  world.reset();
  const state = world.state;

  if (name === 'start') {
    // Title briefing overlay with active background
    state.timeElapsed = 2.5;
    return { screen: SCREEN_TITLE, best: 2500000 };
  }

  if (name === 'end') {
    // Mission completed victory scene
    state.player.hasLoot = true;
    state.player.escaped = true;
    state.player.x = state.escapeZone.x;
    state.player.y = state.escapeZone.y;
    state.score = 2500000;
    state.timeElapsed = 48.6;
    state.alarm = 18;
    return { screen: SCREEN_VICTORY, best: 2500000 };
  }

  // Default: 'play' - The definitive heist frame demonstrating all required criteria:
  // 1. Room thief is crossing
  // 2. Guards with glowing vision cones
  // 3. Security cameras
  // 4. Central vault loot target (The Nyx Core Diamond)
  // 5. Prominent alarm meter
  state.timeElapsed = 14.8;
  state.player.x = 450;
  state.player.y = 330;
  state.player.angle = 0.2; // Facing towards vault
  state.player.isSneaking = true;
  state.player.speed = 90;

  // Position guards dynamically in visual range
  state.guards[0].x = 240;
  state.guards[0].y = 300;
  state.guards[0].angle = 0.15; // Pointing towards center room
  state.guards[0].state = STATE_SUSPICIOUS;
  state.guards[0].suspicion = 55;

  state.guards[1].x = 580;
  state.guards[1].y = 160;
  state.guards[1].angle = 1.2; // Pointing down
  state.guards[1].state = STATE_PATROL;

  state.guards[2].x = 830;
  state.guards[2].y = 390;
  state.guards[2].angle = -2.8; // Facing west
  state.guards[2].state = STATE_PATROL;

  // Active camera beam sweeping
  state.cameras[0].angle = 0.45;
  state.cameras[0].detecting = false;

  // Lasers active
  state.lasers[0].active = true;
  state.lasers[1].active = true;

  // Alarm meter visible in suspicious state
  state.alarm = 38;
  state.statusText = 'SUSPICIOUS ACTIVITY REPORTED IN SECTOR B';

  return { screen: SCREEN_PLAY, best: 2500000 };
}

