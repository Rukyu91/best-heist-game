// ShadowVault Deterministic Screenshot Stager (?shot=play|start|end)
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js'; // Screen identifiers
import { STATE_ALERT, STATE_PATROL, STATE_SUSPICIOUS } from './world.js'; // Guard states

export function stageShot(requestedSceneName, activeSimulationWorld) {
  activeSimulationWorld.reset(); // Reset simulation state
  const reactiveWorldState = activeSimulationWorld.state; // World state reference

  if (requestedSceneName === 'start') {
    // Title briefing overlay with active background view
    reactiveWorldState.timeElapsed = 2.5; // Simulate 2.5s elapsed
    return { screen: SCREEN_TITLE, best: 2500000 }; // Return title scene
  }

  if (requestedSceneName === 'end') {
    // Mission completed victory debrief scene
    reactiveWorldState.player.hasLoot = true; // Loot secured in satchel
    reactiveWorldState.player.escaped = true; // Exfiltrated to extraction van
    reactiveWorldState.player.x = reactiveWorldState.escapeZone.x; // At van X
    reactiveWorldState.player.y = reactiveWorldState.escapeZone.y; // At van Y
    reactiveWorldState.score = 2500000; // Total bounty score
    reactiveWorldState.timeElapsed = 48.6; // Clear time
    reactiveWorldState.alarm = 18; // Alarm meter level
    return { screen: SCREEN_VICTORY, best: 2500000 }; // Return victory scene
  }

  // Default: 'play' - The definitive tactical gameplay frame satisfying all required criteria:
  // 1. Infiltrated gallery room with walls & cover pillars
  // 2. Patrolling guards with radiant vision cones
  // 3. Wall-mounted surveillance CCTV camera sweep
  // 4. Central vault loot target (The Heart of Nyx Obsidian Diamond)
  // 5. Prominent HUD security alarm meter
  reactiveWorldState.timeElapsed = 14.8; // Mission stopwatch
  reactiveWorldState.player.x = 450; // Operative horizontal position
  reactiveWorldState.player.y = 330; // Operative vertical position
  reactiveWorldState.player.angle = 0.2; // Facing towards vault pedestal
  reactiveWorldState.player.isSneaking = true; // Stealth sneaking active
  reactiveWorldState.player.speed = 90; // Sneak speed

  // Position guards in visual tactical arrangement
  reactiveWorldState.guards[0].x = 240; // Guard 1 position X
  reactiveWorldState.guards[0].y = 300; // Guard 1 position Y
  reactiveWorldState.guards[0].angle = 0.15; // Heading towards room center
  reactiveWorldState.guards[0].state = STATE_SUSPICIOUS; // Caution alert state
  reactiveWorldState.guards[0].suspicion = 55; // Suspicion level

  reactiveWorldState.guards[1].x = 580; // Guard 2 position X
  reactiveWorldState.guards[1].y = 160; // Guard 2 position Y
  reactiveWorldState.guards[1].angle = 1.2; // Heading downward
  reactiveWorldState.guards[1].state = STATE_PATROL; // Passive patrol

  reactiveWorldState.guards[2].x = 830; // Guard 3 position X
  reactiveWorldState.guards[2].y = 390; // Guard 3 position Y
  reactiveWorldState.guards[2].angle = -2.8; // Heading westward
  reactiveWorldState.guards[2].state = STATE_PATROL; // Passive patrol

  // Surveillance camera sweeping active beam
  reactiveWorldState.cameras[0].angle = 0.45; // CCTV sweep angle
  reactiveWorldState.cameras[0].detecting = false; // Sweep active

  // Laser security tripwire active beams
  reactiveWorldState.lasers[0].active = true; // Laser 1 active
  reactiveWorldState.lasers[1].active = true; // Laser 2 active

  // Prominent security alarm meter in suspicious state
  reactiveWorldState.alarm = 38; // Alarm level 38%
  reactiveWorldState.statusText = 'SUSPICIOUS ACTIVITY REPORTED IN SECTOR B'; // Status line

  return { screen: SCREEN_PLAY, best: 2500000 }; // Return play scene
}
