import { state } from '../state.js';
import * as THREE from 'three';

export function initTouchControls() {
    state.domElements.touchControlsContainer = document.createElement('div');
    state.domElements.touchControlsContainer.id = 'touch-controls-container';
    state.domElements.touchControlsContainer.className = 'hidden';

    state.domElements.joystickLeft = document.createElement('div');
    state.domElements.joystickLeft.id = 'joystick-left';
    state.domElements.joystickLeftThumb = document.createElement('div');
    state.domElements.joystickLeftThumb.className = 'joystick-thumb';
    state.domElements.joystickLeft.appendChild(state.domElements.joystickLeftThumb);

    state.domElements.rightLookZone = document.createElement('div');
    state.domElements.rightLookZone.id = 'right-look-zone';

    state.domElements.touchControlsContainer.appendChild(state.domElements.joystickLeft);
    state.domElements.touchControlsContainer.appendChild(state.domElements.rightLookZone);
    document.body.appendChild(state.domElements.touchControlsContainer);

    state.domElements.container.addEventListener('touchstart', handleTouchStart, { passive: false });
    state.domElements.container.addEventListener('touchmove', handleTouchMove, { passive: false });
    state.domElements.container.addEventListener('touchend', handleTouchEnd, { passive: false });
    state.domElements.container.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

function handleTouchStart(e) {
    if (!state.isFirstPersonMode) return;
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        if (touch.clientX < window.innerWidth / 2 && !state.touchState.left.active) {
            state.touchState.left.id = touch.identifier;
            state.touchState.left.active = true;
            state.touchState.left.start.set(touch.clientX, touch.clientY);
            state.touchState.left.current.copy(state.touchState.left.start);
            state.domElements.joystickLeft.style.left = `${touch.clientX - 60}px`;
            state.domElements.joystickLeft.style.bottom = `${window.innerHeight - touch.clientY - 60}px`;
            state.domElements.joystickLeft.classList.add('active');
        }
        else if (touch.clientX >= window.innerWidth / 2 && !state.touchState.right.active) {
            state.touchState.right.id = touch.identifier;
            state.touchState.right.active = true;
            state.touchState.right.start.set(touch.clientX, touch.clientY);
            state.touchState.right.current.copy(state.touchState.right.start);
        }
    }
}

function handleTouchMove(e) {
    if (!state.isFirstPersonMode) return;
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        if (touch.identifier === state.touchState.left.id) {
            state.touchState.left.current.set(touch.clientX, touch.clientY);
            const delta = new THREE.Vector2().subVectors(state.touchState.left.current, state.touchState.left.start);
            const maxDistance = 60;
            let dx = delta.x;
            let dy = delta.y;
            const distance = delta.length();
            if (distance > maxDistance) {
                dx = (dx / distance) * maxDistance;
                dy = (dy / distance) * maxDistance;
            }
            state.moveState.right = dx / maxDistance;
            state.moveState.forward = - (dy / maxDistance);
            state.domElements.joystickLeftThumb.style.transform = `translate(${dx}px, ${dy}px)`;
        } else if (touch.identifier === state.touchState.right.id) {
            const prevPos = state.touchState.right.current.clone();
            state.touchState.right.current.set(touch.clientX, touch.clientY);
            const delta = new THREE.Vector2().subVectors(state.touchState.right.current, prevPos);

            const playerObject = state.fpControls.getObject();
            state.euler.setFromQuaternion(playerObject.quaternion);

            const lookSpeed = 0.004;
            state.euler.y -= delta.x * lookSpeed;
            state.euler.x -= delta.y * lookSpeed;
            state.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.euler.x));

            playerObject.quaternion.setFromEuler(state.euler);
        }
    }
}

export function handleTouchEnd(e) {
    if (!state.isFirstPersonMode) return;
    e.preventDefault();
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        if (touch.identifier === state.touchState.left.id) {
            state.touchState.left.active = false;
            state.touchState.left.id = -1;
            state.moveState.forward = 0;
            state.moveState.right = 0;
            state.domElements.joystickLeftThumb.style.transform = `translate(0px, 0px)`;
            state.domElements.joystickLeft.classList.remove('active');
        } else if (touch.identifier === state.touchState.right.id) {
            state.touchState.right.active = false;
            state.touchState.right.id = -1;
        }
    }
}

export function updatePlayer(delta) {
    if (!state.fpControls || (!state.fpControls.isLocked && !state.isTouchDevice)) return;
    const playerSpeed = 5.0;
    const speed = playerSpeed * delta;
    state.fpControls.moveRight(state.moveState.right * speed);
    state.fpControls.moveForward(state.moveState.forward * speed);
}