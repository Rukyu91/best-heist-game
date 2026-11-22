// ShadowVault: Heist Simulation & Rendering Configuration Parameters
export const SCREEN_WIDTH = 1280; // Standard 16:9 canvas viewport horizontal resolution
export const SCREEN_HEIGHT = 720; // Standard 16:9 canvas viewport vertical resolution
export const STEP = 1 / 60; // Physics simulation tick delta interval (60 FPS)

// Player operative physical movement profiles & audio radii
export const PLAYER_CONFIG = {
  radius: 12, // Operative collision body circle radius
  walkSpeed: 160, // Standard infiltration walking movement speed (px/s)
  sneakSpeed: 90, // Silent sneaking movement speed (px/s)
  sprintSpeed: 230, // Rapid sprint evasion movement speed (px/s)
  sneakNoiseRadius: 40, // Acoustic footprint range while sneaking (px)
  walkNoiseRadius: 110, // Acoustic footprint range while normal walking (px)
  sprintNoiseRadius: 240, // Acoustic footprint range while sprinting (px)
  color: '#00e5ff', // Neon cyan primary avatar tone
  accentColor: '#38bdf8', // Light sky blue accent highlight
};

// Facility security guards AI parameters & vision cones
export const GUARD_CONFIG = {
  radius: 14, // Security guard physical collision radius
  patrolSpeed: 70, // Standard patrol waypoint movement velocity
  searchSpeed: 100, // Elevated investigation movement velocity
  pursuitSpeed: 175, // Emergency alert apprehension chase velocity
  fov: 65 * (Math.PI / 180), // Angular field of vision cone (65 degrees in radians)
  viewDistance: 220, // Maximum visual line-of-sight perception range
  hearingDistance: 130, // Maximum auditory acoustic perception threshold
  patrolColor: 'rgba(250, 204, 21, 0.22)', // Guard patrol cone fill tint
  patrolStroke: '#facc15', // Guard patrol cone perimeter line
  suspiciousColor: 'rgba(251, 146, 60, 0.35)', // Guard suspicious cone fill tint
  suspiciousStroke: '#fb923c', // Guard suspicious cone perimeter line
  alarmColor: 'rgba(239, 68, 68, 0.45)', // Guard full alert chase fill tint
  alarmStroke: '#ef4444', // Guard full alert chase perimeter line
};

// Wall-mounted sweeping surveillance cameras
export const CAMERA_CONFIG = {
  fov: 52 * (Math.PI / 180), // Surveillance lens field of view (52 degrees)
  viewDistance: 240, // Surveillance camera raycast sight distance
  sweepSpeed: 0.55, // Oscillating sweep rotation angular rate (rad/s)
  normalColor: 'rgba(56, 189, 248, 0.18)', // Passive CCTV sweep cone fill tint
  normalStroke: '#38bdf8', // Passive CCTV sweep cone outline
  alertColor: 'rgba(239, 68, 68, 0.45)', // Detected intrusion CCTV cone fill
  alertStroke: '#ef4444', // Detected intrusion CCTV cone outline
};

// Facility security alarm meter dynamics and detection thresholds
export const ALARM_CONFIG = {
  max: 100, // Maximum alarm gauge capacity limit
  guardDetectionRate: 45, // Alarm gauge fill per second in guard direct vision
  cameraDetectionRate: 55, // Alarm gauge fill per second under active CCTV sweep
  laserDetectionRate: 90, // Alarm gauge fill per second when breaching laser beam
  decayRate: 8, // Alarm gauge dissipation rate per second in safe shadows
  suspiciousThreshold: 25, // Gauge level triggering caution alerts
  alertThreshold: 70, // Gauge level triggering facility lockdown
};

// Central vault diamond objective
export const LOOT_CONFIG = {
  name: 'Heart of Nyx (Obsidian Core)', // Target relic item designation
  value: 2500000, // Extracted bounty monetary value ($2.5M)
  hackDuration: 3.0, // Cumulative seconds needed to crack the safe
};

export const BEST_SCORE_KEY = 'shadowvault_best_record_v1'; // LocalStorage key
export const VERSION = '1.0.0'; // Game release build version
