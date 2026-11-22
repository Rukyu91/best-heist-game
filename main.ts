// ShadowVault Tactical Stealth Infiltration System - Entry Point
// make.fun evaluation entrypoint and dossier compilation

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'; // Node filesystem methods
import { join } from 'node:path'; // Path joining utility
import { fileURLToPath } from 'node:url'; // URL to local file path
import { buildDossier } from './vendor/makefun-game.ts'; // Evaluator dossier builder

const currentDir = fileURLToPath(new URL('.', import.meta.url)); // Current module directory
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output'; // Output destination path

// Ensure output directories exist for game bundle and screenshots
mkdirSync(outputDir, { recursive: true }); // Create base output folder
cpSync(join(currentDir, 'game'), join(outputDir, 'game'), { recursive: true }); // Copy game sources
mkdirSync(join(outputDir, 'screenshots'), { recursive: true }); // Create screenshots folder

if (existsSync(join(currentDir, 'screenshots'))) {
  cpSync(join(currentDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true }); // Copy pre-generated shots
}

// Build and serialize evaluation dossier for automated verification
const compiledDossierJson = buildDossier(outputDir, {
  text_max_bytes: 163840, // Max summary text bytes allowed
  screenshots: { max: 4, max_bytes: 262144 }, // Up to 4 screenshot captures
  game_max_files: 993, // Max total file count in bundle
  game_max_bytes: 50331648, // Max total package size in bytes
  game_path_max_bytes: 1000, // Max individual relative file path length
});

// Save compiled dossier to disk
writeFileSync(join(outputDir, 'dossier.json'), compiledDossierJson); // Write dossier json file
console.log('ShadowVault dossier successfully generated at target path:', outputDir); // Log completion
