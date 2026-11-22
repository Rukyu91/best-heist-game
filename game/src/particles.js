// ShadowVault High-Fidelity Particle FX Engine
// Procedural visual particle effects for laser sparks, terminal hack glints, and diamond shimmers

export function createParticleSystem() {
  const activeParticlePool = []; // Pool of living visual particle instances
  const MAX_CONCURRENT_PARTICLES = 300; // Hard limit on active particle count

  function spawnParticle(originX, originY, velocityX, velocityY, initialSize, decayRate, colorTone, blendMode = 'source-over') {
    if (activeParticlePool.length >= MAX_CONCURRENT_PARTICLES) {
      activeParticlePool.shift(); // Evict oldest particle when pool capacity reached
    }
    activeParticlePool.push({
      x: originX, // Current horizontal coordinate
      y: originY, // Current vertical coordinate
      vx: velocityX, // Horizontal velocity (px/s)
      vy: velocityY, // Vertical velocity (px/s)
      size: initialSize, // Initial particle diameter (px)
      alpha: 1.0, // Initial opacity [0, 1]
      decay: decayRate, // Opacity dissipation rate per second
      color: colorTone, // CSS fill color
      blend: blendMode, // Canvas composite blend mode
    });
  }

  function emitLaserSparks(sparkOriginX, sparkOriginY, sparkCount = 8) {
    for (let index = 0; index < sparkCount; index++) {
      const sparkAngle = Math.random() * Math.PI * 2; // Random omnidirectional angle
      const sparkSpeed = 30 + Math.random() * 80; // Burst velocity
      const sparkDecay = 2.5 + Math.random() * 2.0; // Quick spark lifetime
      const sparkColor = Math.random() > 0.3 ? '#ef4444' : '#fbbf24'; // Red or gold spark
      spawnParticle(
        sparkOriginX + (Math.random() - 0.5) * 8, // Jitter X
        sparkOriginY + (Math.random() - 0.5) * 8, // Jitter Y
        Math.cos(sparkAngle) * sparkSpeed, // Velocity X
        Math.sin(sparkAngle) * sparkSpeed, // Velocity Y
        2.5 + Math.random() * 2.0, // Particle radius
        sparkDecay, // Decay rate
        sparkColor, // Color
        'lighter' // Additive glow
      );
    }
  }

  function emitTerminalHackGlints(consoleOriginX, consoleOriginY, glintCount = 5) {
    for (let index = 0; index < glintCount; index++) {
      const glintAngle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5; // Upward spray
      const glintSpeed = 20 + Math.random() * 60; // Upward velocity
      const glintDecay = 1.8 + Math.random() * 1.5; // Life duration
      const glintColor = Math.random() > 0.5 ? '#10b981' : '#34d399'; // Emerald matrix green
      spawnParticle(
        consoleOriginX + (Math.random() - 0.5) * 12, // Offset X
        consoleOriginY - 5, // Top of keypad
        Math.cos(glintAngle) * glintSpeed, // Velocity X
        Math.sin(glintAngle) * glintSpeed, // Velocity Y
        2.0 + Math.random() * 1.5, // Size
        glintDecay, // Decay
        glintColor, // Matrix green
        'lighter' // Glow
      );
    }
  }

  function emitDiamondShimmer(pedestalCenterX, pedestalCenterY) {
    const glintOrbitAngle = Math.random() * Math.PI * 2; // Random orbit angle
    const glintOrbitRadius = 15 + Math.random() * 25; // Orbit radius around crystal
    const glintSpawnX = pedestalCenterX + Math.cos(glintOrbitAngle) * glintOrbitRadius; // Position X
    const glintSpawnY = pedestalCenterY + Math.sin(glintOrbitAngle) * glintOrbitRadius; // Position Y
    spawnParticle(
      glintSpawnX, // Spawn X
      glintSpawnY, // Spawn Y
      (Math.random() - 0.5) * 15, // Drift X
      -10 - Math.random() * 20, // Gentle upward float
      2.0 + Math.random() * 2.5, // Crystal glint size
      1.5 + Math.random() * 1.0, // Decay
      '#a5f3fc', // Shimmering pale cyan
      'lighter' // Additive blend
    );
  }

  function emitVaultBreachConfetti(vaultX, vaultY, burstQuantity = 24) {
    for (let index = 0; index < burstQuantity; index++) {
      const confettiAngle = Math.random() * Math.PI * 2; // Burst angle
      const confettiSpeed = 50 + Math.random() * 140; // High speed ejection
      const confettiColorPalette = ['#00e5ff', '#38bdf8', '#fbbf24', '#f59e0b', '#34d399']; // Celebration tones
      const selectedColor = confettiColorPalette[Math.floor(Math.random() * confettiColorPalette.length)]; // Random pick
      spawnParticle(
        vaultX, // Center X
        vaultY, // Center Y
        Math.cos(confettiAngle) * confettiSpeed, // Burst X
        Math.sin(confettiAngle) * confettiSpeed, // Burst Y
        3.0 + Math.random() * 3.0, // Size
        1.2 + Math.random() * 0.8, // Float lifetime
        selectedColor, // Palette color
        'lighter' // Additive
      );
    }
  }

  function emitFootstepDustPuff(footstepX, footstepY, isSneakingState) {
    const dustCount = isSneakingState ? 2 : 5; // Sneak produces minimal dust
    for (let index = 0; index < dustCount; index++) {
      const dustDriftAngle = Math.random() * Math.PI * 2; // Radial drift
      const dustVelocity = 5 + Math.random() * (isSneakingState ? 12 : 25); // Velocity
      spawnParticle(
        footstepX + (Math.random() - 0.5) * 6, // Anchor X
        footstepY + (Math.random() - 0.5) * 6, // Anchor Y
        Math.cos(dustDriftAngle) * dustVelocity, // Velocity X
        Math.sin(dustDriftAngle) * dustVelocity, // Velocity Y
        2.0 + Math.random() * 2.0, // Dust speck radius
        2.0 + Math.random() * 1.5, // Quick fade
        'rgba(148, 163, 184, 0.4)' // Faint slate dust
      );
    }
  }

  function updateParticlePhysics(deltaSeconds) {
    for (let particleIndex = activeParticlePool.length - 1; particleIndex >= 0; particleIndex--) {
      const particleUnit = activeParticlePool[particleIndex]; // Active particle
      particleUnit.x += particleUnit.vx * deltaSeconds; // Update horizontal position
      particleUnit.y += particleUnit.vy * deltaSeconds; // Update vertical position
      particleUnit.alpha -= particleUnit.decay * deltaSeconds; // Dissipate opacity
      particleUnit.size = Math.max(0.5, particleUnit.size - deltaSeconds * 0.5); // Shrink slightly

      if (particleUnit.alpha <= 0) {
        activeParticlePool.splice(particleIndex, 1); // Remove expired particle
      }
    }
  }

  function renderAllParticles(renderingContext2d) {
    if (activeParticlePool.length === 0) return; // Early exit if pool is empty
    renderingContext2d.save(); // Save canvas context state

    for (let particleIndex = 0; particleIndex < activeParticlePool.length; particleIndex++) {
      const particleUnit = activeParticlePool[particleIndex]; // Target particle
      renderingContext2d.globalCompositeOperation = particleUnit.blend; // Apply blend mode
      renderingContext2d.globalAlpha = Math.max(0, Math.min(1, particleUnit.alpha)); // Apply opacity
      renderingContext2d.fillStyle = particleUnit.color; // Set particle color
      renderingContext2d.beginPath(); // Begin particle circle
      renderingContext2d.arc(particleUnit.x, particleUnit.y, particleUnit.size, 0, Math.PI * 2); // Draw circle
      renderingContext2d.fill(); // Fill particle
    }

    renderingContext2d.restore(); // Restore canvas context state
  }

  function clearAllParticles() {
    activeParticlePool.length = 0; // Empty the particle pool array
  }

  return {
    emitLaserSparks, // Laser electrical sparks trigger
    emitTerminalHackGlints, // Keypad matrix glints trigger
    emitDiamondShimmer, // Ambient diamond crystal shimmer trigger
    emitVaultBreachConfetti, // Safe breach burst celebration trigger
    emitFootstepDustPuff, // Footstep dust ripple trigger
    update: updateParticlePhysics, // Advance physics simulation
    draw: renderAllParticles, // Draw active particles to canvas
    clear: clearAllParticles, // Clear particle pool
  };
}
