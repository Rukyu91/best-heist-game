// ShadowVault: Keyboard & Pointer Input Handling Subsystem
export const ACTION_CONFIRM = 1; // Confirm / Start / Select action bit
export const ACTION_PAUSE = 2; // Pause / Resume toggle action bit
export const ACTION_INTERACT = 4; // Hack keypad / Breach safe action bit
export const ACTION_MUTE = 8; // Mute / Unmute audio toggle action bit
export const ACTION_RESTART = 16; // Immediate restart action bit

export function createInput(targetInteractionElement) {
  const activeHeldKeyCodes = new Set(); // Set of currently depressed keyboard keys
  let accumulatedPendingActionsBitmask = 0; // Bitmask of queued instantaneous triggers
  let currentPointerCoordX = 0; // Pointer coordinate X relative to canvas
  let currentPointerCoordY = 0; // Pointer coordinate Y relative to canvas

  function handleKeydownEvent(keyboardEvent) {
    activeHeldKeyCodes.add(keyboardEvent.code); // Register depressed key code

    if (keyboardEvent.code === 'Space' || keyboardEvent.code === 'KeyE') {
      accumulatedPendingActionsBitmask |= ACTION_INTERACT; // Queue interaction action
      accumulatedPendingActionsBitmask |= ACTION_CONFIRM; // Queue confirm action
      keyboardEvent.preventDefault(); // Prevent default browser scroll
    } else if (keyboardEvent.code === 'KeyP' || keyboardEvent.code === 'Escape') {
      accumulatedPendingActionsBitmask |= ACTION_PAUSE; // Queue pause action
      keyboardEvent.preventDefault(); // Prevent default browser action
    } else if (keyboardEvent.code === 'KeyM') {
      accumulatedPendingActionsBitmask |= ACTION_MUTE; // Queue mute action
      keyboardEvent.preventDefault(); // Prevent default browser action
    } else if (keyboardEvent.code === 'KeyR') {
      accumulatedPendingActionsBitmask |= ACTION_RESTART; // Queue restart action
      keyboardEvent.preventDefault(); // Prevent default browser action
    } else if (keyboardEvent.code === 'Enter') {
      accumulatedPendingActionsBitmask |= ACTION_CONFIRM; // Queue confirm action
      keyboardEvent.preventDefault(); // Prevent default browser action
    }
  }

  function handleKeyupEvent(keyboardEvent) {
    activeHeldKeyCodes.delete(keyboardEvent.code); // Unregister released key code
  }

  function handlePointerMoveEvent(pointerEvent) {
    const canvasBoundingRect = targetInteractionElement.getBoundingClientRect(); // Canvas bounding rectangle
    const canvasScaleRatioX = targetInteractionElement.width / canvasBoundingRect.width; // Horizontal scale ratio
    const canvasScaleRatioY = targetInteractionElement.height / canvasBoundingRect.height; // Vertical scale ratio
    currentPointerCoordX = (pointerEvent.clientX - canvasBoundingRect.left) * canvasScaleRatioX; // Normalized X
    currentPointerCoordY = (pointerEvent.clientY - canvasBoundingRect.top) * canvasScaleRatioY; // Normalized Y
  }

  function handlePointerDownEvent(pointerEvent) {
    accumulatedPendingActionsBitmask |= ACTION_CONFIRM; // Queue confirm action on click
    accumulatedPendingActionsBitmask |= ACTION_INTERACT; // Queue interact action on click
  }

  window.addEventListener('keydown', handleKeydownEvent); // Listen for keydown
  window.addEventListener('keyup', handleKeyupEvent); // Listen for keyup
  targetInteractionElement.addEventListener('mousemove', handlePointerMoveEvent); // Listen for mousemove
  targetInteractionElement.addEventListener('pointerdown', handlePointerDownEvent); // Listen for pointerdown

  function queryOperativeMovement() {
    let movementDirectionVectorX = 0; // Vector X component
    let movementDirectionVectorY = 0; // Vector Y component

    if (activeHeldKeyCodes.has('KeyA') || activeHeldKeyCodes.has('ArrowLeft')) movementDirectionVectorX -= 1; // Move left
    if (activeHeldKeyCodes.has('KeyD') || activeHeldKeyCodes.has('ArrowRight')) movementDirectionVectorX += 1; // Move right
    if (activeHeldKeyCodes.has('KeyW') || activeHeldKeyCodes.has('ArrowUp')) movementDirectionVectorY -= 1; // Move up
    if (activeHeldKeyCodes.has('KeyS') || activeHeldKeyCodes.has('ArrowDown')) movementDirectionVectorY += 1; // Move down

    // Normalize diagonal movement vectors to unit circle
    if (movementDirectionVectorX !== 0 && movementDirectionVectorY !== 0) {
      const vectorMagnitudeLength = Math.hypot(movementDirectionVectorX, movementDirectionVectorY); // Hypotenuse
      movementDirectionVectorX /= vectorMagnitudeLength; // Unit X
      movementDirectionVectorY /= vectorMagnitudeLength; // Unit Y
    }

    const operativeIsSneaking = activeHeldKeyCodes.has('ShiftLeft') || activeHeldKeyCodes.has('ShiftRight'); // Sneak flag
    const operativeIsInteracting = activeHeldKeyCodes.has('Space') || activeHeldKeyCodes.has('KeyE'); // Interact flag

    return {
      dx: movementDirectionVectorX, // X movement component
      dy: movementDirectionVectorY, // Y movement component
      isSneaking: operativeIsSneaking, // Sneaking status
      isInteracting: operativeIsInteracting, // Interaction status
      mouseX: currentPointerCoordX, // Pointer coordinate X
      mouseY: currentPointerCoordY, // Pointer coordinate Y
    };
  }

  function flushPendingActionTriggers() {
    const currentActions = accumulatedPendingActionsBitmask; // Read queued actions
    accumulatedPendingActionsBitmask = 0; // Reset queue
    return currentActions; // Return snapshot
  }

  function cleanupInputListeners() {
    window.removeEventListener('keydown', handleKeydownEvent); // Remove keydown
    window.removeEventListener('keyup', handleKeyupEvent); // Remove keyup
    targetInteractionElement.removeEventListener('mousemove', handlePointerMoveEvent); // Remove mousemove
    targetInteractionElement.removeEventListener('pointerdown', handlePointerDownEvent); // Remove pointerdown
  }

  return {
    getMovement: queryOperativeMovement, // Expose movement query
    takeActions: flushPendingActionTriggers, // Expose action flush
    destroy: cleanupInputListeners, // Expose cleanup method
  };
}
