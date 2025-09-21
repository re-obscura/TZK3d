import * as THREE from 'three';
import { state } from '../state.js';

export function setupMinimap(modelToMap) {
    if (state.minimapModel) {
        state.minimapScene.remove(state.minimapModel);
    }
    state.minimapModel = modelToMap.clone();

    state.minimapModel.traverse(child => {
        if(child.isMesh) {
            const color = child.material.color ? child.material.color : new THREE.Color(0xaaaaaa);
            child.material = new THREE.MeshBasicMaterial({ color: color });
        }
    });
    state.minimapScene.add(state.minimapModel);

    const box = new THREE.Box3().setFromObject(state.minimapModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.z);

    state.minimapCamera = new THREE.OrthographicCamera(-maxDim/2, maxDim/2, maxDim/2, -maxDim/2, 1, size.y + 20);
    state.minimapCamera.position.set(center.x, box.max.y + 10, center.z);
    state.minimapCamera.lookAt(center);
    state.minimapCamera.zoom = 0.9;
    state.minimapCamera.updateProjectionMatrix();

    if (state.cameraHelper) {
        state.minimapScene.remove(state.cameraHelper);
    }
    const helperGeometry = new THREE.ConeGeometry(maxDim * 0.03, maxDim * 0.06, 4);
    const helperMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    state.cameraHelper = new THREE.Mesh(helperGeometry, helperMaterial);
    state.cameraHelper.rotation.x = Math.PI;
    state.minimapScene.add(state.cameraHelper);

    state.domElements.minimapContainer.style.display = 'block';
}

export function updateMinimap() {
    if (!state.minimapRenderer || !state.minimapScene || !state.minimapCamera || !state.model) return;

    if (state.cameraHelper) {
        state.cameraHelper.position.set(state.camera.position.x, state.camera.position.y - 1, state.camera.position.z);
        const lookDirection = new THREE.Vector3();
        state.camera.getWorldDirection(lookDirection);
        const angle = Math.atan2(lookDirection.x, lookDirection.z);
        state.cameraHelper.rotation.y = angle;
    }
    state.minimapRenderer.render(state.minimapScene, state.minimapCamera);
}

export function updateMinimapCamera() {
    if (!state.minimapCamera || !state.minimapModel) return;

    const box = new THREE.Box3();
    state.minimapModel.traverse(child => {
        if(child.isMesh && child.visible) {
            box.expandByObject(child);
        }
    });

    if (box.isEmpty()) {
        box.setFromObject(state.minimapModel);
    };

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.z);

    state.minimapCamera.position.set(center.x, box.max.y + 10, center.z);
    state.minimapCamera.lookAt(center.x, center.y, center.z);

    state.minimapCamera.left = -maxDim / 2;
    state.minimapCamera.right = maxDim / 2;
    state.minimapCamera.top = maxDim / 2;
    state.minimapCamera.bottom = -maxDim / 2;
    state.minimapCamera.updateProjectionMatrix();
}