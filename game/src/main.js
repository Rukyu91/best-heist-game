// ShadowVault: Tactical Stealth Heist Infiltration Main Game Loop
import { BEST_SCORE_KEY, STEP } from './config.js'; // Simulation timestep and score key
import { createInput, ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART } from './input.js'; // Input system
import { createAudio } from './audio.js'; // Synthesized Web Audio API sound effects
import {
  createWorld, // Simulation world constructor
  EVENT_ALARM_SPIKE, // High alert siren event
  EVENT_CAUGHT, // Operative captured event
  EVENT_HACK_TICK, // Hacking progress cycle event
  EVENT_LOOT_GRABBED, // Vault diamond secured event
  EVENT_SUSPICIOUS, // Caution investigation event
  EVENT_VICTORY, // Successful exfiltration event
} from './world.js';
import {
  createRenderer, // Canvas 2D rendering pipeline
  SCREEN_OVER, // Game over screen identifier
  SCREEN_PAUSED, // Paused menu screen identifier
  SCREEN_PLAY, // Active infiltration screen identifier
  SCREEN_TITLE, // Title briefing screen identifier
  SCREEN_VICTORY, // Victory results screen identifier
} from './render.js';
import { stageShot } from './shots.js'; // Evaluation screenshot staging helper

// Query parameters for automated screenshot captures and seed reproducibility
const queryParams = new URLSearchParams(window.location.search); // Read URL query parameters
const requestedShotName = queryParams.get('shot'); // Optional screenshot shot name
const parsedSeedValue = Number.parseInt(queryParams.get('seed') ?? '', 10); // Optional PRNG seed
const activeWorldSeed = Number.isInteger(parsedSeedValue) ? parsedSeedValue : Math.floor(Math.random() * 4294967296); // Compute seed

const gameCanvasElement = document.getElementById('game'); // Main display canvas element
const liveStatusElement = document.getElementById('status'); // Screen reader status container
const simulationWorld = createWorld(activeWorldSeed); // Initialize world simulation instance
const activeRenderer = createRenderer(gameCanvasElement); // Initialize rendering pipeline instance
const proceduralAudio = createAudio(); // Initialize procedural audio synthesis instance

function loadPersistedBestScore() {
  try {
    const rawSavedScore = window.localStorage.getItem(BEST_SCORE_KEY); // Retrieve persisted score
    return Number.parseInt(rawSavedScore ?? '0', 10) || 0; // Parse as integer
  } catch {
    return 0; // Return zero fallback on storage errors
  }
}

function persistBestScore(newBestScore) {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(newBestScore)); // Store updated high score
  } catch {}
}

// Stage and render deterministic screenshots for make.fun evaluation shots
function renderDeterministicShot(shotIdentifier) {
  const stagedShotScene = stageShot(shotIdentifier, simulationWorld); // Configure world state for shot
  activeRenderer.draw(simulationWorld.state, stagedShotScene.screen, stagedShotScene.best); // Render frame
  window.__shotReady = true; // Signal completion to evaluator capture tool
}

// Run the real-time interactive game loop with responsive controls
function runInteractiveSimulation() {
  const operativeInput = createInput(gameCanvasElement); // Bind input listeners to canvas
  let currentActiveScreen = SCREEN_TITLE; // Initial menu screen state
  let highestRecordScore = loadPersistedBestScore(); // Load best record
  let footstepAcousticTimer = 0; // Timer tracking footstep sound intervals
  let previousFrameTime = performance.now(); // High-resolution frame timestamp

  function publishStatusAnnouncement(statusMessage) {
    if (liveStatusElement) liveStatusElement.textContent = statusMessage; // Update live text
  }

  function launchInfiltrationOperation() {
    proceduralAudio.init(); // Initialize audio context on player gesture
    simulationWorld.reset(); // Reset simulation state and entities
    currentActiveScreen = SCREEN_PLAY; // Transition to active gameplay screen
    publishStatusAnnouncement('Operation commenced. Infiltrate central vault.'); // Announce start
  }

  function processPendingActions() {
    const pendingInputActions = operativeInput.takeActions(); // Retrieve bitmask of triggered actions

    if (pendingInputActions & ACTION_CONFIRM) {
      if (currentActiveScreen === SCREEN_TITLE || currentActiveScreen === SCREEN_OVER || currentActiveScreen === SCREEN_VICTORY) {
        launchInfiltrationOperation(); // Start or restart operation
      }
    }
    if (pendingInputActions & ACTION_PAUSE && currentActiveScreen === SCREEN_PLAY) {
      currentActiveScreen = SCREEN_PAUSED; // Enter pause mode
      publishStatusAnnouncement('Simulation paused.'); // Announce pause
    } else if (pendingInputActions & (ACTION_PAUSE | ACTION_CONFIRM) && currentActiveScreen === SCREEN_PAUSED) {
      currentActiveScreen = SCREEN_PLAY; // Resume gameplay
      publishStatusAnnouncement('Simulation resumed.'); // Announce resume
    }
    if (pendingInputActions & ACTION_MUTE) {
      const audioIsNowMuted = proceduralAudio.toggleMute(); // Toggle audio mute
      publishStatusAnnouncement(audioIsNowMuted ? 'Audio muted.' : 'Audio unmuted.'); // Announce mute
    }
    if (pendingInputActions & ACTION_RESTART) {
      launchInfiltrationOperation(); // Immediate restart trigger
    }
  }

  function executeSimulationLoop(currentTimestamp) {
    const frameDeltaSeconds = Math.min(0.1, (currentTimestamp - previousFrameTime) / 1000); // Delta time
    previousFrameTime = currentTimestamp; // Advance frame time anchor

    processPendingActions(); // Dispatch pending player inputs

    if (currentActiveScreen === SCREEN_PLAY) {
      const operativeMovement = operativeInput.getMovement(); // Read movement vector & sneak flag
      const occurredSimEvents = simulationWorld.step(STEP, operativeMovement); // Step simulation physics

      // Footstep sound synthesis synchronized with sneak/walk velocity
      if (operativeMovement.dx !== 0 || operativeMovement.dy !== 0) {
        footstepAcousticTimer += frameDeltaSeconds; // Accumulate movement time
        const requiredStepInterval = operativeMovement.isSneaking ? 0.45 : 0.28; // Sneak vs walk tempo
        if (footstepAcousticTimer >= requiredStepInterval) {
          proceduralAudio.playFootstep(operativeMovement.isSneaking); // Play synthesized footstep
          footstepAcousticTimer = 0; // Reset acoustic timer
        }
      } else {
        footstepAcousticTimer = 0; // Clear timer when motionless
      }

      // Handle dispatched world simulation events
      if (occurredSimEvents & EVENT_SUSPICIOUS) {
        proceduralAudio.playSuspiciousPing(); // Play caution warning ping
      }
      if (occurredSimEvents & EVENT_ALARM_SPIKE) {
        proceduralAudio.playAlarmAlert(); // Play facility alarm alert
      }
      if (occurredSimEvents & EVENT_HACK_TICK) {
        proceduralAudio.playHackTick(); // Play keypad hacking tick
      }
      if (occurredSimEvents & EVENT_LOOT_GRABBED) {
        proceduralAudio.playLootCollected(); // Play vault diamond acquired fanfare
        publishStatusAnnouncement('Loot secured! Reach the getaway van.'); // Announce loot grab
      }
      if (occurredSimEvents & EVENT_VICTORY) {
        currentActiveScreen = SCREEN_VICTORY; // Transition to victory screen
        proceduralAudio.playEscapeSuccess(); // Play successful escape arpeggio
        if (simulationWorld.state.score > highestRecordScore) {
          highestRecordScore = simulationWorld.state.score; // Update high score
          persistBestScore(highestRecordScore); // Save record
        }
        publishStatusAnnouncement(`Heist Complete! Extracted: $${simulationWorld.state.score}`); // Victory
      }
      if (occurredSimEvents & EVENT_CAUGHT) {
        currentActiveScreen = SCREEN_OVER; // Transition to failure screen
        publishStatusAnnouncement('Heist Failed: Operative intercepted.'); // Announce apprehension
      }
    }

    activeRenderer.draw(simulationWorld.state, currentActiveScreen, highestRecordScore); // Render frame
    requestAnimationFrame(executeSimulationLoop); // Request next animation frame
  }

  requestAnimationFrame(executeSimulationLoop); // Start frame loop
}

if (requestedShotName) {
  renderDeterministicShot(requestedShotName); // Screenshot render path
} else {
  runInteractiveSimulation(); // Interactive play path
}
