// Boot and game loop for ShadowVault Heist
import { BEST_SCORE_KEY, STEP } from './config.js';
import { createInput, ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART } from './input.js';
import { createAudio } from './audio.js';
import {
  createWorld,
  EVENT_ALARM_SPIKE,
  EVENT_CAUGHT,
  EVENT_HACK_TICK,
  EVENT_LOOT_GRABBED,
  EVENT_SUSPICIOUS,
  EVENT_VICTORY,
} from './world.js';
import {
  createRenderer,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_VICTORY,
} from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(val) {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(val));
  } catch {}
}

function runShot(name) {
  const scene = stageShot(name, world);
  renderer.draw(world.state, scene.screen, scene.best);
  window.__shotReady = true;
}


function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let footstepTimer = 0;
  let lastTime = performance.now();

  function announce(msg) {
    if (status) status.textContent = msg;
  }

  function startGame() {
    audio.init();
    world.reset();
    screen = SCREEN_PLAY;
    announce('Operation started. Infiltrate vault.');
  }

  function handleActions() {
    const actions = input.takeActions();

    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
        startGame();
      }
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Resumed.');
    }
    if (actions & ACTION_MUTE) {
      const isMuted = audio.toggleMute();
      announce(isMuted ? 'Muted.' : 'Unmuted.');
    }
    if (actions & ACTION_RESTART) {
      startGame();
    }
  }

  function loop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    handleActions();

    if (screen === SCREEN_PLAY) {
      const movement = input.getMovement();
      const events = world.step(STEP, movement);

      // Audio cues
      if (movement.dx !== 0 || movement.dy !== 0) {
        footstepTimer += dt;
        const interval = movement.isSneaking ? 0.45 : 0.28;
        if (footstepTimer >= interval) {
          audio.playFootstep(movement.isSneaking);
          footstepTimer = 0;
        }
      } else {
        footstepTimer = 0;
      }

      if (events & EVENT_SUSPICIOUS) {
        audio.playSuspiciousPing();
      }
      if (events & EVENT_ALARM_SPIKE) {
        audio.playAlarmAlert();
      }
      if (events & EVENT_HACK_TICK) {
        audio.playHackTick();
      }
      if (events & EVENT_LOOT_GRABBED) {
        audio.playLootCollected();
        announce('Loot collected! Reach extraction vehicle.');
      }
      if (events & EVENT_VICTORY) {
        screen = SCREEN_VICTORY;
        audio.playEscapeSuccess();
        if (world.state.score > best) {
          best = world.state.score;
          saveBest(best);
        }
        announce(`Heist Successful! Bounty extracted: $${world.state.score}`);
      }
      if (events & EVENT_CAUGHT) {
        screen = SCREEN_OVER;
        announce('Heist Failed: Apprehended by security.');
      }
    }

    renderer.draw(world.state, screen, best);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

if (shot) {
  runShot(shot);
} else {
  runGame();
}
