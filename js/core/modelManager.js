import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { state } from '../state.js';
import { TEXTURES, ifcGuidToUuid } from '../utils.js';
import { setupMinimap, updateMinimapCamera } from './minimapManager.js';

export async function handleIgjUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    resetModelState();

    try {
        const zip = await JSZip.loadAsync(file);
        const glbFile = zip.file(/\.glb$/i)[0];
        const jsonFile = zip.file(/\.json$/i)[0];

        if (!glbFile || !jsonFile) throw new Error('.igj archive must contain .glb and .json files.');

        const jsonString = await jsonFile.async('string');
        const rawAttributesData = JSON.parse(jsonString);

        state.fullUuidToAttributesMap = {};
        for (const fullUuid in rawAttributesData) {
            state.fullUuidToAttributesMap[fullUuid.toLowerCase()] = rawAttributesData[fullUuid];
        }

        const glbBlob = await glbFile.async('blob');
        const glbUrl = URL.createObjectURL(glbBlob);
        loadModel(glbUrl);

    } catch (error) {
        console.error("Error processing .igj file:", error);
        alert("Ошибка при обработке файла .igj: " + error.message);
    }
}

function resetModelState() {
    if (state.model) state.scene.remove(state.model);
    if (state.minimapModel) state.minimapScene.remove(state.minimapModel);

    state.model = null;
    state.minimapModel = null;
    state.originalMaterials = {};
    state.selectedObject = null;
    state.pointsGroup.clear();
    state.placedPoints = [];
    state.defectCounter = 1;
    state.domElements.filtersBtn.disabled = true;
    state.domElements.minimapContainer.style.display = 'none';
    state.domElements.addPointBtn.classList.add('hidden');
}

function loadModel(url) {
    const loader = new GLTFLoader();
    loader.load(url, async (gltf) => {
        state.model = gltf.scene;
        const compressedGuidRegex = /([0-9a-zA-Z_$]{22})/;

        state.model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                state.originalMaterials[child.uuid] = child.material;
                child.userData.uuid = child.uuid;

                const match = (child.name || '').match(compressedGuidRegex);
                if (match) {
                    const fullUuid = ifcGuidToUuid(match[0]);
                    if (fullUuid && state.fullUuidToAttributesMap[fullUuid]) {
                        child.userData.ifcData = state.fullUuidToAttributesMap[fullUuid];
                    }
                }
                child.userData.realisticMaterial = getRealisticMaterial(child.userData.ifcData || {});
            }
        });

        if (state.isRealisticMode) {
            toggleRealisticMode(true);
        }

        const box = new THREE.Box3().setFromObject(state.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        state.model.position.set(-center.x, -box.min.y, -center.z);

        const newModelCenterY = size.y / 2;
        state.camera.position.set(0, newModelCenterY, maxDim * 1.5);
        state.controls.target.set(0, newModelCenterY, 0);
        state.camera.near = maxDim / 100;
        state.camera.far = maxDim * 100;
        state.camera.updateProjectionMatrix();
        state.controls.update();

        state.scene.add(state.model);

        analyzeModelForFilters(state.model);
        setupMinimap(state.model);

        if (Object.keys(state.storeyData.storeys).length > 0) {
            const { buildFilterUI } = await import('../ui/uiManager.js');
            buildFilterUI();
            state.domElements.filtersBtn.disabled = false;
        } else {
            state.domElements.filtersBtn.disabled = true;
        }

    }, undefined, (error) => console.error("Ошибка загрузки модели:", error));
}


function getRealisticMaterial(ifcData) {
    let materialName = ifcData?.Name || ifcData?.IfcType || '';
    if (ifcData?.Properties) {
        for (const pset of Object.values(ifcData.Properties)) {
            if (pset?.Material) materialName += ' ' + pset.Material;
        }
    }
    materialName = materialName.toLowerCase();

    for (const key in TEXTURES) {
        if (materialName.includes(key)) {
            const matInfo = { ...TEXTURES[key] };
            const mat = new THREE.MeshStandardMaterial(matInfo);
            if (matInfo.map) {
                ['map', 'normalMap', 'roughnessMap'].forEach(texType => {
                    if (matInfo[texType]) {
                        const url = matInfo[texType];
                        if (!state.textureCache[url]) {
                            const texture = state.textureLoader.load(url);
                            texture.wrapS = THREE.RepeatWrapping;
                            texture.wrapT = THREE.RepeatWrapping;
                            state.textureCache[url] = texture;
                        }
                        mat[texType] = state.textureCache[url].clone();
                        mat[texType].repeat.set(2.0, 2.0);
                    }
                });
            }
            return mat;
        }
    }
    return new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
}

export function toggleRealisticMode(forceState) {
    state.isRealisticMode = forceState !== undefined ? forceState : !state.isRealisticMode;
    state.domElements.realisticViewBtn.classList.toggle('active', state.isRealisticMode);
    if (!state.model) return;

    state.model.traverse((child) => {
        if (child.isMesh) {
            if (child === state.selectedObject) {
                child.material = state.highlightMaterial;
            } else if (state.isRealisticMode) {
                child.material = child.userData.realisticMaterial || state.originalMaterials[child.uuid];
            } else {
                child.material = state.originalMaterials[child.uuid];
            }
        }
    });
}

function analyzeModelForFilters(model) {
    state.storeyData = { storeys: {}, objectsByStorey: {} };
    createVirtualStoreys(model);
}

function createVirtualStoreys(model) {
    const box = new THREE.Box3().setFromObject(model);
    const modelHeight = box.max.y - box.min.y;
    if (modelHeight < 2) return;

    const assumedFloorHeight = 3.5;
    const numFloors = Math.max(1, Math.round(modelHeight / assumedFloorHeight));

    for (let i = 0; i < numFloors; i++) {
        const floorName = `Этаж ${i + 1}`;
        const y_min = box.min.y + (i * (modelHeight / numFloors));
        const y_max = y_min + (modelHeight / numFloors);
        state.storeyData.storeys[floorName] = { y_min, y_max };
        state.storeyData.objectsByStorey[floorName] = [];
    }

    model.traverse(child => {
        if (child.isMesh && child.geometry) {
            const childBox = new THREE.Box3().setFromObject(child);
            const childCenterY = (childBox.min.y + childBox.max.y) / 2;

            for (const floorName in state.storeyData.storeys) {
                const floor = state.storeyData.storeys[floorName];
                if (childCenterY >= floor.y_min && childCenterY < floor.y_max) {
                    state.storeyData.objectsByStorey[floorName].push(child.userData.uuid);
                    break;
                }
            }
        }
    });
}

export function applyFilter(storeyName) {
    if (!state.model) return;
    const isShowingAll = storeyName === 'all';

    state.model.traverse(child => {
        if (child.isMesh) {
            let isVisible = false;
            if (isShowingAll) {
                isVisible = true;
            } else if (state.storeyData.objectsByStorey[storeyName]) {
                isVisible = state.storeyData.objectsByStorey[storeyName].includes(child.userData.uuid);
            }
            child.visible = isVisible;
        }
    });

    if (state.minimapModel) {
         state.minimapModel.traverse(child => {
            if (child.isMesh) {
                const originalObject = state.model.getObjectByProperty('uuid', child.uuid);
                 if(originalObject) child.visible = originalObject.visible;
            }
        });
    }
    updateMinimapCamera();
}