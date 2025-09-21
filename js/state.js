import * as THREE from 'three';

// --- Глобальное состояние приложения ---
// Здесь хранятся все переменные, которые должны быть доступны в разных модулях.

// --- 3D Сцена и рендер ---
let scene, camera, renderer, controls, composer, fxaaPass, ssaoPass, bloomPass, labelRenderer;
let ambientLight, directionalLight;
let minimapScene, minimapCamera, minimapRenderer, cameraHelper;

// --- Модель и данные ---
let model, minimapModel, originalMaterials = {}, storeyData = {};
let fullUuidToAttributesMap = {};
let defectCounter = 1;

// --- Интерактивность ---
let selectedObject = null;
const highlightMaterial = new THREE.MeshStandardMaterial({ color: 0x4f46e5, emissive: 0x333399, roughness: 0.4 });
let placedPoints = [];
let pointsGroup;
let tempPointMarker = null;
let tempPointData = {};
let tempImages = [];
let isSettingSpawnPoint = false;
let cameraAnimation = { active: false, startTime: 0, duration: 800 };
let currentMode = 'navigate';
let currentlyEditingPointId = null;
let pointToDeleteId = null;
const measurement = { points: [], spheres: [], line: null, label: null };
let measurementGroup;

// --- Режим от первого лица (Прогулка) ---
let fpControls;
let isFirstPersonMode = false;
const moveState = { forward: 0, right: 0, up: 0 };
let prevTime = performance.now();
let originalCameraPos, originalControlsTarget;

// --- Сенсорное управление ---
let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const touchState = {
    left:  { id: -1, active: false, start: new THREE.Vector2(), current: new THREE.Vector2(), delta: new THREE.Vector2() },
    right: { id: -1, active: false, start: new THREE.Vector2(), current: new THREE.Vector2(), delta: new THREE.Vector2() }
};
let touchControlsContainer, joystickLeft, joystickLeftThumb, rightLookZone;
let euler;

// --- Распознавание речи ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}

// --- Настройки графики ---
let isRealisticMode = false;
let textureLoader;
const textureCache = {};
const graphics = {
    preset: 'medium',
    resolution: 0.75,
    shadows: 'medium',
    fxaa: true,
    ssao: true,
    bloom: false,
};

// --- DOM Элементы ---
const domElements = {};

export function initDomElements() {
    Object.assign(domElements, {
        container: document.getElementById('viewer-container'),
        viewerContainer: document.getElementById('viewer-container'),
        sidePanel: document.getElementById('side-panel'),
        panelTitle: document.getElementById('panel-title'),
        addPointBtn: document.getElementById('add-point-btn'),
        imageViewer: document.getElementById('image-viewer'),
        fullscreenImg: document.getElementById('fullscreen-img'),
        confirmationModal: document.getElementById('confirmation-modal'),
        graphicsPanel: document.getElementById('graphics-panel'),
        minimapContainer: document.getElementById('minimap-container'),
        realisticViewBtn: document.getElementById('realistic-view-btn'),
        filtersBtn: document.getElementById('filters-btn'),
        filtersContent: document.getElementById('filters-content'),
        touchControlsContainer: null,
        joystickLeft: null,
        joystickLeftThumb: null,
        rightLookZone: null,
    });
}

export const state = {
    scene, camera, renderer, controls, composer, fxaaPass, ssaoPass, bloomPass, labelRenderer,
    ambientLight, directionalLight,
    minimapScene, minimapCamera, minimapRenderer, cameraHelper,
    model, minimapModel, originalMaterials, storeyData,
    fullUuidToAttributesMap, defectCounter,
    selectedObject, highlightMaterial, placedPoints, pointsGroup,
    tempPointMarker, tempPointData, tempImages,
    isSettingSpawnPoint, cameraAnimation, currentMode,
    currentlyEditingPointId, pointToDeleteId, measurement, measurementGroup,
    fpControls, isFirstPersonMode, moveState, prevTime,
    originalCameraPos, originalControlsTarget,
    isTouchDevice, touchState, touchControlsContainer, joystickLeft, joystickLeftThumb, rightLookZone,
    euler,
    recognition,
    isRealisticMode, textureLoader, textureCache, graphics,
    domElements,
};