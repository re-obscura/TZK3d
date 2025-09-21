import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { state } from '../state.js';
import { showSidePanel, hideSidePanel, updateCommentsList } from '../ui/uiManager.js';
import { displayAttributes } from '../ui/attributeManager.js';
import { animateCameraToObject, calculateDistanceToNearestEdge } from '../utils.js';

const playerHeight = 1.7;

export function onObjectSingleClick(event) {
    if (!state.model || event.target.closest('#control-bar, #side-panel, #top-left-ui-container')) return;

    const rect = state.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(((event.clientX-rect.left)/rect.width)*2-1, -((event.clientY-rect.top)/rect.height)*2+1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, state.camera);
    const intersects = raycaster.intersectObject(state.model, true);

    if (state.currentMode === 'measuring') {
        if (intersects.length > 0) handleMeasurement(intersects[0].point);
        return;
    }

    if (state.isSettingSpawnPoint && intersects.length > 0) {
        const spawnPoint = intersects[0].point.clone();
        state.isSettingSpawnPoint = false;
        state.domElements.container.style.cursor = 'default';
        document.getElementById('set-spawn-btn').classList.remove('active');
        toggleFirstPersonMode(true, spawnPoint);
        return;
    }

    if (state.currentMode === 'placing-point' && state.selectedObject) {
        const intersectsSelected = raycaster.intersectObject(state.selectedObject, true);
        if (intersectsSelected.length > 0) placePoint(intersectsSelected[0]);
    }
}

export function onObjectDoubleClick(event) {
    if (!state.model || state.isFirstPersonMode || state.currentMode !== 'navigate' || event.target.closest('#control-bar, #side-panel, #top-left-ui-container')) return;

    const rect = state.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(((event.clientX-rect.left)/rect.width)*2-1, -((event.clientY-rect.top)/rect.height)*2+1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, state.camera);
    const intersects = raycaster.intersectObject(state.model, true);

    if (state.selectedObject) {
       if (state.isRealisticMode) {
            state.selectedObject.material = state.selectedObject.userData.realisticMaterial || state.originalMaterials[state.selectedObject.uuid];
       } else {
            state.selectedObject.material = state.originalMaterials[state.selectedObject.uuid];
       }
       state.selectedObject = null;
       state.domElements.addPointBtn.classList.add('hidden');
    }

    if (intersects.length > 0) {
        const targetObject = intersects[0].object;

        state.selectedObject = targetObject;
        if(state.originalMaterials[state.selectedObject.uuid]) {
            state.selectedObject.material = state.highlightMaterial;
        }
        state.domElements.addPointBtn.classList.remove('hidden');
        showSidePanel('object-info');

        animateCameraToObject(targetObject, state);
    } else {
        hideSidePanel();
    }
}

export function setMode(newMode) {
    if (state.currentMode === newMode) return;

    if (state.currentMode === 'measuring') {
        document.getElementById('measure-btn').classList.remove('active');
        clearMeasurement();
    } else if (state.currentMode === 'placing-point') {
        state.domElements.addPointBtn.classList.remove('active');
        if (state.tempPointMarker) state.pointsGroup.remove(state.tempPointMarker);
        state.tempPointMarker = null;
        setFocusOnObject(null, false);
        hideSidePanel();
    }

    state.controls.enabled = true;
    state.domElements.container.style.cursor = 'default';
    state.currentMode = newMode;

    if (newMode === 'measuring') {
        document.getElementById('measure-btn').classList.add('active');
        state.domElements.container.style.cursor = 'crosshair';
        state.controls.enabled = false;
    } else if (newMode === 'placing-point') {
        state.domElements.addPointBtn.classList.add('active');
        if (state.selectedObject) {
            state.controls.enabled = false;
            state.domElements.container.style.cursor = 'crosshair';
            setFocusOnObject(state.selectedObject, true);
            animateCameraToObject(state.selectedObject, state);
        }
    }
}

function setFocusOnObject(targetObject, isFocused) {
    if (!state.model) return;
    state.model.traverse((child) => {
        if (child.isMesh && child !== targetObject) {
             const applyTransparency = (material) => {
                 if (!material) return;
                 material.transparent = isFocused;
                 material.opacity = isFocused ? 0.1 : 1.0;
             };
            if (Array.isArray(child.material)) {
                child.material.forEach(applyTransparency);
            } else {
                applyTransparency(child.material);
            }
        }
    });
}

export function placePoint(intersect) {
     if (state.tempPointMarker) state.pointsGroup.remove(state.tempPointMarker);
     const pointSize = (new THREE.Vector3().subVectors(intersect.point, state.camera.position).length()) / 200;
     state.tempPointMarker = new THREE.Mesh(new THREE.SphereGeometry(pointSize, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
     state.tempPointMarker.position.copy(intersect.point);
     state.pointsGroup.add(state.tempPointMarker);
     state.tempPointData = {
        position: intersect.point.clone(),
        objectUUID: intersect.object.uuid,
        objectName: intersect.object.name,
        distance: calculateDistanceToNearestEdge(intersect)
    };
     document.getElementById('modal-object-name').textContent = intersect.object.name;
     document.getElementById('modal-distance').textContent = state.tempPointData.distance.toFixed(2);
     resetPointForm();
     showSidePanel('add-point');
}

function resetPointForm() {
    document.getElementById('comment-input').value = '';
    document.getElementById('image-previews').innerHTML = '';
    state.tempImages = [];
    document.getElementById('defect-type').value = 'crack';
    document.getElementById('comment-status').value = 'open';
    document.getElementById('comment-priority').value = 'medium';
    document.getElementById('recommended-action').value = 'none';
    document.getElementById('responsible-person').value = '';
    state.currentlyEditingPointId = null;
}

export function savePoint() {
    if (state.currentlyEditingPointId) {
        const point = state.placedPoints.find(p => p.internalId === state.currentlyEditingPointId);
        if (point) {
            point.comment = document.getElementById('comment-input').value;
            point.status = document.getElementById('comment-status').value;
            point.defectType = document.getElementById('defect-type').value;
            point.recommendedAction = document.getElementById('recommended-action').value;
            point.responsible = document.getElementById('responsible-person').value;
            point.images = [...state.tempImages];
        }
    } else {
        if (!state.tempPointMarker) return;
        state.tempPointMarker.material.color.setHex(0x0000ff);
        state.placedPoints.push({
            ...state.tempPointData,
            id: `Д-${String(state.defectCounter++).padStart(3, '0')}`,
            comment: document.getElementById('comment-input').value,
            images: [...state.tempImages],
            status: document.getElementById('comment-status').value,
            priority: document.getElementById('comment-priority').value,
            defectType: document.getElementById('defect-type').value,
            recommendedAction: document.getElementById('recommended-action').value,
            responsible: document.getElementById('responsible-person').value,
            marker: state.tempPointMarker,
            internalId: THREE.MathUtils.generateUUID()
        });
        state.tempPointMarker = null;
    }

    state.tempPointData = {};
    state.tempImages = [];
    state.currentlyEditingPointId = null;
    setMode('navigate');
    showSidePanel('comments');
}

export function cancelPoint() {
    if (!state.currentlyEditingPointId && state.tempPointMarker) {
        state.pointsGroup.remove(state.tempPointMarker);
    }
    state.tempPointMarker = null;
    state.tempPointData = {};
    state.tempImages = [];
    state.currentlyEditingPointId = null;
    setMode('navigate');
}

export function editPoint(internalId) {
    const point = state.placedPoints.find(p => p.internalId === internalId);
    if (!point) return;
    state.currentlyEditingPointId = internalId;
    setMode('placing-point');

    document.getElementById('comment-input').value = point.comment;
    document.getElementById('defect-type').value = point.defectType;
    document.getElementById('comment-status').value = point.status;
    document.getElementById('comment-priority').value = point.priority;
    document.getElementById('recommended-action').value = point.recommendedAction;
    document.getElementById('responsible-person').value = point.responsible;

    state.tempImages = [...point.images];
    const previewsContainer = document.getElementById('image-previews');
    previewsContainer.innerHTML = state.tempImages.map(imgData => `<img src="${imgData}" class="img-preview">`).join('');

    document.getElementById('modal-object-name').textContent = point.objectName;
    document.getElementById('modal-distance').textContent = point.distance.toFixed(2);
    showSidePanel('add-point');
}

export function promptDeletePoint(internalId) {
    state.pointToDeleteId = internalId;
    state.domElements.confirmationModal.classList.remove('hidden');
}

export function deletePoint() {
    const pointIndex = state.placedPoints.findIndex(p => p.internalId === state.pointToDeleteId);
    if (pointIndex > -1) {
        state.pointsGroup.remove(state.placedPoints[pointIndex].marker);
        state.placedPoints.splice(pointIndex, 1);
        updateCommentsList();
    }
    state.pointToDeleteId = null;
    state.domElements.confirmationModal.classList.add('hidden');
}

export function handleImageFiles(event) {
    const files = event.target.files;
    if (!files) return;
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.tempImages.push(e.target.result);
            document.getElementById('image-previews').innerHTML += `<img src="${e.target.result}" class="img-preview">`;
        };
        reader.readAsDataURL(file);
    }
}

export function toggleFirstPersonMode(enable, spawnPoint = null) {
    state.isFirstPersonMode = enable;
    document.getElementById('fp-view-btn').classList.toggle('active', enable);
    if (enable) {
        state.originalCameraPos.copy(state.camera.position);
        state.originalControlsTarget.copy(state.controls.target);
        state.controls.enabled = false;
        if (state.isTouchDevice) state.domElements.touchControlsContainer.classList.remove('hidden');
        else state.fpControls.lock();
        document.getElementById('crosshair').style.display = 'block';

        let finalPosition = spawnPoint ? spawnPoint.clone() : new THREE.Vector3(0, playerHeight, 5);
        if (!spawnPoint && state.model) {
            const box = new THREE.Box3().setFromObject(state.model);
            const center = box.getCenter(new THREE.Vector3());
            finalPosition.set(center.x, state.model.position.y + playerHeight, center.z);
        }
        state.fpControls.getObject().position.copy(finalPosition);

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    } else {
        if (state.isTouchDevice) {
            state.domElements.touchControlsContainer.classList.add('hidden');
        }
        state.fpControls.unlock();
        state.controls.enabled = true;
        document.getElementById('crosshair').style.display = 'none';
        state.camera.position.copy(state.originalCameraPos);
        state.controls.target.copy(state.originalControlsTarget);

        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
    }
}

function onKeyDown({ code }) {
    switch (code) {
        case 'KeyW': state.moveState.forward = 1; break;
        case 'KeyA': state.moveState.right = -1; break;
        case 'KeyS': state.moveState.forward = -1; break;
        case 'KeyD': state.moveState.right = 1; break;
    }
}

function onKeyUp({ code }) {
    switch (code) {
        case 'KeyW': case 'KeyS': state.moveState.forward = 0; break;
        case 'KeyA': case 'KeyD': state.moveState.right = 0; break;
    }
}

function handleMeasurement(point) {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    sphere.position.copy(point);
    state.measurementGroup.add(sphere);
    state.measurement.spheres.push(sphere);
    state.measurement.points.push(point.clone());

    if (state.measurement.points.length === 2) {
        const [start, end] = state.measurement.points;
        state.measurement.line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([start, end]),
            new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
        );
        state.measurementGroup.add(state.measurement.line);

        const text = document.createElement('div');
        text.className = 'measurement-label';
        text.textContent = `${start.distanceTo(end).toFixed(2)} м`;
        state.measurement.label = new CSS2DObject(text);
        state.measurement.label.position.lerpVectors(start, end, 0.5);
        state.measurementGroup.add(state.measurement.label);

        state.measurement.points = [];
        state.measurement.spheres = [];
    }
}

function clearMeasurement() {
    state.measurementGroup.clear();
    state.measurement.points = [];
    state.measurement.spheres = [];
    state.measurement.line = null;
    state.measurement.label = null;
}