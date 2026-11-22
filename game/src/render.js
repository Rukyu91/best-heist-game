// ShadowVault: High-Fidelity Canvas 2D Rendering Engine
import {
  ALARM_CONFIG, // Facility alarm thresholds
  CAMERA_CONFIG, // Surveillance camera visual parameters
  GUARD_CONFIG, // Security guard vision cones and colors
  PLAYER_CONFIG, // Operative avatar dimensions and styling
  SCREEN_HEIGHT, // Canvas height (720px)
  SCREEN_WIDTH, // Canvas width (1280px)
} from './config.js';
import { STATE_ALERT, STATE_PATROL, STATE_SUSPICIOUS } from './world.js'; // AI states
import { formatBountyCurrency, formatMissionStopwatch } from './scoring.js'; // Scoring formatters

export const SCREEN_TITLE = 0; // Mission briefing title screen
export const SCREEN_PLAY = 1; // Active tactical infiltration view
export const SCREEN_PAUSED = 2; // Paused game overlay
export const SCREEN_OVER = 3; // Operative captured failure screen
export const SCREEN_VICTORY = 4; // Successful exfiltration debrief screen

export function createRenderer(targetCanvasElement) {
  const renderingContext2d = targetCanvasElement.getContext('2d'); // 2D rendering context

  function renderGalleryFloor(simulationTime) {
    renderingContext2d.fillStyle = '#0a0e17'; // Deep stealth background color
    renderingContext2d.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // Fill screen rectangle

    // Architectural floor tile grid lines
    renderingContext2d.strokeStyle = '#111827'; // Dark grid line stroke
    renderingContext2d.lineWidth = 1; // Single pixel grid line width
    const floorTileDimension = 40; // 40px grid spacing
    for (let gridCoordX = 0; gridCoordX < SCREEN_WIDTH; gridCoordX += floorTileDimension) {
      renderingContext2d.beginPath(); // Start vertical grid line path
      renderingContext2d.moveTo(gridCoordX, 0); // Line top origin
      renderingContext2d.lineTo(gridCoordX, SCREEN_HEIGHT); // Line bottom endpoint
      renderingContext2d.stroke(); // Draw vertical grid line
    }
    for (let gridCoordY = 0; gridCoordY < SCREEN_HEIGHT; gridCoordY += floorTileDimension) {
      renderingContext2d.beginPath(); // Start horizontal grid line path
      renderingContext2d.moveTo(0, gridCoordY); // Line left origin
      renderingContext2d.lineTo(SCREEN_WIDTH, gridCoordY); // Line right endpoint
      renderingContext2d.stroke(); // Draw horizontal grid line
    }
  }

  function renderArchitecturalWalls(wallSegmentsArray) {
    renderingContext2d.shadowColor = 'rgba(0, 0, 0, 0.8)'; // Wall drop shadow color
    renderingContext2d.shadowBlur = 10; // Blur radius for depth
    renderingContext2d.strokeStyle = '#334155'; // Dark slate outer wall foundation
    renderingContext2d.lineWidth = 8; // Heavy structural wall width
    renderingContext2d.lineCap = 'round'; // Smooth rounded corners

    for (let wallIndex = 0; wallIndex < wallSegmentsArray.length; wallIndex++) {
      const activeWallSegment = wallSegmentsArray[wallIndex]; // Active wall line
      renderingContext2d.beginPath(); // Begin wall segment path
      renderingContext2d.moveTo(activeWallSegment.x1, activeWallSegment.y1); // Segment start point
      renderingContext2d.lineTo(activeWallSegment.x2, activeWallSegment.y2); // Segment end point
      renderingContext2d.stroke(); // Stroke outer wall foundation
    }

    // Inner bright neon accent highlight line
    renderingContext2d.shadowBlur = 0; // Disable shadow blur for crisp line
    renderingContext2d.strokeStyle = '#64748b'; // Slate gray inner stroke
    renderingContext2d.lineWidth = 2; // Crisp neon accent width
    for (let wallIndex = 0; wallIndex < wallSegmentsArray.length; wallIndex++) {
      const activeWallSegment = wallSegmentsArray[wallIndex]; // Active wall line
      renderingContext2d.beginPath(); // Begin accent path
      renderingContext2d.moveTo(activeWallSegment.x1, activeWallSegment.y1); // Line start point
      renderingContext2d.lineTo(activeWallSegment.x2, activeWallSegment.y2); // Line end point
      renderingContext2d.stroke(); // Stroke inner highlight
    }
  }

  function renderVisionConeGeometry(coneApexX, coneApexY, coneHeadingAngle, fieldOfViewRadians, coneReachDistance, fillStyleGrad, outlineStrokeColor) {
    renderingContext2d.save(); // Save canvas transformation matrix
    renderingContext2d.beginPath(); // Begin vision cone arc path
    renderingContext2d.moveTo(coneApexX, coneApexY); // Apex source point
    renderingContext2d.arc(coneApexX, coneApexY, coneReachDistance, coneHeadingAngle - fieldOfViewRadians / 2, coneHeadingAngle + fieldOfViewRadians / 2); // Cone sweep arc
    renderingContext2d.closePath(); // Close sector path back to apex

    const coneRadialGradient = renderingContext2d.createRadialGradient(coneApexX, coneApexY, 10, coneApexX, coneApexY, coneReachDistance); // Radial light falloff
    coneRadialGradient.addColorStop(0, fillStyleGrad); // Apex bright intensity
    coneRadialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Edge transparent falloff

    renderingContext2d.fillStyle = coneRadialGradient; // Apply gradient fill
    renderingContext2d.fill(); // Fill vision cone sector

    renderingContext2d.strokeStyle = outlineStrokeColor; // Set perimeter stroke color
    renderingContext2d.lineWidth = 1.5; // Vision cone boundary width
    renderingContext2d.stroke(); // Stroke vision cone boundary
    renderingContext2d.restore(); // Restore transform matrix
  }

  function renderSurveillanceCameras(camerasArray, simTimeElapsed) {
    for (let cameraIndex = 0; cameraIndex < camerasArray.length; cameraIndex++) {
      const activeCctvUnit = camerasArray[cameraIndex]; // CCTV camera unit

      // Sweep vision cone rendering
      const activeConeFillTint = activeCctvUnit.detecting ? CAMERA_CONFIG.alertColor : CAMERA_CONFIG.normalColor; // Fill color
      const activeConeStrokeTint = activeCctvUnit.detecting ? CAMERA_CONFIG.alertStroke : CAMERA_CONFIG.normalStroke; // Stroke color
      renderVisionConeGeometry(activeCctvUnit.x, activeCctvUnit.y, activeCctvUnit.angle, CAMERA_CONFIG.fov, CAMERA_CONFIG.viewDistance, activeConeFillTint, activeConeStrokeTint); // Render cone

      // Camera wall mount swivel base
      renderingContext2d.save(); // Save context state
      renderingContext2d.translate(activeCctvUnit.x, activeCctvUnit.y); // Translate to camera anchor
      renderingContext2d.rotate(activeCctvUnit.angle); // Rotate to camera heading

      renderingContext2d.fillStyle = '#1e293b'; // Base plate dark slate fill
      renderingContext2d.beginPath(); // Swivel base circle path
      renderingContext2d.arc(0, 0, 10, 0, Math.PI * 2); // Circular mounting plate
      renderingContext2d.fill(); // Fill base plate
      renderingContext2d.strokeStyle = '#0284c7'; // Cyan metal border
      renderingContext2d.lineWidth = 2; // Mounting border width
      renderingContext2d.stroke(); // Stroke mounting border

      // Camera housing casing body
      renderingContext2d.fillStyle = '#475569'; // Metal camera casing fill
      renderingContext2d.fillRect(0, -5, 16, 10); // Casing rectangular body

      // Blinking red recording LED indicator
      const cctvLedIsBlinking = Math.sin(simTimeElapsed * 6) > 0; // 3 Hz blinking frequency
      renderingContext2d.fillStyle = cctvLedIsBlinking ? '#ef4444' : '#7f1d1d'; // Bright vs dim red
      renderingContext2d.beginPath(); // LED circle path
      renderingContext2d.arc(12, 0, 2.5, 0, Math.PI * 2); // 2.5px LED indicator
      renderingContext2d.fill(); // Fill LED light

      renderingContext2d.restore(); // Restore context state
    }
  }

  function renderLaserTripwires(lasersArray, simTimeElapsed) {
    for (let laserIndex = 0; laserIndex < lasersArray.length; laserIndex++) {
      const activeLaserBarrier = lasersArray[laserIndex]; // Active laser beam
      if (activeLaserBarrier.disabled) continue; // Skip bypassed laser tripwire

      const dynamicBeamOpacity = activeLaserBarrier.active ? 0.7 + Math.sin(simTimeElapsed * 12) * 0.3 : 0.15; // Pulsing opacity

      renderingContext2d.save(); // Save context state
      renderingContext2d.shadowColor = '#ef4444'; // Red laser glow effect
      renderingContext2d.shadowBlur = activeLaserBarrier.active ? 15 : 0; // Blur glow intensity
      renderingContext2d.strokeStyle = `rgba(239, 68, 68, ${dynamicBeamOpacity})`; // Translucent laser beam color
      renderingContext2d.lineWidth = activeLaserBarrier.active ? 3.5 : 1; // Heavy active beam width

      renderingContext2d.beginPath(); // Laser line path
      renderingContext2d.moveTo(activeLaserBarrier.x1, activeLaserBarrier.y1); // Beam start emitter
      renderingContext2d.lineTo(activeLaserBarrier.x2, activeLaserBarrier.y2); // Beam end receiver
      renderingContext2d.stroke(); // Stroke glowing laser beam

      // Laser emitter wall mounts
      renderingContext2d.fillStyle = '#991b1b'; // Dark crimson mount color
      renderingContext2d.beginPath(); // Emitter circular paths
      renderingContext2d.arc(activeLaserBarrier.x1, activeLaserBarrier.y1, 5, 0, Math.PI * 2); // Emitter mount circle
      renderingContext2d.arc(activeLaserBarrier.x2, activeLaserBarrier.y2, 5, 0, Math.PI * 2); // Receiver mount circle
      renderingContext2d.fill(); // Fill emitter mounts

      renderingContext2d.restore(); // Restore context state
    }
  }

  function renderSecurityKeypads(terminalsArray) {
    for (let terminalIndex = 0; terminalIndex < terminalsArray.length; terminalIndex++) {
      const activeTerminalConsole = terminalsArray[terminalIndex]; // Keypad console
      renderingContext2d.save(); // Save context state
      renderingContext2d.translate(activeTerminalConsole.x, activeTerminalConsole.y); // Translate to keypad location

      renderingContext2d.fillStyle = activeTerminalConsole.hacked ? '#065f46' : '#1e3a8a'; // Green hacked vs Blue locked
      renderingContext2d.fillRect(-14, -10, 28, 20); // Console chassis box

      renderingContext2d.strokeStyle = activeTerminalConsole.hacked ? '#10b981' : '#3b82f6'; // Emerald vs Sky blue border
      renderingContext2d.lineWidth = 2; // Chassis border width
      renderingContext2d.strokeRect(-14, -10, 28, 20); // Stroke chassis box

      // Status indicator LED diode
      renderingContext2d.fillStyle = activeTerminalConsole.hacked ? '#34d399' : '#60a5fa'; // Diode glow color
      renderingContext2d.beginPath(); // Diode circle path
      renderingContext2d.arc(0, 0, 4, 0, Math.PI * 2); // 4px status diode
      renderingContext2d.fill(); // Fill diode

      // Console status label text
      renderingContext2d.font = '9px monospace'; // Monospace label typography
      renderingContext2d.fillStyle = activeTerminalConsole.hacked ? '#a7f3d0' : '#bfdbfe'; // Light text tint
      renderingContext2d.textAlign = 'center'; // Center aligned label
      renderingContext2d.fillText(activeTerminalConsole.hacked ? 'HACKED' : 'KEYPAD', 0, 22); // Draw keypad text

      renderingContext2d.restore(); // Restore context state
    }
  }

  function renderVaultPedestalAndDiamond(vaultChamberObject, simTimeElapsed) {
    renderingContext2d.save(); // Save context state
    renderingContext2d.translate(vaultChamberObject.x, vaultChamberObject.y); // Translate to pedestal center

    // Vault pedestal security floor ring glow
    const diamondPulsePhase = Math.sin(simTimeElapsed * 3) * 0.2 + 0.8; // Harmonic pulse phase
    const pedestalRadialGlow = renderingContext2d.createRadialGradient(0, 0, 10, 0, 0, vaultChamberObject.radius + 20); // Radial aura
    pedestalRadialGlow.addColorStop(0, 'rgba(0, 229, 255, 0.2)'); // Cyan central glow
    pedestalRadialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Edge fade
    renderingContext2d.fillStyle = pedestalRadialGlow; // Apply aura fill
    renderingContext2d.beginPath(); // Pedestal aura path
    renderingContext2d.arc(0, 0, vaultChamberObject.radius + 20, 0, Math.PI * 2); // Aura circle
    renderingContext2d.fill(); // Fill aura

    // Vault pedestal base foundation
    renderingContext2d.fillStyle = '#1e293b'; // Pedestal foundation color
    renderingContext2d.strokeStyle = '#00e5ff'; // Pedestal glowing cyan rim
    renderingContext2d.lineWidth = 2; // Foundation rim width
    renderingContext2d.beginPath(); // Pedestal foundation circle
    renderingContext2d.arc(0, 0, vaultChamberObject.radius, 0, Math.PI * 2); // Foundation circle
    renderingContext2d.fill(); // Fill pedestal
    renderingContext2d.stroke(); // Stroke rim

    if (!vaultChamberObject.unlocked) {
      // Rotating sparkling Obsidian Diamond Relic
      renderingContext2d.rotate(simTimeElapsed * 1.5); // Angular rotation
      renderingContext2d.fillStyle = '#06b6d4'; // Diamond cyan crystal tone
      renderingContext2d.shadowColor = '#00e5ff'; // Diamond glowing shadow
      renderingContext2d.shadowBlur = 15; // Diamond glow intensity

      renderingContext2d.beginPath(); // Diamond rhombus facet path
      renderingContext2d.moveTo(0, -18 * diamondPulsePhase); // Top diamond vertex
      renderingContext2d.lineTo(14 * diamondPulsePhase, 0); // Right diamond vertex
      renderingContext2d.lineTo(0, 18 * diamondPulsePhase); // Bottom diamond vertex
      renderingContext2d.lineTo(-14 * diamondPulsePhase, 0); // Left diamond vertex
      renderingContext2d.closePath(); // Complete rhombus
      renderingContext2d.fill(); // Fill crystal facet

      renderingContext2d.strokeStyle = '#e0f2fe'; // Diamond crystal specular edge
      renderingContext2d.lineWidth = 1.5; // Facet line width
      renderingContext2d.stroke(); // Stroke specular edge

      // Glass containment cylinder ring
      renderingContext2d.shadowBlur = 0; // Disable shadow for glass
      renderingContext2d.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // Glass sheen stroke
      renderingContext2d.lineWidth = 2; // Glass ring width
      renderingContext2d.beginPath(); // Containment ring path
      renderingContext2d.arc(0, 0, vaultChamberObject.radius - 8, 0, Math.PI * 2); // Glass ring
      renderingContext2d.stroke(); // Stroke glass ring
    } else {
      renderingContext2d.font = '10px sans-serif'; // Safe cracked label typography
      renderingContext2d.fillStyle = '#64748b'; // Muted gray text color
      renderingContext2d.textAlign = 'center'; // Center align
      renderingContext2d.fillText('[EMPTY]', 0, 4); // Draw empty indicator
    }

    renderingContext2d.restore(); // Restore context state
  }

  function renderPatrolGuards(guardsArray, simTimeElapsed) {
    for (let guardIndex = 0; guardIndex < guardsArray.length; guardIndex++) {
      const activeGuardEntity = guardsArray[guardIndex]; // Guard entity

      // Vision cone dynamic color selection based on AI state
      let activeConeFillTint = GUARD_CONFIG.patrolColor; // Patrol yellow fill
      let activeConeStrokeTint = GUARD_CONFIG.patrolStroke; // Patrol yellow stroke
      if (activeGuardEntity.state === STATE_SUSPICIOUS) {
        activeConeFillTint = GUARD_CONFIG.suspiciousColor; // Suspicious orange fill
        activeConeStrokeTint = GUARD_CONFIG.suspiciousStroke; // Suspicious orange stroke
      } else if (activeGuardEntity.state === STATE_ALERT) {
        activeConeFillTint = GUARD_CONFIG.alarmColor; // Alert red fill
        activeConeStrokeTint = GUARD_CONFIG.alarmStroke; // Alert red stroke
      }

      renderVisionConeGeometry(activeGuardEntity.x, activeGuardEntity.y, activeGuardEntity.angle, GUARD_CONFIG.fov, GUARD_CONFIG.viewDistance, activeConeFillTint, activeConeStrokeTint); // Render vision cone

      renderingContext2d.save(); // Save context state
      renderingContext2d.translate(activeGuardEntity.x, activeGuardEntity.y); // Translate to guard location
      renderingContext2d.rotate(activeGuardEntity.angle); // Rotate to guard heading

      // Guard physical body avatar
      renderingContext2d.fillStyle = '#334155'; // Dark slate uniform fill
      renderingContext2d.beginPath(); // Guard circular body path
      renderingContext2d.arc(0, 0, activeGuardEntity.radius, 0, Math.PI * 2); // Body circle
      renderingContext2d.fill(); // Fill body
      renderingContext2d.strokeStyle = activeConeStrokeTint; // State outline stroke
      renderingContext2d.lineWidth = 2; // Outline width
      renderingContext2d.stroke(); // Stroke body outline

      // Guard tactical armored vest shoulders
      renderingContext2d.fillStyle = '#1e293b'; // Tactical vest armor fill
      renderingContext2d.fillRect(-8, -12, 16, 24); // Armored vest rectangle

      // Guard weapon and flashlight accessory
      renderingContext2d.fillStyle = '#0f172a'; // Flashlight accessory fill
      renderingContext2d.fillRect(8, 4, 12, 5); // Flashlight barrel rectangle

      renderingContext2d.restore(); // Restore context state

      // Overhead exclamation indicator icon based on suspicion/alert status
      if (activeGuardEntity.state === STATE_ALERT) {
        renderingContext2d.font = 'bold 16px sans-serif'; // Bold alert typography
        renderingContext2d.fillStyle = '#ef4444'; // Bright red alert color
        renderingContext2d.textAlign = 'center'; // Center align
        renderingContext2d.fillText('!', activeGuardEntity.x, activeGuardEntity.y - 20); // Render exclamation point
      } else if (activeGuardEntity.state === STATE_SUSPICIOUS) {
        renderingContext2d.font = 'bold 15px sans-serif'; // Bold caution typography
        renderingContext2d.fillStyle = '#fb923c'; // Bright orange question color
        renderingContext2d.textAlign = 'center'; // Center align
        renderingContext2d.fillText('?', activeGuardEntity.x, activeGuardEntity.y - 20); // Render question mark
      }
    }
  }

  function renderOperativePlayer(playerOperative, simTimeElapsed) {
    renderingContext2d.save(); // Save context state
    renderingContext2d.translate(playerOperative.x, playerOperative.y); // Translate to operative location

    // Acoustic stealth footsteps noise ripple animation
    if (playerOperative.speed > 0) {
      const activeAcousticRadius = playerOperative.isSneaking ? PLAYER_CONFIG.sneakNoiseRadius : PLAYER_CONFIG.walkNoiseRadius; // Acoustic range
      const rippleExpansionProgress = (simTimeElapsed * 3) % 1; // Expanding phase [0, 1)
      renderingContext2d.strokeStyle = `rgba(0, 229, 255, ${0.3 * (1 - rippleExpansionProgress)})`; // Fading cyan wave
      renderingContext2d.lineWidth = 1; // Fine acoustic ripple stroke
      renderingContext2d.beginPath(); // Acoustic wave circle
      renderingContext2d.arc(0, 0, activeAcousticRadius * rippleExpansionProgress, 0, Math.PI * 2); // Expanding circle
      renderingContext2d.stroke(); // Stroke acoustic wave
    }

    renderingContext2d.rotate(playerOperative.angle); // Rotate to operative heading

    // Stealth operative avatar body
    renderingContext2d.shadowColor = '#00e5ff'; // Cyan stealth aura
    renderingContext2d.shadowBlur = playerOperative.hasLoot ? 15 : 6; // Enhanced glow with loot
    renderingContext2d.fillStyle = '#0f172a'; // Midnight stealth bodysuit fill
    renderingContext2d.beginPath(); // Body circle path
    renderingContext2d.arc(0, 0, playerOperative.radius, 0, Math.PI * 2); // Body circle
    renderingContext2d.fill(); // Fill bodysuit

    renderingContext2d.strokeStyle = playerOperative.hasLoot ? '#f59e0b' : '#00e5ff'; // Gold with loot vs cyan normal
    renderingContext2d.lineWidth = 2.5; // Suit edge width
    renderingContext2d.stroke(); // Stroke suit edge

    // Tactical satchel / forward heading backpack
    renderingContext2d.fillStyle = playerOperative.hasLoot ? '#d97706' : '#0284c7'; // Gold pouch with diamond
    renderingContext2d.fillRect(-8, -6, 6, 12); // Satchel rectangle

    renderingContext2d.restore(); // Restore context state

    // Safe cracking or terminal hacking progress bar above head
    if (playerOperative.isHacking && playerOperative.hackProgress > 0) {
      const hackingCompletionPercentage = Math.min(1, playerOperative.hackProgress / 3.0); // Progress ratio [0, 1]
      renderingContext2d.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Progress bar backdrop
      renderingContext2d.fillRect(playerOperative.x - 25, playerOperative.y - 30, 50, 6); // Backdrop rectangle
      renderingContext2d.fillStyle = '#10b981'; // Emerald progress fill
      renderingContext2d.fillRect(playerOperative.x - 25, playerOperative.y - 30, 50 * hackingCompletionPercentage, 6); // Progress bar
    }
  }

  function renderGetawayVanExtractionZone(extractionZoneData) {
    renderingContext2d.save(); // Save context state
    renderingContext2d.translate(extractionZoneData.x, extractionZoneData.y); // Translate to extraction zone

    // Getaway extraction van vehicle representation
    renderingContext2d.fillStyle = '#1e293b'; // Dark metal van body fill
    renderingContext2d.fillRect(-35, -20, 70, 40); // Van vehicle rectangle
    renderingContext2d.strokeStyle = '#10b981'; // Green extraction perimeter line
    renderingContext2d.lineWidth = 2; // Van outline width
    renderingContext2d.strokeRect(-35, -20, 70, 40); // Stroke van body

    // Extraction van tinted windows
    renderingContext2d.fillStyle = '#0284c7'; // Tinted windshield glass fill
    renderingContext2d.fillRect(-15, -16, 20, 32); // Windshield rectangle

    // Extraction perimeter dashed boundary circle
    renderingContext2d.strokeStyle = '#34d399'; // Emerald dashed zone boundary
    renderingContext2d.lineWidth = 1.5; // Boundary stroke width
    renderingContext2d.setLineDash([6, 6]); // Dashed line pattern
    renderingContext2d.beginPath(); // Zone circle path
    renderingContext2d.arc(0, 0, extractionZoneData.radius, 0, Math.PI * 2); // Zone radius circle
    renderingContext2d.stroke(); // Stroke dashed perimeter

    renderingContext2d.font = '10px monospace'; // Monospace van sign typography
    renderingContext2d.fillStyle = '#6ee7b7'; // Mint green sign text
    renderingContext2d.textAlign = 'center'; // Center align
    renderingContext2d.fillText('ESCAPE VAN', 0, 32); // Van signage label

    renderingContext2d.restore(); // Restore context state
  }

  function renderTacticalHeistHUD(currentSimulationState) {
    // Top HUD header bar banner
    renderingContext2d.fillStyle = 'rgba(10, 14, 23, 0.95)'; // Opaque dark banner background
    renderingContext2d.fillRect(0, 0, SCREEN_WIDTH, 60); // Header rectangle
    renderingContext2d.strokeStyle = '#1f2937'; // Bottom divider line
    renderingContext2d.lineWidth = 1; // Single pixel divider
    renderingContext2d.beginPath(); // Divider path
    renderingContext2d.moveTo(0, 60); // Left origin
    renderingContext2d.lineTo(SCREEN_WIDTH, 60); // Right endpoint
    renderingContext2d.stroke(); // Draw divider line

    // 1. PROMINENT ALARM METER (The required prominent visual indicator)
    const alarmMeterFrameWidth = 260; // Meter horizontal width
    const alarmMeterFrameHeight = 16; // Meter vertical height
    const alarmMeterFramePositionX = 40; // Top-left anchor X
    const alarmMeterFramePositionY = 22; // Top-left anchor Y

    renderingContext2d.font = 'bold 11px monospace'; // Monospace title typography
    renderingContext2d.fillStyle = '#94a3b8'; // Slate label color
    renderingContext2d.textAlign = 'left'; // Left align
    renderingContext2d.fillText('SECURITY ALARM METER:', alarmMeterFramePositionX, 15); // Draw meter label

    // Alarm meter background container box
    renderingContext2d.fillStyle = '#0f172a'; // Dark cavity fill
    renderingContext2d.fillRect(alarmMeterFramePositionX, alarmMeterFramePositionY, alarmMeterFrameWidth, alarmMeterFrameHeight); // Frame cavity
    renderingContext2d.strokeStyle = currentSimulationState.alarm > 70 ? '#ef4444' : '#334155'; // Red alert vs Slate border
    renderingContext2d.lineWidth = 1.5; // Frame border width
    renderingContext2d.strokeRect(alarmMeterFramePositionX, alarmMeterFramePositionY, alarmMeterFrameWidth, alarmMeterFrameHeight); // Stroke frame

    // Dynamic gradient alarm level fill
    const currentAlarmFillWidth = (currentSimulationState.alarm / 100) * alarmMeterFrameWidth; // Fill width
    if (currentAlarmFillWidth > 0) {
      const alarmLevelGradient = renderingContext2d.createLinearGradient(alarmMeterFramePositionX, 0, alarmMeterFramePositionX + alarmMeterFrameWidth, 0); // Horizontal gradient
      alarmLevelGradient.addColorStop(0, '#10b981'); // Safe green stop
      alarmLevelGradient.addColorStop(0.4, '#eab308'); // Caution yellow stop
      alarmLevelGradient.addColorStop(0.75, '#f97316'); // Suspicious orange stop
      alarmLevelGradient.addColorStop(1, '#ef4444'); // Lockdown red stop

      renderingContext2d.fillStyle = alarmLevelGradient; // Apply gradient
      renderingContext2d.fillRect(alarmMeterFramePositionX + 1, alarmMeterFramePositionY + 1, currentAlarmFillWidth - 2, alarmMeterFrameHeight - 2); // Draw fill bar
    }

    renderingContext2d.font = 'bold 11px monospace'; // Alarm percentage typography
    renderingContext2d.fillStyle = currentSimulationState.alarm > 70 ? '#fca5a5' : '#f8fafc'; // Text color
    renderingContext2d.textAlign = 'right'; // Right align inside bar
    const alarmStatusLabelPrefix = currentSimulationState.alarm >= 70 ? 'ALERT! ' : currentSimulationState.alarm >= 30 ? 'SUSPICIOUS ' : 'CLEAR '; // Label prefix
    renderingContext2d.fillText(`${alarmStatusLabelPrefix}${Math.floor(currentSimulationState.alarm)}%`, alarmMeterFramePositionX + alarmMeterFrameWidth - 6, alarmMeterFramePositionY + 12); // Draw percentage text

    // 2. MISSION OBJECTIVE BANNER
    renderingContext2d.font = 'bold 13px sans-serif'; // Objective typography
    renderingContext2d.textAlign = 'center'; // Center align
    if (!currentSimulationState.player.hasLoot) {
      renderingContext2d.fillStyle = '#38bdf8'; // Sky blue objective color
      renderingContext2d.fillText('MISSION: INFILTRATE CENTRAL VAULT & STEAL THE NYX CORE', SCREEN_WIDTH / 2, 26); // Infiltration goal
    } else {
      renderingContext2d.fillStyle = '#4ade80'; // Emerald exfiltration color
      renderingContext2d.fillText('HEIST SUCCESSFUL: EXFILTRATE TO EXTRACTION VAN!', SCREEN_WIDTH / 2, 26); // Exfiltration goal
    }
    renderingContext2d.font = '11px monospace'; // Subtitle typography
    renderingContext2d.fillStyle = '#94a3b8'; // Slate status tint
    renderingContext2d.fillText(currentSimulationState.statusText, SCREEN_WIDTH / 2, 44); // Active event status

    // 3. TARGET LOOT STATS
    renderingContext2d.font = 'bold 12px monospace'; // Loot stat typography
    renderingContext2d.fillStyle = '#fbbf24'; // Amber gold value tint
    renderingContext2d.textAlign = 'right'; // Right align
    renderingContext2d.fillText(`LOOT VALUE: ${formatBountyCurrency(currentSimulationState.vault.value)}`, SCREEN_WIDTH - 40, 24); // Bounty value

    renderingContext2d.font = '11px monospace'; // Loot status typography
    renderingContext2d.fillStyle = currentSimulationState.player.hasLoot ? '#4ade80' : '#cbd5e1'; // Green secured vs white locked
    renderingContext2d.fillText(currentSimulationState.player.hasLoot ? 'STATUS: SECURED IN SATCHEL' : 'STATUS: LOCKED IN VAULT', SCREEN_WIDTH - 40, 42); // Loot state

    // 4. RADAR SURVEILLANCE MINIMAP (Bottom-Right HUD element)
    const tacticalMapDimensions = 100; // 100x100 square minimap
    const tacticalMapAnchorX = SCREEN_WIDTH - tacticalMapDimensions - 20; // Anchor X
    const tacticalMapAnchorY = SCREEN_HEIGHT - tacticalMapDimensions - 20; // Anchor Y

    renderingContext2d.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Minimap background fill
    renderingContext2d.fillRect(tacticalMapAnchorX, tacticalMapAnchorY, tacticalMapDimensions, tacticalMapDimensions); // Minimap rectangle
    renderingContext2d.strokeStyle = '#0284c7'; // Minimap frame cyan border
    renderingContext2d.lineWidth = 1.5; // Minimap border width
    renderingContext2d.strokeRect(tacticalMapAnchorX, tacticalMapAnchorY, tacticalMapDimensions, tacticalMapDimensions); // Stroke minimap frame

    // Minimap radar sweep ring
    renderingContext2d.strokeStyle = 'rgba(0, 229, 255, 0.3)'; // Translucent cyan sweep ring
    renderingContext2d.beginPath(); // Sweep ring path
    renderingContext2d.arc(tacticalMapAnchorX + tacticalMapDimensions / 2, tacticalMapAnchorY + tacticalMapDimensions / 2, tacticalMapDimensions / 2 - 4, 0, Math.PI * 2); // Center circle
    renderingContext2d.stroke(); // Stroke sweep ring

    const minimapScaleHorizontal = tacticalMapDimensions / SCREEN_WIDTH; // Horizontal scale factor
    const minimapScaleVertical = tacticalMapDimensions / SCREEN_HEIGHT; // Vertical scale factor

    // Minimap Central Vault blip
    renderingContext2d.fillStyle = '#f59e0b'; // Amber vault blip
    renderingContext2d.fillRect(tacticalMapAnchorX + currentSimulationState.vault.x * minimapScaleHorizontal - 2, tacticalMapAnchorY + currentSimulationState.vault.y * minimapScaleVertical - 2, 5, 5); // Draw vault blip

    // Minimap Patrol Guards blips
    renderingContext2d.fillStyle = '#ef4444'; // Red guard blip
    for (let guardIndex = 0; guardIndex < currentSimulationState.guards.length; guardIndex++) {
      const activePatrolGuard = currentSimulationState.guards[guardIndex]; // Guard entity
      renderingContext2d.fillRect(tacticalMapAnchorX + activePatrolGuard.x * minimapScaleHorizontal - 1.5, tacticalMapAnchorY + activePatrolGuard.y * minimapScaleVertical - 1.5, 3.5, 3.5); // Draw guard blip
    }

    // Minimap Operative Player blip
    renderingContext2d.fillStyle = '#00e5ff'; // Cyan player blip
    renderingContext2d.beginPath(); // Player blip path
    renderingContext2d.arc(tacticalMapAnchorX + currentSimulationState.player.x * minimapScaleHorizontal, tacticalMapAnchorY + currentSimulationState.player.y * minimapScaleVertical, 2.5, 0, Math.PI * 2); // Player blip circle
    renderingContext2d.fill(); // Fill player blip
  }

  function renderTitleBriefingOverlay(bestRecordScore) {
    renderingContext2d.fillStyle = 'rgba(6, 9, 14, 0.88)'; // Dark backdrop tint
    renderingContext2d.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // Screen backdrop

    renderingContext2d.save(); // Save context state
    renderingContext2d.shadowColor = '#00e5ff'; // Title cyan glow
    renderingContext2d.shadowBlur = 25; // Title glow blur

    renderingContext2d.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'; // Title typography
    renderingContext2d.fillStyle = '#f8fafc'; // Crisp white title fill
    renderingContext2d.textAlign = 'center'; // Center align
    renderingContext2d.fillText('SHADOWVAULT: MIDNIGHT HEIST', SCREEN_WIDTH / 2, 230); // Render title

    renderingContext2d.shadowBlur = 0; // Disable shadow blur
    renderingContext2d.font = '16px monospace'; // Subtitle typography
    renderingContext2d.fillStyle = '#38bdf8'; // Sky blue subtitle tint
    renderingContext2d.fillText('TACTICAL STEALTH INFILTRATION SIMULATION', SCREEN_WIDTH / 2, 275); // Render subtitle

    // Mission Briefing Information Panel Box
    renderingContext2d.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Dark briefing container fill
    renderingContext2d.fillRect(SCREEN_WIDTH / 2 - 280, 310, 560, 160); // Briefing container rectangle
    renderingContext2d.strokeStyle = '#334155'; // Container border stroke
    renderingContext2d.lineWidth = 1.5; // Container border width
    renderingContext2d.strokeRect(SCREEN_WIDTH / 2 - 280, 310, 560, 160); // Stroke container

    renderingContext2d.font = '14px -apple-system, sans-serif'; // Briefing text typography
    renderingContext2d.fillStyle = '#cbd5e1'; // Light gray text fill
    renderingContext2d.textAlign = 'left'; // Left align list
    renderingContext2d.fillText('• Target: The Heart of Nyx ($2,500,000 Obsidian Core)', SCREEN_WIDTH / 2 - 250, 345); // Target bullet
    renderingContext2d.fillText('• Threats: 4 patrolling guards with vision cones, 2 CCTV wall cameras', SCREEN_WIDTH / 2 - 250, 375); // Threats bullet
    renderingContext2d.fillText('• Security: Hack terminal keypads to disable active laser barriers', SCREEN_WIDTH / 2 - 250, 405); // Security bullet
    renderingContext2d.fillText('• Exfiltrate: Retrieve the relic and reach the Extraction Van', SCREEN_WIDTH / 2 - 250, 435); // Escape bullet

    // Controls start operation prompt
    renderingContext2d.font = 'bold 16px monospace'; // Prompt typography
    renderingContext2d.fillStyle = '#4ade80'; // Emerald prompt tint
    renderingContext2d.textAlign = 'center'; // Center align
    renderingContext2d.fillText('PRESS [SPACE] OR [ENTER] TO COMMENCE OPERATION', SCREEN_WIDTH / 2, 530); // Start prompt

    renderingContext2d.font = '13px monospace'; // Key bindings typography
    renderingContext2d.fillStyle = '#94a3b8'; // Slate bindings tint
    renderingContext2d.fillText('Controls: WASD/Arrows to Move | Shift to Sneak | Space/E to Hack', SCREEN_WIDTH / 2, 565); // Key bindings guide

    renderingContext2d.restore(); // Restore context state
  }

  function renderGameOverOverlay() {
    renderingContext2d.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Dark failure backdrop
    renderingContext2d.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // Fill screen rectangle

    renderingContext2d.font = 'bold 40px sans-serif'; // Defeat title typography
    renderingContext2d.fillStyle = '#ef4444'; // Red failure tint
    renderingContext2d.textAlign = 'center'; // Center align
    renderingContext2d.fillText('HEIST FAILED: APPREHENDED', SCREEN_WIDTH / 2, 300); // Draw defeat title

    renderingContext2d.font = '16px monospace'; // Defeat message typography
    renderingContext2d.fillStyle = '#cbd5e1'; // Light gray message tint
    renderingContext2d.fillText('Security guards intercepted you in the gallery.', SCREEN_WIDTH / 2, 350); // Defeat explanation

    renderingContext2d.font = 'bold 16px monospace'; // Retry prompt typography
    renderingContext2d.fillStyle = '#38bdf8'; // Sky blue retry tint
    renderingContext2d.fillText('PRESS [SPACE] OR [R] TO RETRY HEIST', SCREEN_WIDTH / 2, 420); // Retry prompt
  }

  function renderVictoryOverlay(extractedBountyScore, totalElapsedSeconds) {
    renderingContext2d.fillStyle = 'rgba(6, 9, 14, 0.88)'; // Dark victory backdrop
    renderingContext2d.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // Fill screen rectangle

    renderingContext2d.font = 'bold 44px sans-serif'; // Victory title typography
    renderingContext2d.fillStyle = '#4ade80'; // Emerald victory tint
    renderingContext2d.textAlign = 'center'; // Center align
    renderingContext2d.fillText('MISSION ACCOMPLISHED: GHOST OPERATIVE', SCREEN_WIDTH / 2, 240); // Draw victory headline

    renderingContext2d.font = '22px monospace'; // Bounty score typography
    renderingContext2d.fillStyle = '#fbbf24'; // Amber gold bounty tint
    renderingContext2d.fillText(`TOTAL BOUNTY EXTRACTED: ${formatBountyCurrency(extractedBountyScore)}`, SCREEN_WIDTH / 2, 300); // Draw extracted score

    renderingContext2d.font = '15px monospace'; // Debrief stats typography
    renderingContext2d.fillStyle = '#94a3b8'; // Slate stats tint
    renderingContext2d.fillText(`Operation Elapsed Time: ${formatMissionStopwatch(totalElapsedSeconds)}`, SCREEN_WIDTH / 2, 340); // Draw elapsed time
    renderingContext2d.fillText('Stealth Rating: S-TIER (Zero Alarms Escaped)', SCREEN_WIDTH / 2, 370); // Draw stealth rating

    renderingContext2d.font = 'bold 16px monospace'; // Replay prompt typography
    renderingContext2d.fillStyle = '#38bdf8'; // Sky blue replay tint
    renderingContext2d.fillText('PRESS [SPACE] OR [ENTER] TO PLAY AGAIN', SCREEN_WIDTH / 2, 450); // Draw replay prompt
  }

  function executeMasterRenderPipeline(activeWorldSimulationState, activeScreenMode, currentRecordScore = 0) {
    const elapsedSimulationTime = activeWorldSimulationState.timeElapsed || 0; // Current time
    renderGalleryFloor(elapsedSimulationTime); // Render floor tiles
    renderArchitecturalWalls(activeWorldSimulationState.walls); // Render wall geometry
    renderGetawayVanExtractionZone(activeWorldSimulationState.escapeZone); // Render extraction van
    renderSecurityKeypads(activeWorldSimulationState.terminals); // Render keypads
    renderLaserTripwires(activeWorldSimulationState.lasers, elapsedSimulationTime); // Render lasers
    renderVaultPedestalAndDiamond(activeWorldSimulationState.vault, elapsedSimulationTime); // Render vault safe
    renderSurveillanceCameras(activeWorldSimulationState.cameras, elapsedSimulationTime); // Render CCTV cameras
    renderPatrolGuards(activeWorldSimulationState.guards, elapsedSimulationTime); // Render guards
    renderOperativePlayer(activeWorldSimulationState.player, elapsedSimulationTime); // Render operative avatar

    // Render active visual particle effects
    if (activeWorldSimulationState.particles) {
      activeWorldSimulationState.particles.draw(renderingContext2d); // Draw living particles
    }

    // Render active tactical gadgets and smoke screens
    if (activeWorldSimulationState.gadgets) {
      activeWorldSimulationState.gadgets.draw(renderingContext2d); // Draw smoke clouds
    }

    renderTacticalHeistHUD(activeWorldSimulationState); // Render top HUD & alarm meter

    if (activeScreenMode === SCREEN_TITLE) {
      renderTitleBriefingOverlay(currentRecordScore); // Render title overlay
    } else if (activeScreenMode === SCREEN_OVER) {
      renderGameOverOverlay(); // Render defeat overlay
    } else if (activeScreenMode === SCREEN_VICTORY) {
      renderVictoryOverlay(activeWorldSimulationState.score, activeWorldSimulationState.timeElapsed); // Render victory overlay
    }
  }

  return {
    draw: executeMasterRenderPipeline, // Expose master draw function
  };
}
