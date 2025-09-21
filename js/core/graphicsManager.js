import { state } from '../state.js';

const SHADOW_MAP_SIZES = {
    off: 0,
    low: 512,
    medium: 1024,
    high: 2048,
};

const PRESETS = {
    low:    { resolution: 0.5,  shadows: 'low',    fxaa: false, ssao: false, bloom: false },
    medium: { resolution: 0.75, shadows: 'medium', fxaa: true,  ssao: true,  bloom: false },
    high:   { resolution: 1.0,  shadows: 'high',   fxaa: true,  ssao: true,  bloom: true  },
    ultra:  { resolution: 1.0,  shadows: 'high',   fxaa: true,  ssao: true,  bloom: true  },
};

/**
 * Применяет выбранный пресет графики.
 * @param {string} presetName - Название пресета.
 */
export function applyGraphicsPreset(presetName) {
    const settings = PRESETS[presetName];
    if (!settings) return;

    state.graphics.preset = presetName;
    Object.assign(state.graphics, settings);

    applyAllCurrentSettings();
}

/**
 * Применяет индивидуальную настройку разрешения рендера.
 * @param {number|string} value - Значение от 0.5 до 1.0.
 */
export function setResolution(value) {
    state.graphics.preset = 'custom';
    state.graphics.resolution = parseFloat(value);

    if (state.renderer) {
        const newPixelRatio = state.graphics.resolution * window.devicePixelRatio;
        state.renderer.setPixelRatio(newPixelRatio);

        const w = state.domElements.container.clientWidth;
        const h = state.domElements.container.clientHeight;
        if (state.fxaaPass) {
            state.fxaaPass.material.uniforms['resolution'].value.set(1 / (w * newPixelRatio), 1 / (h * newPixelRatio));
        }
    }
}

/**
 * Применяет настройку качества теней.
 * @param {string} quality - Качество ('off', 'low', 'medium', 'high').
 */
export function setShadowQuality(quality) {
    state.graphics.preset = 'custom';
    state.graphics.shadows = quality;

    if (!state.directionalLight) return;

    state.directionalLight.castShadow = quality !== 'off';
    if (quality !== 'off') {
        const mapSize = SHADOW_MAP_SIZES[quality];
        state.directionalLight.shadow.mapSize.set(mapSize, mapSize);
        if (state.directionalLight.shadow.map) {
             state.directionalLight.shadow.map.dispose();
             state.directionalLight.shadow.map = null;
        }
    }
}

/**
 * Включает или выключает сглаживание FXAA.
 * @param {boolean} enabled
 */
export function toggleFXAA(enabled) {
    state.graphics.preset = 'custom';
    state.graphics.fxaa = enabled;
    if (state.fxaaPass) state.fxaaPass.enabled = enabled;
}

/**
 * Включает или выключает SSAO.
 * @param {boolean} enabled
 */
export function toggleSSAO(enabled) {
    state.graphics.preset = 'custom';
    state.graphics.ssao = enabled;
    if (state.ssaoPass) state.ssaoPass.enabled = enabled;
}

/**
 * Включает или выключает Bloom.
 * @param {boolean} enabled
 */
export function toggleBloom(enabled) {
    state.graphics.preset = 'custom';
    state.graphics.bloom = enabled;
    if (state.bloomPass) state.bloomPass.enabled = enabled;
}

/**
 * Применяет все текущие настройки из state.
 */
function applyAllCurrentSettings() {
    setResolution(state.graphics.resolution);
    setShadowQuality(state.graphics.shadows);
    toggleFXAA(state.graphics.fxaa);
    toggleSSAO(state.graphics.ssao);
    toggleBloom(state.graphics.bloom);
}