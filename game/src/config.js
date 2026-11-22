// Configuration for ShadowVault Heist simulation and rendering
export const SCREEN_WIDTH = 1280;
export const SCREEN_HEIGHT = 720;
export const STEP = 1 / 60;

export const PLAYER_CONFIG = {
  radius: 12,
  walkSpeed: 160,
  sneakSpeed: 90,
  sprintSpeed: 230,
  sneakNoiseRadius: 40,
  walkNoiseRadius: 110,
  sprintNoiseRadius: 240,
  color: '#00e5ff',
  accentColor: '#38bdf8',
};

export const GUARD_CONFIG = {
  radius: 14,
  patrolSpeed: 70,
  searchSpeed: 100,
  pursuitSpeed: 175,
  fov: 65 * (Math.PI / 180), // 65-degree cone
  viewDistance: 220,
  hearingDistance: 130,
  patrolColor: 'rgba(250, 204, 21, 0.22)',
  patrolStroke: '#facc15',
  suspiciousColor: 'rgba(251, 146, 60, 0.35)',
  suspiciousStroke: '#fb923c',
  alarmColor: 'rgba(239, 68, 68, 0.45)',
  alarmStroke: '#ef4444',
};

export const CAMERA_CONFIG = {
  fov: 52 * (Math.PI / 180),
  viewDistance: 240,
  sweepSpeed: 0.55, // radians per sec
  normalColor: 'rgba(56, 189, 248, 0.18)',
  normalStroke: '#38bdf8',
  alertColor: 'rgba(239, 68, 68, 0.45)',
  alertStroke: '#ef4444',
};

export const ALARM_CONFIG = {
  max: 100,
  guardDetectionRate: 45, // per second when in direct vision
  cameraDetectionRate: 55,
  laserDetectionRate: 90,
  decayRate: 8, // cooldown per second when out of sight
  suspiciousThreshold: 25,
  alertThreshold: 70,
};

export const LOOT_CONFIG = {
  name: 'Heart of Nyx (Obsidian Core)',
  value: 2500000,
  hackDuration: 3.0, // seconds to hack safe/vault
};

export const BEST_SCORE_KEY = 'shadowvault_best_record_v1';
export const VERSION = '1.0.0';

