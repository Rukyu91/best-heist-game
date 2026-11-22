// ShadowVault Acoustic & Spatial Stealth Raycasting Intelligence
// Models acoustic sound wave falloff through concrete walls and peripheral vision

export function createTacticsModel(architecturalWallsArray) {
  function computeAcousticOcclusionFactor(sourceCoordX, sourceCoordY, listenerCoordX, listenerCoordY) {
    let interceptedWallCount = 0; // Counter for intersecting concrete walls
    const soundOriginPoint = { x: sourceCoordX, y: sourceCoordY }; // Noise source
    const soundListenerPoint = { x: listenerCoordX, y: listenerCoordY }; // Guard ears

    for (let wallIndex = 0; wallIndex < architecturalWallsArray.length; wallIndex++) {
      const obstacleWall = architecturalWallsArray[wallIndex]; // Wall segment
      const denominator = (soundListenerPoint.y - soundOriginPoint.y) * (obstacleWall.x2 - obstacleWall.x1) - (soundListenerPoint.x - soundOriginPoint.x) * (obstacleWall.y2 - obstacleWall.y1);
      if (Math.abs(denominator) > 1e-9) {
        const ua = ((soundListenerPoint.x - soundOriginPoint.x) * (obstacleWall.y1 - soundOriginPoint.y) - (soundListenerPoint.y - soundOriginPoint.y) * (obstacleWall.x1 - soundOriginPoint.x)) / denominator;
        const ub = ((obstacleWall.x2 - obstacleWall.x1) * (obstacleWall.y1 - soundOriginPoint.y) - (obstacleWall.y2 - obstacleWall.y1) * (obstacleWall.x1 - soundOriginPoint.x)) / denominator;
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
          interceptedWallCount++; // Wall dampens acoustic sound wave
        }
      }
    }

    // Each solid wall dampens acoustic volume propagation by 60%
    return Math.pow(0.4, interceptedWallCount);
  }

  function computeGuardVisionGradient(guardOriginX, guardOriginY, guardHeadingAngle, guardFieldOfView, targetX, targetY) {
    const deltaHorizontal = targetX - guardOriginX; // X offset
    const deltaVertical = targetY - guardOriginY; // Y offset
    const directDistance = Math.hypot(deltaHorizontal, deltaVertical); // Distance

    const angleTowardsTarget = Math.atan2(deltaVertical, deltaHorizontal); // Direction angle
    let angularDifference = Math.abs(angleTowardsTarget - guardHeadingAngle); // Angle error
    while (angularDifference > Math.PI) angularDifference -= Math.PI * 2; // Normalize wrapping
    angularDifference = Math.abs(angularDifference); // Absolute error

    if (angularDifference > guardFieldOfView / 2) {
      return 0.0; // Outside vision cone
    }

    // Vision intensity scales higher at central focus vs peripheral cone edges
    const angularCenterFactor = 1.0 - (angularDifference / (guardFieldOfView / 2)) * 0.5; // Central focus
    const distanceFalloffFactor = Math.max(0.2, 1.0 - (directDistance / 240) * 0.8); // Distance falloff

    return Math.min(1.0, angularCenterFactor * distanceFalloffFactor); // Composite vision alertness
  }

  return {
    getAcousticOcclusion: computeAcousticOcclusionFactor, // Acoustic wall damping calculator
    getVisionGradient: computeGuardVisionGradient, // Guard vision focus gradient calculator
  };
}
