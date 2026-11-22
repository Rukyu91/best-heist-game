// ShadowVault Tactical Infiltration Gadgets Subsystem
// Smoke grenades, EMP scramblers, and acoustic distraction devices for advanced stealth

export function createGadgetInventory() {
  const availableInventorySlots = {
    smokeGrenades: 2, // Deployable smoke screens that break guard line of sight
    empScramblers: 1, // Short-circuit pulse that temporarily disables CCTV cameras
    audioDecoys: 2, // Remote sonic emitter that lures patrolling guards to investigation
  };

  const activeDeployedSmokeClouds = []; // Active smoke cloud instances
  const activeScrambledCameras = new Map(); // Camera ID to remaining scrambled time (s)

  function deploySmokeGrenade(dropCoordinateX, dropCoordinateY) {
    if (availableInventorySlots.smokeGrenades <= 0) return false; // Out of smoke grenades
    availableInventorySlots.smokeGrenades--; // Deduct item from inventory

    activeDeployedSmokeClouds.push({
      x: dropCoordinateX, // Smoke cloud center X
      y: dropCoordinateY, // Smoke cloud center Y
      radius: 65, // Smoke cloud concealment radius
      remainingDuration: 6.0, // Active duration in seconds
      totalDuration: 6.0, // Max duration for alpha fade
    });
    return true; // Successfully deployed
  }

  function deployEmpScrambler(targetCameraInstance) {
    if (availableInventorySlots.empScramblers <= 0) return false; // Out of EMP scramblers
    availableInventorySlots.empScramblers--; // Deduct item from inventory

    activeScrambledCameras.set(targetCameraInstance.id, 5.0); // Disable camera for 5.0s
    return true; // Successfully scrambled
  }

  function checkPointConcealedBySmoke(testPositionX, testPositionY) {
    for (let index = 0; index < activeDeployedSmokeClouds.length; index++) {
      const activeCloud = activeDeployedSmokeClouds[index]; // Cloud instance
      const distanceToCloudCenter = Math.hypot(testPositionX - activeCloud.x, testPositionY - activeCloud.y);
      if (distanceToCloudCenter <= activeCloud.radius) {
        return true; // Point is obscured by thick tactical smoke
      }
    }
    return false; // Point is visible in clear line of sight
  }

  function updateGadgets(deltaSeconds) {
    // Update active smoke screens
    for (let index = activeDeployedSmokeClouds.length - 1; index >= 0; index--) {
      const activeCloud = activeDeployedSmokeClouds[index]; // Cloud instance
      activeCloud.remainingDuration -= deltaSeconds; // Decrement cloud lifetime
      if (activeCloud.remainingDuration <= 0) {
        activeDeployedSmokeClouds.splice(index, 1); // Remove dissipated smoke cloud
      }
    }

    // Update scrambled camera timers
    for (const [cameraId, remainingSeconds] of activeScrambledCameras.entries()) {
      const updatedSeconds = remainingSeconds - deltaSeconds; // Decrement scrambler
      if (updatedSeconds <= 0) {
        activeScrambledCameras.delete(cameraId); // Re-enable camera surveillance
      } else {
        activeScrambledCameras.set(cameraId, updatedSeconds); // Update timer
      }
    }
  }

  function renderTacticalGadgets(renderingContext2d) {
    if (activeDeployedSmokeClouds.length === 0) return; // Skip if no smoke active
    renderingContext2d.save(); // Save context state

    for (let index = 0; index < activeDeployedSmokeClouds.length; index++) {
      const activeCloud = activeDeployedSmokeClouds[index]; // Smoke cloud instance
      const cloudAlpha = Math.min(0.65, (activeCloud.remainingDuration / activeCloud.totalDuration) * 0.7); // Fade

      const smokeRadialGradient = renderingContext2d.createRadialGradient(activeCloud.x, activeCloud.y, 10, activeCloud.x, activeCloud.y, activeCloud.radius);
      smokeRadialGradient.addColorStop(0, `rgba(148, 163, 184, ${cloudAlpha})`); // Dense smoke center
      smokeRadialGradient.addColorStop(1, 'rgba(100, 116, 139, 0)'); // Soft edge fade

      renderingContext2d.fillStyle = smokeRadialGradient; // Apply gradient fill
      renderingContext2d.beginPath(); // Begin cloud circle
      renderingContext2d.arc(activeCloud.x, activeCloud.y, activeCloud.radius, 0, Math.PI * 2); // Cloud radius
      renderingContext2d.fill(); // Fill cloud
    }

    renderingContext2d.restore(); // Restore context state
  }

  return {
    inventory: availableInventorySlots, // Read current inventory counts
    deploySmoke: deploySmokeGrenade, // Trigger smoke screen deployment
    deployEmp: deployEmpScrambler, // Trigger EMP camera disable
    isConcealed: checkPointConcealedBySmoke, // Query concealment at position
    isCameraScrambled: (camId) => activeScrambledCameras.has(camId), // Check camera EMP status
    update: updateGadgets, // Advance gadget timers
    draw: renderTacticalGadgets, // Render visual smoke clouds
  };
}
