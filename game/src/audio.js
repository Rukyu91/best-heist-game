// ShadowVault Procedural Web Audio API Sound Synthesizer
// Synthesizes stealth footsteps, pings, sirens, and hacking ticks without external audio assets

export function createAudio() {
  let audioContextInstance = null; // Lazy-initialized Web Audio API AudioContext
  let soundIsMuted = false; // Audio mute state flag
  let ambientDroneOscillator = null; // Background low-frequency stealth drone oscillator
  let ambientDroneGainNode = null; // Gain node controlling ambient drone volume

  function initializeAudioPipeline() {
    if (audioContextInstance) return; // Already initialized
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext; // Browser AudioContext
      if (AudioContextClass) {
        audioContextInstance = new AudioContextClass(); // Instantiate audio context
        startAmbientDroneLoop(); // Begin low stealth hum
      }
    } catch {
      // Audio autoplay may be deferred until user interaction
    }
  }

  function startAmbientDroneLoop() {
    if (!audioContextInstance || ambientDroneOscillator) return; // Guard against multiple starts
    try {
      ambientDroneOscillator = audioContextInstance.createOscillator(); // Create sine oscillator
      ambientDroneGainNode = audioContextInstance.createGain(); // Create volume gain node

      ambientDroneOscillator.type = 'sine'; // Pure sine wave for atmospheric drone
      ambientDroneOscillator.frequency.setValueAtTime(55, audioContextInstance.currentTime); // 55 Hz (A1 note)

      ambientDroneGainNode.gain.setValueAtTime(soundIsMuted ? 0 : 0.04, audioContextInstance.currentTime); // Subtle volume

      ambientDroneOscillator.connect(ambientDroneGainNode); // Route oscillator through gain node
      ambientDroneGainNode.connect(audioContextInstance.destination); // Route gain node to speakers
      ambientDroneOscillator.start(); // Start playing ambient drone
    } catch {
      // Handle audio failure silently
    }
  }

  function playFootstepSound(isSneakingMovement) {
    if (!audioContextInstance || soundIsMuted) return; // Abort if muted or uninitialized
    try {
      const footstepOsc = audioContextInstance.createOscillator(); // Footstep pulse oscillator
      const footstepGain = audioContextInstance.createGain(); // Footstep envelope gain
      const playbackCurrentTime = audioContextInstance.currentTime; // High-precision audio clock

      footstepOsc.type = 'triangle'; // Triangle wave for soft shoe impact
      footstepOsc.frequency.setValueAtTime(isSneakingMovement ? 90 : 130, playbackCurrentTime); // Pitch
      footstepOsc.frequency.exponentialRampToValueAtTime(30, playbackCurrentTime + 0.05); // Rapid pitch drop

      footstepGain.gain.setValueAtTime(isSneakingMovement ? 0.02 : 0.06, playbackCurrentTime); // Soft volume
      footstepGain.gain.exponentialRampToValueAtTime(0.001, playbackCurrentTime + 0.05); // Decay envelope

      footstepOsc.connect(footstepGain); // Connect oscillator to envelope gain
      footstepGain.connect(audioContextInstance.destination); // Connect envelope gain to output

      footstepOsc.start(playbackCurrentTime); // Trigger footstep start
      footstepOsc.stop(playbackCurrentTime + 0.05); // End footstep sound
    } catch {}
  }

  function playSuspiciousPingAlert() {
    if (!audioContextInstance || soundIsMuted) return; // Abort if muted or uninitialized
    try {
      const suspicionOsc = audioContextInstance.createOscillator(); // Warning ping oscillator
      const suspicionGain = audioContextInstance.createGain(); // Warning ping gain
      const playbackCurrentTime = audioContextInstance.currentTime; // High-precision audio clock

      suspicionOsc.type = 'sine'; // Clean sine tone
      suspicionOsc.frequency.setValueAtTime(440, playbackCurrentTime); // A4 note (440 Hz)
      suspicionOsc.frequency.exponentialRampToValueAtTime(880, playbackCurrentTime + 0.15); // Ramp up an octave to A5

      suspicionGain.gain.setValueAtTime(0.08, playbackCurrentTime); // Ping volume
      suspicionGain.gain.exponentialRampToValueAtTime(0.001, playbackCurrentTime + 0.2); // Decay envelope

      suspicionOsc.connect(suspicionGain); // Connect oscillator to gain
      suspicionGain.connect(audioContextInstance.destination); // Connect gain to output

      suspicionOsc.start(playbackCurrentTime); // Start ping tone
      suspicionOsc.stop(playbackCurrentTime + 0.2); // Stop ping tone
    } catch {}
  }

  function playFacilityAlarmSiren() {
    if (!audioContextInstance || soundIsMuted) return; // Abort if muted or uninitialized
    try {
      const alarmSirenOsc = audioContextInstance.createOscillator(); // Siren oscillator
      const alarmSirenGain = audioContextInstance.createGain(); // Siren volume gain
      const playbackCurrentTime = audioContextInstance.currentTime; // High-precision audio clock

      alarmSirenOsc.type = 'sawtooth'; // Harsh sawtooth wave for urgent alarm
      alarmSirenOsc.frequency.setValueAtTime(650, playbackCurrentTime); // Base siren pitch
      alarmSirenOsc.frequency.linearRampToValueAtTime(950, playbackCurrentTime + 0.12); // Upward siren sweep
      alarmSirenOsc.frequency.linearRampToValueAtTime(650, playbackCurrentTime + 0.25); // Downward siren sweep

      alarmSirenGain.gain.setValueAtTime(0.12, playbackCurrentTime); // Urgent alarm volume
      alarmSirenGain.gain.exponentialRampToValueAtTime(0.01, playbackCurrentTime + 0.3); // Quick decay

      alarmSirenOsc.connect(alarmSirenGain); // Connect siren oscillator
      alarmSirenGain.connect(audioContextInstance.destination); // Route to destination

      alarmSirenOsc.start(playbackCurrentTime); // Play siren pulse
      alarmSirenOsc.stop(playbackCurrentTime + 0.3); // End siren pulse
    } catch {}
  }

  function playTerminalHackKeyTick() {
    if (!audioContextInstance || soundIsMuted) return; // Abort if muted or uninitialized
    try {
      const keypadTickOsc = audioContextInstance.createOscillator(); // Digital tick oscillator
      const keypadTickGain = audioContextInstance.createGain(); // Digital tick gain
      const playbackCurrentTime = audioContextInstance.currentTime; // High-precision audio clock

      keypadTickOsc.type = 'square'; // Digital square wave for keypad click
      keypadTickOsc.frequency.setValueAtTime(1200 + Math.random() * 600, playbackCurrentTime); // Randomized high chirp

      keypadTickGain.gain.setValueAtTime(0.05, playbackCurrentTime); // Subtle click volume
      keypadTickGain.gain.exponentialRampToValueAtTime(0.001, playbackCurrentTime + 0.03); // Instant decay

      keypadTickOsc.connect(keypadTickGain); // Connect tick oscillator
      keypadTickGain.connect(audioContextInstance.destination); // Route to destination

      keypadTickOsc.start(playbackCurrentTime); // Start click
      keypadTickOsc.stop(playbackCurrentTime + 0.03); // Stop click
    } catch {}
  }

  function playVaultLootAcquiredFanfare() {
    if (!audioContextInstance || soundIsMuted) return; // Abort if muted or uninitialized
    try {
      const victoryChordsNotes = [523.25, 659.25, 783.99, 1046.5]; // C Major chord arpeggio (C5, E5, G5, C6)
      const playbackCurrentTime = audioContextInstance.currentTime; // High-precision audio clock

      victoryChordsNotes.forEach((frequencyHertz, noteSequenceIndex) => {
        const arpeggioNoteOsc = audioContextInstance.createOscillator(); // Note oscillator
        const arpeggioNoteGain = audioContextInstance.createGain(); // Note gain
        const noteStartTime = playbackCurrentTime + noteSequenceIndex * 0.08; // Staggered arpeggio timing

        arpeggioNoteOsc.type = 'sine'; // Pure melodic tone
        arpeggioNoteOsc.frequency.setValueAtTime(frequencyHertz, noteStartTime); // Note frequency

        arpeggioNoteGain.gain.setValueAtTime(0.12, noteStartTime); // Note volume
        arpeggioNoteGain.gain.exponentialRampToValueAtTime(0.001, noteStartTime + 0.25); // Note release

        arpeggioNoteOsc.connect(arpeggioNoteGain); // Connect note
        arpeggioNoteGain.connect(audioContextInstance.destination); // Route note

        arpeggioNoteOsc.start(noteStartTime); // Trigger note start
        arpeggioNoteOsc.stop(noteStartTime + 0.25); // Trigger note stop
      });
    } catch {}
  }

  function playExfiltrationSuccessTune() {
    if (!audioContextInstance || soundIsMuted) return; // Abort if muted or uninitialized
    try {
      const escapeCelebrationNotes = [440, 554.37, 659.25, 880]; // A Major triumphant fanfare (A4, C#5, E5, A5)
      const playbackCurrentTime = audioContextInstance.currentTime; // High-precision audio clock

      escapeCelebrationNotes.forEach((frequencyHertz, noteSequenceIndex) => {
        const fanfareNoteOsc = audioContextInstance.createOscillator(); // Fanfare oscillator
        const fanfareNoteGain = audioContextInstance.createGain(); // Fanfare gain
        const noteStartTime = playbackCurrentTime + noteSequenceIndex * 0.1; // Staggered tempo

        fanfareNoteOsc.type = 'triangle'; // Warm brass-like tone
        fanfareNoteOsc.frequency.setValueAtTime(frequencyHertz, noteStartTime); // Note frequency

        fanfareNoteGain.gain.setValueAtTime(0.15, noteStartTime); // Fanfare volume
        fanfareNoteGain.gain.exponentialRampToValueAtTime(0.001, noteStartTime + 0.4); // Ring out decay

        fanfareNoteOsc.connect(fanfareNoteGain); // Connect fanfare note
        fanfareNoteGain.connect(audioContextInstance.destination); // Route note

        fanfareNoteOsc.start(noteStartTime); // Trigger fanfare note start
        fanfareNoteOsc.stop(noteStartTime + 0.4); // Trigger fanfare note stop
      });
    } catch {}
  }

  function toggleMasterAudioMute() {
    soundIsMuted = !soundIsMuted; // Invert mute flag
    if (ambientDroneGainNode && audioContextInstance) {
      ambientDroneGainNode.gain.setValueAtTime(soundIsMuted ? 0 : 0.04, audioContextInstance.currentTime); // Update ambient gain
    }
    return soundIsMuted; // Return new mute state
  }

  return {
    init: initializeAudioPipeline, // Expose initialization method
    playFootstep: playFootstepSound, // Expose footstep sound trigger
    playSuspiciousPing: playSuspiciousPingAlert, // Expose suspicion ping trigger
    playAlarmAlert: playFacilityAlarmSiren, // Expose alarm siren trigger
    playHackTick: playTerminalHackKeyTick, // Expose keypad tick trigger
    playLootCollected: playVaultLootAcquiredFanfare, // Expose loot collected fanfare trigger
    playEscapeSuccess: playExfiltrationSuccessTune, // Expose victory fanfare trigger
    toggleMute: toggleMasterAudioMute, // Expose mute toggle method
    isMuted: () => soundIsMuted, // Expose mute query getter
  };
}
