// ShadowVault World Simulation Engine: Tactical Infiltration, Raycasting & AI
import {
  ALARM_CONFIG, // Facility alarm rates and thresholds
  CAMERA_CONFIG, // CCTV surveillance properties
  GUARD_CONFIG, // Security guard AI patrol, search & chase parameters
  LOOT_CONFIG, // Vault target diamond values
  PLAYER_CONFIG, // Operative movement and noise settings
  SCREEN_HEIGHT, // Canvas height (720px)
  SCREEN_WIDTH, // Canvas width (1280px)
  STEP, // Simulation tick delta (1/60 sec)
} from './config.js';
import { createParticleSystem } from './particles.js'; // Visual particles FX engine
import { createTacticalTelemetry } from './scoring.js'; // Tactical performance metrics
import { createTacticsModel } from './tactics.js'; // Acoustic wall damping and vision model

export const STATE_PATROL = 0; // Guard passive patrol waypoint state
export const STATE_SUSPICIOUS = 1; // Guard cautious investigation state
export const STATE_ALERT = 2; // Guard active chase pursuit state

export const EVENT_NONE = 0; // Empty simulation event bitmask
export const EVENT_SUSPICIOUS = 1; // Guard acoustic or visual suspicion event
export const EVENT_ALARM_SPIKE = 2; // Intrusion detection alarm spike event
export const EVENT_HACK_TICK = 4; // Terminal or vault hack cycle event
export const EVENT_LOOT_GRABBED = 8; // Primary vault relic acquired event
export const EVENT_VICTORY = 16; // Successful exfiltration extraction event
export const EVENT_CAUGHT = 32; // Operative captured failure event

// Fast 2D segment-segment intersection test helper
function testSegmentIntersection(p1, p2, p3, p4) {
  const determinantValue = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y); // Cross product denominator
  if (Math.abs(determinantValue) < 1e-9) return false; // Parallel segments do not intersect
  const paramUa = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / determinantValue; // Parametric t1
  const paramUb = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / determinantValue; // Parametric t2
  return paramUa >= 0 && paramUa <= 1 && paramUb >= 0 && paramUb <= 1; // Returns true if segments cross
}

export function createWorld(randomSeedValue = 1) {
  let internalPrngState = randomSeedValue; // PRNG seed tracker
  function generateRandomFloat() {
    internalPrngState = (internalPrngState * 1664525 + 1013904223) % 4294967296; // LCG random generator
    return internalPrngState / 4294967296; // Normalize to [0, 1)
  }

  // Gallery perimeter walls, security partitions, vault chamber, and cover pillars
  const architecturalWalls = [
    // Outer perimeter boundaries (leaving top 70px for HUD)
    { x1: 40, y1: 70, x2: 1240, y2: 70 }, // Top boundary wall
    { x1: 1240, y1: 70, x2: 1240, y2: 690 }, // Right boundary wall
    { x1: 1240, y1: 690, x2: 40, y2: 690 }, // Bottom boundary wall
    { x1: 40, y1: 690, x2: 40, y2: 70 }, // Left boundary wall

    // West security wing partition wall with doorway gap
    { x1: 300, y1: 70, x2: 300, y2: 280 }, // West partition top segment
    { x1: 300, y1: 380, x2: 300, y2: 690 }, // West partition bottom segment

    // East archive wing partition wall with doorway gap
    { x1: 980, y1: 70, x2: 980, y2: 320 }, // East partition top segment
    { x1: 980, y1: 420, x2: 980, y2: 690 }, // East partition bottom segment

    // Central High-Security Vault Chamber surrounding the pedestal
    { x1: 520, y1: 240, x2: 760, y2: 240 }, // Vault chamber north wall
    { x1: 760, y1: 240, x2: 760, y2: 480 }, // Vault chamber east wall
    { x1: 760, y1: 480, x2: 520, y2: 480 }, // Vault chamber south wall
    { x1: 520, y1: 480, x2: 520, y2: 240 }, // Vault chamber west wall

    // Tactical cover pillar A (Northwest quadrant)
    { x1: 160, y1: 200, x2: 200, y2: 200 }, // Pillar A top edge
    { x1: 200, y1: 200, x2: 200, y2: 240 }, // Pillar A right edge
    { x1: 200, y1: 240, x2: 160, y2: 240 }, // Pillar A bottom edge
    { x1: 160, y1: 240, x2: 160, y2: 200 }, // Pillar A left edge

    // Tactical cover pillar B (Southwest quadrant)
    { x1: 160, y1: 460, x2: 200, y2: 460 }, // Pillar B top edge
    { x1: 200, y1: 460, x2: 200, y2: 500 }, // Pillar B right edge
    { x1: 200, y1: 500, x2: 160, y2: 500 }, // Pillar B bottom edge
    { x1: 160, y1: 500, x2: 160, y2: 460 }, // Pillar B left edge

    // Tactical cover pillar C (Northeast quadrant)
    { x1: 1080, y1: 220, x2: 1120, y2: 220 }, // Pillar C top edge
    { x1: 1120, y1: 220, x2: 1120, y2: 260 }, // Pillar C right edge
    { x1: 1120, y1: 260, x2: 1080, y2: 260 }, // Pillar C bottom edge
    { x1: 1080, y1: 260, x2: 1080, y2: 220 }, // Pillar C left edge

    // Tactical cover pillar D (Southeast quadrant)
    { x1: 1080, y1: 480, x2: 1120, y2: 480 }, // Pillar D top edge
    { x1: 1120, y1: 480, x2: 1120, y2: 520 }, // Pillar D right edge
    { x1: 1120, y1: 520, x2: 1080, y2: 520 }, // Pillar D bottom edge
    { x1: 1080, y1: 520, x2: 1080, y2: 480 }, // Pillar D left edge
  ];

  // Visual particle FX subsystem instance
  const particleEngineInstance = createParticleSystem();

  // Performance telemetry tracker instance
  const telemetryTrackerInstance = createTacticalTelemetry();

  // Spatial tactics and acoustic raycast model
  const tacticsSpatialModel = createTacticsModel(architecturalWalls);

  // The operative (thief) entity state
  const operativePlayer = {
    x: 100, // Starting horizontal coordinate near insertion van
    y: 620, // Starting vertical coordinate near insertion van
    angle: -Math.PI / 2, // Facing north towards gallery entryway
    radius: PLAYER_CONFIG.radius, // Body collision circle radius
    speed: 0, // Current movement velocity
    isSneaking: false, // Stealth sneak flag (reduces noise)
    hasLoot: false, // Target diamond possession flag
    isHacking: false, // Terminal/safe interaction flag
    hackProgress: 0, // Safe breach progress in seconds
    alive: true, // Operative active status
    escaped: false, // Successful exfiltration flag
  };

  // Facility security guards with looping patrol waypoints
  const facilityGuards = [
    {
      id: 1, // West security wing patrol guard
      x: 220, // Initial X coordinate
      y: 160, // Initial Y coordinate
      angle: Math.PI / 2, // Facing downward
      targetAngle: Math.PI / 2, // Desired rotation heading
      waypoints: [
        { x: 220, y: 160 }, // Waypoint 1
        { x: 220, y: 480 }, // Waypoint 2
        { x: 120, y: 480 }, // Waypoint 3
        { x: 120, y: 160 }, // Waypoint 4
      ],
      waypointIdx: 0, // Active target waypoint index
      state: STATE_PATROL, // Initial AI state
      suspicion: 0, // Current suspicion meter
      investigateTimer: 0, // Pause timer at investigation point
      investigateTarget: null, // Investigation target coordinate
    },
    {
      id: 2, // Central gallery north corridor guard
      x: 420, // Initial X coordinate
      y: 150, // Initial Y coordinate
      angle: 0, // Facing eastward
      targetAngle: 0, // Desired rotation heading
      waypoints: [
        { x: 420, y: 150 }, // North hall west point
        { x: 860, y: 150 }, // North hall east point
        { x: 860, y: 200 }, // North hall turning point
        { x: 420, y: 200 }, // North hall return point
      ],
      waypointIdx: 0, // Active target waypoint index
      state: STATE_PATROL, // Initial AI state
      suspicion: 0, // Current suspicion meter
      investigateTimer: 0, // Investigation pause timer
      investigateTarget: null, // Investigation coordinate
    },
    {
      id: 3, // Central gallery south corridor guard
      x: 440, // Initial X coordinate
      y: 560, // Initial Y coordinate
      angle: 0, // Facing eastward
      targetAngle: 0, // Desired rotation heading
      waypoints: [
        { x: 440, y: 560 }, // South hall west point
        { x: 840, y: 560 }, // South hall east point
        { x: 840, y: 360 }, // Center hall side point
        { x: 440, y: 360 }, // Center hall return point
      ],
      waypointIdx: 0, // Active target waypoint index
      state: STATE_PATROL, // Initial AI state
      suspicion: 0, // Current suspicion meter
      investigateTimer: 0, // Investigation pause timer
      investigateTarget: null, // Investigation coordinate
    },
    {
      id: 4, // East archive wing patrol guard
      x: 1080, // Initial X coordinate
      y: 160, // Initial Y coordinate
      angle: Math.PI / 2, // Facing downward
      targetAngle: Math.PI / 2, // Desired rotation heading
      waypoints: [
        { x: 1080, y: 160 }, // East wing waypoint 1
        { x: 1080, y: 440 }, // East wing waypoint 2
        { x: 1180, y: 440 }, // East wing waypoint 3
        { x: 1180, y: 160 }, // East wing waypoint 4
      ],
      waypointIdx: 0, // Active target waypoint index
      state: STATE_PATROL, // Initial AI state
      suspicion: 0, // Current suspicion meter
      investigateTimer: 0, // Investigation pause timer
      investigateTarget: null, // Investigation coordinate
    },
  ];

  // Wall-mounted sweeping surveillance cameras
  const surveillanceCameras = [
    {
      id: 1, // West perimeter surveillance camera
      x: 45, // Anchored to west outer wall
      y: 280, // Elevation coordinate
      baseAngle: 0, // Centered facing east into gallery
      sweepRange: 0.8, // Oscillating sweep angle amplitude (+/- 0.8 rad)
      angle: 0, // Current dynamic camera aim angle
      timer: 0, // Oscillating sweep timer accumulator
      detecting: false, // Intruder in sight flag
    },
    {
      id: 2, // East perimeter surveillance camera
      x: 1235, // Anchored to east outer wall
      y: 350, // Elevation coordinate
      baseAngle: Math.PI, // Centered facing west into archives
      sweepRange: 0.75, // Sweep amplitude (+/- 0.75 rad)
      angle: Math.PI, // Current aim angle
      timer: 1.5, // Sweep phase offset
      detecting: false, // Intruder in sight flag
    },
  ];

  // Laser security tripwire barriers
  const laserTripwires = [
    { id: 1, x1: 530, y1: 240, x2: 750, y2: 240, active: true, disabled: false, timer: 0, period: 4.0 }, // Vault north laser
    { id: 2, x1: 980, y1: 320, x2: 980, y2: 420, active: true, disabled: false, timer: 1.2, period: 3.5 }, // East gateway laser
    { id: 3, x1: 530, y1: 480, x2: 750, y2: 480, active: true, disabled: false, timer: 2.0, period: 4.0 }, // Vault south laser
  ];

  // Hackable security consoles / keypads to disable lasers
  const securityTerminals = [
    { id: 1, x: 250, y: 120, hacked: false, targetLaser: 1, label: 'LASER A CONSOLE' }, // West console deactivates laser 1
    { id: 2, x: 1040, y: 110, hacked: false, targetLaser: 2, label: 'VAULT BYPASS' }, // East console deactivates laser 2
  ];

  // Primary vault chamber & target diamond relic
  const centralVault = {
    x: 640, // Centered horizontally in facility
    y: 360, // Centered vertically in facility
    radius: 35, // Pedestal circular radius
    loot: LOOT_CONFIG.name, // Relic name (Heart of Nyx)
    value: LOOT_CONFIG.value, // Relic cash bounty ($2.5M)
    unlocked: false, // Vault safe lock status
    hackDuration: LOOT_CONFIG.hackDuration, // Duration to crack safe (3.0s)
  };

  // Getaway extraction vehicle drop-off zone
  const extractionEscapeZone = {
    x: 80, // Loading dock horizontal anchor
    y: 640, // Loading dock vertical anchor
    radius: 50, // Van extraction area radius
    label: 'EXTRACTION VAN', // Zone display label
  };

  // Simulation comprehensive state object
  const worldSimulationState = {
    player: operativePlayer, // Reference to player operative
    guards: facilityGuards, // Reference to security guards array
    cameras: surveillanceCameras, // Reference to CCTV cameras array
    lasers: laserTripwires, // Reference to laser tripwires array
    terminals: securityTerminals, // Reference to hackable keypads array
    vault: centralVault, // Reference to central vault objective
    escapeZone: extractionEscapeZone, // Reference to getaway van zone
    walls: architecturalWalls, // Reference to room boundary walls array
    particles: particleEngineInstance, // Reference to particle visual FX engine
    telemetry: telemetryTrackerInstance, // Reference to performance telemetry
    alarm: 0, // Global facility alarm meter (0-100)
    score: 0, // Extracted bounty value
    timeElapsed: 0, // Cumulative infiltration mission seconds
    detectedByGuard: false, // Active guard visual detection flag
    detectedByCamera: false, // Active CCTV visual detection flag
    detectedByLaser: false, // Active laser beam trip flag
    statusText: 'INFILTRATING VAULT FACILITY', // Mission status subtitle
  };

  function checkLineOfSightClear(fromX, fromY, toX, toY) {
    const pointOrigin = { x: fromX, y: fromY }; // Source ray origin
    const pointTarget = { x: toX, y: toY }; // Target ray destination
    for (let wallIndex = 0; wallIndex < architecturalWalls.length; wallIndex++) {
      const obstacleWall = architecturalWalls[wallIndex]; // Wall segment
      if (testSegmentIntersection(pointOrigin, pointTarget, { x: obstacleWall.x1, y: obstacleWall.y1 }, { x: obstacleWall.x2, y: obstacleWall.y2 })) {
        return false; // Ray obstructed by wall
      }
    }
    return true; // Clear unobstructed line of sight
  }

  function resetSimulationWorld() {
    operativePlayer.x = 100; // Reset player X coordinate
    operativePlayer.y = 620; // Reset player Y coordinate
    operativePlayer.angle = -Math.PI / 2; // Reset player heading
    operativePlayer.speed = 0; // Reset player velocity
    operativePlayer.isSneaking = false; // Clear sneaking flag
    operativePlayer.hasLoot = false; // Clear diamond possession
    operativePlayer.isHacking = false; // Clear hacking interaction
    operativePlayer.hackProgress = 0; // Reset safe breach progress
    operativePlayer.alive = true; // Mark operative alive
    operativePlayer.escaped = false; // Clear victory escape flag

    worldSimulationState.alarm = 0; // Reset facility alarm meter
    worldSimulationState.score = 0; // Reset mission score
    worldSimulationState.timeElapsed = 0; // Reset mission stopwatch
    worldSimulationState.statusText = 'INFILTRATING VAULT FACILITY'; // Reset status line

    centralVault.unlocked = false; // Re-lock central vault safe
    securityTerminals.forEach((term) => (term.hacked = false)); // Re-arm keypads
    laserTripwires.forEach((beam) => (beam.disabled = false)); // Re-arm lasers

    particleEngineInstance.clear(); // Clear all particles
    telemetryTrackerInstance.reset(); // Clear telemetry metrics

    facilityGuards.forEach((patrolGuard) => {
      patrolGuard.waypointIdx = 0; // Reset to primary patrol node
      patrolGuard.x = patrolGuard.waypoints[0].x; // Snap to node X
      patrolGuard.y = patrolGuard.waypoints[0].y; // Snap to node Y
      patrolGuard.state = STATE_PATROL; // Reset AI to patrol mode
      patrolGuard.suspicion = 0; // Clear suspicion meter
      patrolGuard.investigateTimer = 0; // Clear search timer
      patrolGuard.investigateTarget = null; // Clear investigation point
    });
  }

  function stepSimulationWorld(deltaSeconds, inputControl) {
    if (!operativePlayer.alive || operativePlayer.escaped) return EVENT_NONE; // Abort when dead or escaped

    let generatedEventsBitmask = EVENT_NONE; // Bitmask accumulating events
    worldSimulationState.timeElapsed += deltaSeconds; // Increment mission timer

    // Advance particle effects physics
    particleEngineInstance.update(deltaSeconds);

    // Emit subtle ambient crystal shimmer near central vault diamond
    if (!centralVault.unlocked && Math.random() < 0.3) {
      particleEngineInstance.emitDiamondShimmer(centralVault.x, centralVault.y);
    }

    // Calculate operative movement velocity based on sneak toggle
    let operativeTargetVelocity = PLAYER_CONFIG.walkSpeed; // Base walk speed
    if (inputControl.isSneaking) operativeTargetVelocity = PLAYER_CONFIG.sneakSpeed; // Sneak speed

    const displacementVectorX = inputControl.dx * operativeTargetVelocity * deltaSeconds; // Delta X
    const displacementVectorY = inputControl.dy * operativeTargetVelocity * deltaSeconds; // Delta Y

    if (inputControl.dx !== 0 || inputControl.dy !== 0) {
      operativePlayer.angle = Math.atan2(inputControl.dy, inputControl.dx); // Update heading angle
      operativePlayer.speed = operativeTargetVelocity; // Update active speed
      telemetryTrackerInstance.recordMovement(operativeTargetVelocity, deltaSeconds, inputControl.isSneaking); // Log telemetry

      if (Math.random() < 0.25) {
        particleEngineInstance.emitFootstepDustPuff(operativePlayer.x, operativePlayer.y, inputControl.isSneaking); // Dust
      }
    } else {
      operativePlayer.speed = 0; // Zero speed when idle
    }
    operativePlayer.isSneaking = inputControl.isSneaking; // Set sneak flag

    // Circle-to-segment collision resolution against all gallery walls
    let candidatePositionX = operativePlayer.x + displacementVectorX; // Candidate new X
    let candidatePositionY = operativePlayer.y + displacementVectorY; // Candidate new Y

    for (let wallIndex = 0; wallIndex < architecturalWalls.length; wallIndex++) {
      const obstacleWall = architecturalWalls[wallIndex]; // Wall segment
      const wallDeltaX = obstacleWall.x2 - obstacleWall.x1; // Wall vector X
      const wallDeltaY = obstacleWall.y2 - obstacleWall.y1; // Wall vector Y
      const wallLengthSquared = wallDeltaX * wallDeltaX + wallDeltaY * wallDeltaY; // Squared segment length
      let projectionParam = ((candidatePositionX - obstacleWall.x1) * wallDeltaX + (candidatePositionY - obstacleWall.y1) * wallDeltaY) / wallLengthSquared; // Projection parameter
      projectionParam = Math.max(0, Math.min(1, projectionParam)); // Clamp to segment
      const closestPointX = obstacleWall.x1 + projectionParam * wallDeltaX; // Closest point X
      const closestPointY = obstacleWall.y1 + projectionParam * wallDeltaY; // Closest point Y
      const separationDistance = Math.hypot(candidatePositionX - closestPointX, candidatePositionY - closestPointY); // Distance to wall

      if (separationDistance < operativePlayer.radius + 2) {
        const penetrationDepth = operativePlayer.radius + 2 - separationDistance; // Collision overlap depth
        const pushNormalX = separationDistance > 0 ? (candidatePositionX - closestPointX) / separationDistance : 0; // Push normal X
        const pushNormalY = separationDistance > 0 ? (candidatePositionY - closestPointY) / separationDistance : 0; // Push normal Y
        candidatePositionX += pushNormalX * penetrationDepth; // Resolve overlap on X
        candidatePositionY += pushNormalY * penetrationDepth; // Resolve overlap on Y
      }
    }
    operativePlayer.x = Math.max(50, Math.min(1230, candidatePositionX)); // Clamp within canvas X bounds
    operativePlayer.y = Math.max(80, Math.min(680, candidatePositionY)); // Clamp within canvas Y bounds

    // Update CCTV Surveillance Cameras
    worldSimulationState.detectedByCamera = false; // Reset camera alarm flag
    for (let cameraIndex = 0; cameraIndex < surveillanceCameras.length; cameraIndex++) {
      const cctvCamera = surveillanceCameras[cameraIndex]; // Active camera unit
      cctvCamera.timer += deltaSeconds * CAMERA_CONFIG.sweepSpeed; // Advance oscillating sweep timer
      cctvCamera.angle = cctvCamera.baseAngle + Math.sin(cctvCamera.timer) * cctvCamera.sweepRange; // Compute sweep angle

      const distanceToOperative = Math.hypot(operativePlayer.x - cctvCamera.x, operativePlayer.y - cctvCamera.y); // Distance check
      if (distanceToOperative <= CAMERA_CONFIG.viewDistance) {
        const angleTowardsOperative = Math.atan2(operativePlayer.y - cctvCamera.y, operativePlayer.x - cctvCamera.x); // Aim angle
        let angularDeviation = Math.abs(angleTowardsOperative - cctvCamera.angle); // Angle difference
        while (angularDeviation > Math.PI) angularDeviation -= Math.PI * 2; // Normalize angle wrap
        angularDeviation = Math.abs(angularDeviation); // Absolute angle error

        if (angularDeviation <= CAMERA_CONFIG.fov / 2) {
          if (checkLineOfSightClear(cctvCamera.x, cctvCamera.y, operativePlayer.x, operativePlayer.y)) {
            worldSimulationState.detectedByCamera = true; // Intruder spotted by camera
            cctvCamera.detecting = true; // Light up alert LED
            worldSimulationState.alarm += ALARM_CONFIG.cameraDetectionRate * deltaSeconds; // Spike alarm gauge
            generatedEventsBitmask |= EVENT_ALARM_SPIKE; // Dispatch alarm event
          }
        }
      }
      if (!worldSimulationState.detectedByCamera) cctvCamera.detecting = false; // Reset LED when clear
    }

    // Update Security Laser Tripwires
    worldSimulationState.detectedByLaser = false; // Reset laser alarm flag
    for (let laserIndex = 0; laserIndex < laserTripwires.length; laserIndex++) {
      const laserTripwire = laserTripwires[laserIndex]; // Active laser beam
      if (laserTripwire.disabled) continue; // Skip bypassed laser tripwire

      laserTripwire.timer += deltaSeconds; // Advance cycle timer
      laserTripwire.active = Math.sin(laserTripwire.timer * 2) > -0.2; // Periodic blinking cycle

      if (laserTripwire.active) {
        const operativeCrossingSegment = {
          x1: operativePlayer.x - operativePlayer.radius, // Body chord start X
          y1: operativePlayer.y, // Body chord start Y
          x2: operativePlayer.x + operativePlayer.radius, // Body chord end X
          y2: operativePlayer.y, // Body chord end Y
        };
        if (testSegmentIntersection(operativeCrossingSegment, { x: operativePlayer.x, y: operativePlayer.y }, { x: laserTripwire.x1, y: laserTripwire.y1 }, { x: laserTripwire.x2, y: laserTripwire.y2 })) {
          worldSimulationState.detectedByLaser = true; // Laser beam interrupted
          worldSimulationState.alarm += ALARM_CONFIG.laserDetectionRate * deltaSeconds; // Rapid alarm surge
          generatedEventsBitmask |= EVENT_ALARM_SPIKE; // Dispatch alarm event
          particleEngineInstance.emitLaserSparks(operativePlayer.x, operativePlayer.y, 4); // Laser contact sparks
        }
      }
    }

    // Update Security Guards AI State Machine & Vision
    worldSimulationState.detectedByGuard = false; // Reset guard alarm flag
    for (let guardIndex = 0; guardIndex < facilityGuards.length; guardIndex++) {
      const patrolGuard = facilityGuards[guardIndex]; // Active guard entity
      const guardToPlayerDistance = Math.hypot(operativePlayer.x - patrolGuard.x, operativePlayer.y - patrolGuard.y); // Distance

      // Guard visual perception check
      if (guardToPlayerDistance <= GUARD_CONFIG.viewDistance) {
        const angleTowardsPlayer = Math.atan2(operativePlayer.y - patrolGuard.y, operativePlayer.x - patrolGuard.x); // Direction angle
        let viewAngleDifference = Math.abs(angleTowardsPlayer - patrolGuard.angle); // Angle error
        while (viewAngleDifference > Math.PI) viewAngleDifference -= Math.PI * 2; // Normalize wrapping
        viewAngleDifference = Math.abs(viewAngleDifference); // Absolute error

        if (viewAngleDifference <= GUARD_CONFIG.fov / 2) {
          if (checkLineOfSightClear(patrolGuard.x, patrolGuard.y, operativePlayer.x, operativePlayer.y)) {
            worldSimulationState.detectedByGuard = true; // Guard spotted intruder
            patrolGuard.state = STATE_ALERT; // Switch AI state to alert pursuit
            patrolGuard.suspicion = 100; // Maximize suspicion gauge
            patrolGuard.investigateTarget = { x: operativePlayer.x, y: operativePlayer.y }; // Target player location
            worldSimulationState.alarm += GUARD_CONFIG.detectionRate || ALARM_CONFIG.guardDetectionRate * deltaSeconds; // Spike alarm
            generatedEventsBitmask |= EVENT_ALARM_SPIKE; // Dispatch alarm event
          }
        }
      }

      // Guard acoustic perception (hearing non-sneaking footsteps with wall damping)
      const currentFootstepNoiseRadius = operativePlayer.isSneaking ? PLAYER_CONFIG.sneakNoiseRadius : PLAYER_CONFIG.walkNoiseRadius; // Radius
      const wallDampingFactor = tacticsSpatialModel.getAcousticOcclusion(operativePlayer.x, operativePlayer.y, patrolGuard.x, patrolGuard.y);
      const effectiveHearingDistance = currentFootstepNoiseRadius * wallDampingFactor;

      if (operativePlayer.speed > 0 && guardToPlayerDistance < effectiveHearingDistance && patrolGuard.state === STATE_PATROL) {
        patrolGuard.state = STATE_SUSPICIOUS; // Switch to suspicious state
        patrolGuard.suspicion = Math.max(patrolGuard.suspicion, 60); // Elevate suspicion
        patrolGuard.investigateTarget = { x: operativePlayer.x, y: operativePlayer.y }; // Investigate noise origin
        generatedEventsBitmask |= EVENT_SUSPICIOUS; // Dispatch suspicious event
      }

      // Guard pathfinding and behavior movement
      let destinationCoordinateX = patrolGuard.x; // Target X
      let destinationCoordinateY = patrolGuard.y; // Target Y
      let guardActiveVelocity = GUARD_CONFIG.patrolSpeed; // Base speed

      if (patrolGuard.state === STATE_ALERT && patrolGuard.investigateTarget) {
        destinationCoordinateX = patrolGuard.investigateTarget.x; // Pursue intruder X
        destinationCoordinateY = patrolGuard.investigateTarget.y; // Pursue intruder Y
        guardActiveVelocity = GUARD_CONFIG.pursuitSpeed; // Pursuit sprint speed

        if (guardToPlayerDistance < patrolGuard.radius + operativePlayer.radius + 4) {
          operativePlayer.alive = false; // Operative apprehended by guard
          generatedEventsBitmask |= EVENT_CAUGHT; // Dispatch caught event
          worldSimulationState.statusText = 'CAUGHT BY FACILITY SECURITY FORCE!'; // Announce failure
        }
      } else if (patrolGuard.state === STATE_SUSPICIOUS && patrolGuard.investigateTarget) {
        destinationCoordinateX = patrolGuard.investigateTarget.x; // Search noise origin X
        destinationCoordinateY = patrolGuard.investigateTarget.y; // Search noise origin Y
        guardActiveVelocity = GUARD_CONFIG.searchSpeed; // Cautious search speed

        if (Math.hypot(patrolGuard.x - destinationCoordinateX, patrolGuard.y - destinationCoordinateY) < 15) {
          patrolGuard.investigateTimer += deltaSeconds; // Pause and inspect area
          if (patrolGuard.investigateTimer > 3.0) {
            patrolGuard.state = STATE_PATROL; // Return to passive patrol
            patrolGuard.investigateTimer = 0; // Clear timer
            patrolGuard.investigateTarget = null; // Clear investigation target
          }
        }
      } else {
        const activePatrolWaypoint = patrolGuard.waypoints[patrolGuard.waypointIdx]; // Next patrol waypoint
        destinationCoordinateX = activePatrolWaypoint.x; // Waypoint X
        destinationCoordinateY = activePatrolWaypoint.y; // Waypoint Y
        guardActiveVelocity = GUARD_CONFIG.patrolSpeed; // Normal patrol speed

        if (Math.hypot(patrolGuard.x - destinationCoordinateX, patrolGuard.y - destinationCoordinateY) < 10) {
          patrolGuard.waypointIdx = (patrolGuard.waypointIdx + 1) % patrolGuard.waypoints.length; // Advance waypoint loop
        }
      }

      const displacementTowardsTargetX = destinationCoordinateX - patrolGuard.x; // Heading vector X
      const displacementTowardsTargetY = destinationCoordinateY - patrolGuard.y; // Heading vector Y
      const totalDistanceToDestination = Math.hypot(displacementTowardsTargetX, displacementTowardsTargetY); // Distance

      if (totalDistanceToDestination > 1) {
        patrolGuard.targetAngle = Math.atan2(displacementTowardsTargetY, displacementTowardsTargetX); // Heading angle
        let angularTurningError = patrolGuard.targetAngle - patrolGuard.angle; // Turning error
        while (angularTurningError > Math.PI) angularTurningError -= Math.PI * 2; // Normalize wrap
        while (angularTurningError < -Math.PI) angularTurningError += Math.PI * 2; // Normalize wrap
        patrolGuard.angle += angularTurningError * Math.min(1, 5 * deltaSeconds); // Smooth angular rotation

        patrolGuard.x += Math.cos(patrolGuard.angle) * guardActiveVelocity * deltaSeconds; // Advance X
        patrolGuard.y += Math.sin(patrolGuard.angle) * guardActiveVelocity * deltaSeconds; // Advance Y
      }
    }

    // Dissipate alarm gauge when hidden in shadows away from detectors
    if (!worldSimulationState.detectedByGuard && !worldSimulationState.detectedByCamera && !worldSimulationState.detectedByLaser) {
      worldSimulationState.alarm = Math.max(0, worldSimulationState.alarm - ALARM_CONFIG.decayRate * deltaSeconds); // Cooldown
    }
    worldSimulationState.alarm = Math.min(100, Math.max(0, worldSimulationState.alarm)); // Clamp alarm to 0-100
    telemetryTrackerInstance.recordAlarm(worldSimulationState.alarm); // Log alarm sample

    // Interaction handling: hacking terminals & cracking the central vault safe
    operativePlayer.isHacking = false; // Reset interaction flag
    if (inputControl.isInteracting) {
      // Check laser control terminals
      for (let terminalIndex = 0; terminalIndex < securityTerminals.length; terminalIndex++) {
        const keyTerminal = securityTerminals[terminalIndex]; // Keypad console
        if (!keyTerminal.hacked && Math.hypot(operativePlayer.x - keyTerminal.x, operativePlayer.y - keyTerminal.y) < 45) {
          keyTerminal.hacked = true; // Mark terminal bypassed
          operativePlayer.isHacking = true; // Show hacking animation
          generatedEventsBitmask |= EVENT_HACK_TICK; // Dispatch tick sound
          telemetryTrackerInstance.recordLaserBypass(); // Log bypassed laser
          particleEngineInstance.emitTerminalHackGlints(keyTerminal.x, keyTerminal.y, 8); // Hack glints
          if (laserTripwires[keyTerminal.targetLaser - 1]) {
            laserTripwires[keyTerminal.targetLaser - 1].disabled = true; // Deactivate laser beam
          }
          worldSimulationState.statusText = `DEACTIVATED ${keyTerminal.label}`; // Update status
        }
      }

      // Check Central Vault Pedestal
      if (!centralVault.unlocked && Math.hypot(operativePlayer.x - centralVault.x, operativePlayer.y - centralVault.y) < centralVault.radius + 30) {
        operativePlayer.isHacking = true; // Show safe breach progress
        operativePlayer.hackProgress += deltaSeconds; // Accumulate cracking progress
        generatedEventsBitmask |= EVENT_HACK_TICK; // Dispatch ticking sound

        if (operativePlayer.hackProgress >= centralVault.hackDuration) {
          centralVault.unlocked = true; // Unlock safe door
          operativePlayer.hasLoot = true; // Acquire target diamond
          worldSimulationState.score += centralVault.value; // Award $2,500,000 bounty
          generatedEventsBitmask |= EVENT_LOOT_GRABBED; // Dispatch victory loot event
          particleEngineInstance.emitVaultBreachConfetti(centralVault.x, centralVault.y, 35); // Celebration burst
          worldSimulationState.statusText = 'HEIST OBJECTIVE ACQUIRED! ESCAPE TO THE VAN!'; // Announce escape
        }
      }
    }

    // Check Getaway Extraction Van Exfiltration
    if (operativePlayer.hasLoot && Math.hypot(operativePlayer.x - extractionEscapeZone.x, operativePlayer.y - extractionEscapeZone.y) < extractionEscapeZone.radius) {
      operativePlayer.escaped = true; // Mission completed successfully
      generatedEventsBitmask |= EVENT_VICTORY; // Dispatch victory event
      worldSimulationState.statusText = 'MISSION ACCOMPLISHED: $2,500,000 EXTRACTED!'; // Announce victory
    }

    return generatedEventsBitmask; // Return occurred simulation events
  }

  return {
    state: worldSimulationState, // Expose reactive world state
    reset: resetSimulationWorld, // Expose reset simulation function
    step: stepSimulationWorld, // Expose simulation step function
  };
}
