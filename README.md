# ShadowVault

[![make.fun](https://make.fun/b/best-heist-game-20261122-0559/badge.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Prize](https://make.fun/b/best-heist-game-20261122-0559/prize.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Deadline](https://make.fun/b/best-heist-game-20261122-0559/deadline.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

Tactical top-down stealth heist game entered in [make.fun](https://make.fun) bounty [best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559).

## Overview
Infiltrate the high-security gallery, navigate past patrolling guards and sweeping security cameras, disable laser barriers, bypass the vault security to retrieve the target core, and exfiltrate safely.

## Features
- Smooth top-down thief controls (WASD / Arrow keys + Sprint / Sneak).
- Dynamic AI guards with raycasted vision cones and state progression (Patrol, Suspicious, Alarm).
- Wall-mounted rotating surveillance cameras.
- Cycling security laser grids and hackable terminals.
- Vault chamber with the primary loot objective.
- Responsive HUD with real-time Alarm Meter and minimap.
- Fully synthesized procedural sound effects via Web Audio API with zero external network requests.
- Pure client-side HTML5 canvas offline rendering.

## Controls
- **Move**: WASD or Arrow Keys
- **Sneak**: Shift (toggles slow silent sneak)
- **Interact / Hack**: Space or E near terminals, consoles, or the vault
- **Mute Audio**: M
- **Restart**: R

## Running Locally
```bash
node serve.ts
```
Then visit `http://localhost:8080`.
