import { translate } from '../utils.js';

export function displayAttributes(object) {
    const attributesDisplay = document.getElementById('object-info-content');
    attributesDisplay.innerHTML = '';
    if (!object) return;

    const isDevMode = document.body.classList.contains('developer-mode-active');
    const basicKeys = new Set(['Length', 'Width', 'Height', 'Area', 'NetVolume', 'Perimeter', 'NetSideArea', 'NetFootprintArea', 'GrossArea', 'NumberOfRiser', 'NumberOfTreads', 'RiserHeight']);

    const formatValue = (value) => (typeof value === 'number' && !Number.isInteger(value)) ? value.toFixed(3) : value;

    const buildPropertiesHTML = (data) => {
        if (!data || typeof data !== 'object') return '';
        let html = '<div class="property-list">';
        for (const [key, value] of Object.entries(data)) {
            if (value === null || value === undefined || value === '' || key.toLowerCase() === 'id') continue;
            if (typeof value === 'object' && !Array.isArray(value)) {
                html += `</div><div class="property-section" style="margin-top: 1rem; padding-left: 1rem;"><h4 class="property-section-title !mb-2">${translate(key)}</h4>${buildPropertiesHTML(value)}</div><div class="property-list">`;
            } else {
                html += `<div class="property-key">${translate(key)}</div><div class="property-value">${formatValue(value)}</div>`;
            }
        }
        return html + '</div>';
    };

    const collectedBasicProps = {};
    function findBasicProps(dataObject) {
        if (!dataObject || typeof dataObject !== 'object') return;
        for (const [key, value] of Object.entries(dataObject)) {
            if (basicKeys.has(key) && value !== null && value !== undefined && value !== '') {
                collectedBasicProps[key] = value;
            } else if (typeof value === 'object') {
                findBasicProps(value);
            }
        }
    }
    if (object.userData.ifcData) {
        findBasicProps(object.userData.ifcData);
    }

    let basicHtml = '';
    if (Object.keys(collectedBasicProps).length > 0) {
         basicHtml = `<div class="property-section"><h3 class="property-section-title">Основные характеристики</h3><div class="property-list">${Object.entries(collectedBasicProps).map(([key, value]) => `<div class="property-key">${translate(key)}</div><div class="property-value">${formatValue(value)}</div>`).join('')}</div></div>`;
    }

    let devHtml = '';
    if (isDevMode) {
        const generalInfo = { 'Имя в GLB': object.name, 'UUID (Three.js)': object.uuid, 'Тип объекта': object.type };
        devHtml += `<div class="property-section dev-mode-feature"><h3 class="property-section-title">Техническая информация</h3><div class="property-list">${Object.entries(generalInfo).map(([key, value]) => `<div class="property-key">${key}</div><div class="property-value">${value}</div>`).join('')}</div></div>`;
        if (object.userData.ifcData) {
            devHtml += `<div class="property-section dev-mode-feature"><h3 class="property-section-title">Все атрибуты IFC</h3>${buildPropertiesHTML(object.userData.ifcData)}</div>`;
        } else {
            devHtml += `<div class="property-section dev-mode-feature"><h3 class="property-section-title">Все атрибуты IFC</h3><p class="text-sm text-gray-500">Атрибуты IFC для этого объекта не найдены.</p></div>`;
        }
    }

    let finalHtml = basicHtml + devHtml;
    if (!isDevMode && Object.keys(collectedBasicProps).length === 0) {
        finalHtml += `<p style="color: var(--braun-mid-gray); margin-top: 1rem; font-size: 14px;">Основные характеристики не найдены. Включите "Режим разработчика" для просмотра всех данных.</p>`;
    }

    attributesDisplay.innerHTML = finalHtml;
}