import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { state } from '../state.js';
import { initTouchControls } from '../core/touchControls.js';
import { applyGraphicsPreset } from '../core/graphicsManager.js';

export function init() {
    const { domElements } = state;
    const w = domElements.container.clientWidth;
    const h = domElements.container.clientHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0xf3f3f3);
    state.pointsGroup = new THREE.Group();
    state.measurementGroup = new THREE.Group();
    state.scene.add(state.pointsGroup, state.measurementGroup);

    state.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    state.camera.position.set(5, 5, 5);
    state.originalCameraPos = new THREE.Vector3();
    state.originalControlsTarget = new THREE.Vector3();

    state.minimapScene = new THREE.Scene();
    state.minimapScene.background = new THREE.Color(0xe0e0e0);
    const minimapWrapper = document.getElementById('minimap-renderer-wrapper');
    if (minimapWrapper) {
        state.minimapRenderer = new THREE.WebGLRenderer({ alpha: true });
        state.minimapRenderer.setSize(minimapWrapper.clientWidth, minimapWrapper.clientHeight);
        minimapWrapper.appendChild(state.minimapRenderer.domElement);
    }

    state.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    state.renderer.setPixelRatio(window.devicePixelRatio);
    state.renderer.setSize(w, h);
    domElements.container.appendChild(state.renderer.domElement);

    state.labelRenderer = new CSS2DRenderer();
    state.labelRenderer.setSize(w, h);
    state.labelRenderer.domElement.style.position = 'absolute';
    state.labelRenderer.domElement.style.top = '0px';
    state.labelRenderer.domElement.style.pointerEvents = 'none';
    domElements.container.appendChild(state.labelRenderer.domElement);

    state.ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    state.scene.add(state.ambientLight);

    state.directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    state.directionalLight.position.set(15, 25, 20);
    state.directionalLight.castShadow = true;
    state.scene.add(state.directionalLight);

    state.renderer.shadowMap.enabled = true;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.0;

    state.directionalLight.shadow.bias = -0.001;
    state.directionalLight.shadow.normalBias = 0.02;

    state.composer = new EffectComposer(state.renderer);

    const renderPass = new RenderPass(state.scene, state.camera);
    state.composer.addPass(renderPass);

    state.ssaoPass = new SSAOPass(state.scene, state.camera, w, h);
    state.ssaoPass.kernelRadius = 0.8;
    state.ssaoPass.minDistance = 0.001;
    state.ssaoPass.maxDistance = 0.1;
    state.composer.addPass(state.ssaoPass);

    state.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.4, 0.85);
    state.composer.addPass(state.bloomPass);

    state.fxaaPass = new ShaderPass(FXAAShader);
    state.composer.addPass(state.fxaaPass);

    const outputPass = new OutputPass();
    state.composer.addPass(outputPass);

    const gridHelper = new THREE.GridHelper(100, 100, 0xcccccc, 0xdddddd);
    state.scene.add(gridHelper);

    const shadowCatcherPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.ShadowMaterial({ opacity: 0.2 })
    );
    shadowCatcherPlane.rotation.x = -Math.PI / 2;
    shadowCatcherPlane.receiveShadow = true;
    state.scene.add(shadowCatcherPlane);

    state.controls = new OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.fpControls = new PointerLockControls(state.camera, state.renderer.domElement);
    state.scene.add(state.fpControls.getObject());
    state.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    if (state.isTouchDevice) initTouchControls();

    state.textureLoader = new THREE.TextureLoader();
    applyGraphicsPreset(state.graphics.preset);

    window.addEventListener('resize', onWindowResize);
    onWindowResize();
}

export function onWindowResize() {
    const { domElements, camera, renderer, labelRenderer, composer, fxaaPass, ssaoPass, bloomPass, minimapRenderer } = state;
    const w = domElements.container.clientWidth;
    const h = domElements.container.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    composer.setSize(w, h);

    const minimapWrapper = document.getElementById('minimap-renderer-wrapper');
    if (minimapWrapper && minimapRenderer) {
        minimapRenderer.setSize(minimapWrapper.clientWidth, minimapWrapper.clientHeight);
    }

    const newPixelRatio = state.graphics.resolution * window.devicePixelRatio;
    renderer.setPixelRatio(newPixelRatio);

    if (fxaaPass) {
        fxaaPass.material.uniforms['resolution'].value.set(1 / (w * newPixelRatio), 1 / (h * newPixelRatio));
    }
    if (ssaoPass) {
        ssaoPass.setSize(w, h);
    }
     if (bloomPass) {
        bloomPass.setSize(w, h);
    }
}