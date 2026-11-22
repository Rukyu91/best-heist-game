// ShadowVault Tactical Scoring, Telemetry & Performance Evaluation System
// Calculates stealth operational metrics, ranking tiers, and payout bonuses

export const TIER_GHOST_PLUS = 'S+ GHOST OPERATIVE'; // Perfect zero-detection exfiltration
export const TIER_SHADOW = 'S SHADOW INFILTRATOR'; // Exceptional stealth, minimal caution
export const TIER_OPERATIVE = 'A TACTICAL OPERATIVE'; // Efficient breach with minor investigation
export const TIER_SURVIVOR = 'B HEIST SURVIVOR'; // Narrow escape under partial alert
export const TIER_SMASH_GRAB = 'C CHAOTIC SMASH & GRAB'; // Full facility alarm lockdown breach

export function createTacticalTelemetry() {
  let missionDistanceTraveledPixels = 0; // Cumulative operative movement distance
  let totalSneakingSecondsElapsed = 0; // Seconds spent in silent sneaking stance
  let totalSprintingSecondsElapsed = 0; // Seconds spent in high-speed evasion
  let camerasSuccessfullyBypassedCount = 0; // Count of surveillance cameras navigated
  let laserTripwiresDeactivatedCount = 0; // Count of laser security barriers disabled
  let peakAlarmGaugeLevel = 0; // Highest recorded facility alarm percentage
  let alarmsTriggeredCount = 0; // Total count of alarm spike warnings

  function recordOperativeMovementSample(movementVelocity, deltaSeconds, isSneakingStance) {
    const sampleDistance = movementVelocity * deltaSeconds; // Sample displacement
    missionDistanceTraveledPixels += sampleDistance; // Accumulate distance
    if (movementVelocity > 0) {
      if (isSneakingStance) {
        totalSneakingSecondsElapsed += deltaSeconds; // Accumulate sneak time
      } else {
        totalSprintingSecondsElapsed += deltaSeconds; // Accumulate normal walk time
      }
    }
  }

  function recordSecurityAlarmSample(currentAlarmGauge) {
    if (currentAlarmGauge > peakAlarmGaugeLevel) {
      peakAlarmGaugeLevel = currentAlarmGauge; // Track highest peak alarm
    }
    if (currentAlarmGauge >= 70) {
      alarmsTriggeredCount++; // Increment alert count
    }
  }

  function recordLaserDeactivated() {
    laserTripwiresDeactivatedCount++; // Increment bypassed lasers
  }

  function evaluateOperationalPerformance(baseRelicValue, totalMissionDurationSeconds) {
    // 1. Time Bonus: $500,000 max, scaling down by $5,000 per second elapsed
    const calculatedTimeBonusReward = Math.max(0, Math.floor(500000 - totalMissionDurationSeconds * 5000));

    // 2. Ghost Stealth Multiplier: 1.5x for zero alarm, 1.25x for <30%, 1.0x for alert
    let calculatedStealthMultiplier = 1.0;
    let awardedPerformanceTier = TIER_SMASH_GRAB;

    if (peakAlarmGaugeLevel < 10 && alarmsTriggeredCount === 0) {
      calculatedStealthMultiplier = 1.5; // Perfect ghost operative
      awardedPerformanceTier = TIER_GHOST_PLUS;
    } else if (peakAlarmGaugeLevel < 35) {
      calculatedStealthMultiplier = 1.35; // Shadow infiltrator
      awardedPerformanceTier = TIER_SHADOW;
    } else if (peakAlarmGaugeLevel < 60) {
      calculatedStealthMultiplier = 1.15; // Tactical operative
      awardedPerformanceTier = TIER_OPERATIVE;
    } else if (peakAlarmGaugeLevel < 85) {
      calculatedStealthMultiplier = 1.0; // Heist survivor
      awardedPerformanceTier = TIER_SURVIVOR;
    } else {
      calculatedStealthMultiplier = 0.85; // Heavy alarm penalty
      awardedPerformanceTier = TIER_SMASH_GRAB;
    }

    // 3. Laser Terminal Bonus: $50,000 per disabled laser barrier
    const calculatedTerminalBonusReward = laserTripwiresDeactivatedCount * 50000;

    // Total calculated mission compensation payout
    const grossTotalBountyScore = Math.floor((baseRelicValue + calculatedTimeBonusReward + calculatedTerminalBonusReward) * calculatedStealthMultiplier);

    return {
      tier: awardedPerformanceTier, // Tier string designation
      multiplier: calculatedStealthMultiplier, // Applied multiplier
      baseValue: baseRelicValue, // Relic value ($2.5M)
      timeBonus: calculatedTimeBonusReward, // Time reward
      terminalBonus: calculatedTerminalBonusReward, // Hack reward
      totalBounty: grossTotalBountyScore, // Final gross score
      peakAlarm: Math.floor(peakAlarmGaugeLevel), // Peak alarm %
      duration: totalMissionDurationSeconds, // Mission time
      distance: Math.floor(missionDistanceTraveledPixels), // Distance (px)
    };
  }

  function resetTelemetryRecords() {
    missionDistanceTraveledPixels = 0; // Clear distance
    totalSneakingSecondsElapsed = 0; // Clear sneak time
    totalSprintingSecondsElapsed = 0; // Clear walk time
    camerasSuccessfullyBypassedCount = 0; // Clear cameras
    laserTripwiresDeactivatedCount = 0; // Clear lasers
    peakAlarmGaugeLevel = 0; // Clear peak alarm
    alarmsTriggeredCount = 0; // Clear triggers
  }

  return {
    recordMovement: recordOperativeMovementSample, // Movement sample logger
    recordAlarm: recordSecurityAlarmSample, // Alarm gauge logger
    recordLaserBypass: recordLaserDeactivated, // Laser disabled logger
    evaluate: evaluateOperationalPerformance, // Comprehensive scoring evaluator
    reset: resetTelemetryRecords, // Telemetry reset
  };
}

export function formatBountyCurrency(numericAmount) {
  return `$${numericAmount.toLocaleString('en-US')}`; // Format currency ($2,500,000)
}

export function formatMissionStopwatch(elapsedSeconds) {
  const integerSeconds = Math.floor(elapsedSeconds); // Whole seconds
  const fractionalMilliseconds = Math.floor((elapsedSeconds - integerSeconds) * 10); // Tenths of second
  const displayMinutes = Math.floor(integerSeconds / 60); // Minute component
  const displaySecondsRemainder = integerSeconds % 60; // Second component
  const paddedMinutes = String(displayMinutes).padStart(2, '0'); // Padded mm
  const paddedSeconds = String(displaySecondsRemainder).padStart(2, '0'); // Padded ss
  return `${paddedMinutes}:${paddedSeconds}.${fractionalMilliseconds}`; // Formatted mm:ss.d
}
