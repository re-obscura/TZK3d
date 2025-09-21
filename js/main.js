import { state, initDomElements } from './state.js';
import { init } from './three-core/sceneSetup.js';
import { setupUI } from './ui/uiManager.js';
import { onObjectSingleClick, onObjectDoubleClick } from './core/interactionManager.js';
import { updatePlayer } from './core/touchControls.js';
import { updateMinimap } from './core/minimapManager.js';

let clickTimer = null;
const clickDelay = 250; // ms
let clickCount = 0;

function onPointerUp(event) {
    clickCount++;
    if (clickCount === 1) {
        clickTimer = setTimeout(() => {
            clickCount = 0;
            onObjectSingleClick(event);
        }, clickDelay);
    } else {
        clearTimeout(clickTimer);
        clickCount = 0;
        onObjectDoubleClick(event);
    }
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - (state.prevTime || 0)) / 1000;
    state.prevTime = time;

    if (state.isFirstPersonMode) {
        updatePlayer(delta);
    } else {
        if (state.cameraAnimation.active) {
            const elapsed = performance.now() - state.cameraAnimation.startTime;
            const alpha = Math.min(elapsed / state.cameraAnimation.duration, 1.0);
            const easedAlpha = 0.5 - 0.5 * Math.cos(alpha * Math.PI);
            state.camera.position.lerpVectors(state.cameraAnimation.startPos, state.cameraAnimation.endPos, easedAlpha);
            state.controls.target.lerpVectors(state.cameraAnimation.startTarget, state.cameraAnimation.endTarget, easedAlpha);
            if (alpha >= 1.0) state.cameraAnimation.active = false;
        }
        state.controls.update();
    }

    if (state.composer) state.composer.render(delta);
    if (state.labelRenderer) state.labelRenderer.render(state.scene, state.camera);

    updateMinimap();
}

document.addEventListener('DOMContentLoaded', () => {
    initDomElements();
    init();
    setupUI();

    state.domElements.viewerContainer.addEventListener('pointerup', onPointerUp);

    animate();
});