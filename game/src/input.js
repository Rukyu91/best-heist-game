// Input handler for keyboard and pointer controls in ShadowVault Heist
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

export function createInput(element) {
  const keys = new Set();
  let pendingActions = 0;
  let mouseX = 0;
  let mouseY = 0;

  function onKeyDown(event) {
    keys.add(event.code);

    if (event.code === 'Space' || event.code === 'KeyE') {
      pendingActions |= ACTION_INTERACT;
      pendingActions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      pendingActions |= ACTION_PAUSE;
      event.preventDefault();
    } else if (event.code === 'KeyM') {
      pendingActions |= ACTION_MUTE;
      event.preventDefault();
    } else if (event.code === 'KeyR') {
      pendingActions |= ACTION_RESTART;
      event.preventDefault();
    } else if (event.code === 'Enter') {
      pendingActions |= ACTION_CONFIRM;
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onMouseMove(event) {
    const rect = element.getBoundingClientRect();
    const scaleX = element.width / rect.width;
    const scaleY = element.height / rect.height;
    mouseX = (event.clientX - rect.left) * scaleX;
    mouseY = (event.clientY - rect.top) * scaleY;
  }

  function onPointerDown(event) {
    pendingActions |= ACTION_CONFIRM;
    pendingActions |= ACTION_INTERACT;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  element.addEventListener('mousemove', onMouseMove);
  element.addEventListener('pointerdown', onPointerDown);

  function getMovement() {
    let dx = 0;
    let dy = 0;

    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    const isSneaking = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const isInteracting = keys.has('Space') || keys.has('KeyE');

    return { dx, dy, isSneaking, isInteracting, mouseX, mouseY };
  }

  function takeActions() {
    const current = pendingActions;
    pendingActions = 0;
    return current;
  }

  function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    element.removeEventListener('mousemove', onMouseMove);
    element.removeEventListener('pointerdown', onPointerDown);
  }

  return {
    getMovement,
    takeActions,
    destroy,
  };
}
