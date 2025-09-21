import { state } from '../state.js';
import { handleIgjUpload, applyFilter } from '../core/modelManager.js';
import { setMode, savePoint, cancelPoint, editPoint, promptDeletePoint, deletePoint, handleImageFiles } from '../core/interactionManager.js';
import { applyGraphicsPreset, setResolution, setShadowQuality, toggleFXAA, toggleSSAO, toggleBloom } from '../core/graphicsManager.js';
import { displayAttributes } from './attributeManager.js';

export function showSidePanel(contentType) {
    state.domElements.sidePanel.classList.add('is-open');
    document.body.classList.add('panel-is-open');
    document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));

    let targetSectionId, title = "Информация";
    switch(contentType) {
        case 'object-info':
            targetSectionId = 'object-info-content';
            displayAttributes(state.selectedObject);
            break;
        case 'comments':
            title = "Заметки";
            targetSectionId = 'comments-content';
            updateCommentsList();
            break;
        case 'filters':
            title = "Фильтры";
            targetSectionId = 'filters-content';
            break;
        case 'add-point':
            title = state.currentlyEditingPointId ? "Редактировать заметку" : "Добавить заметку";
            targetSectionId = 'add-point-content';
            break;
    }

    if (targetSectionId) {
        document.getElementById(targetSectionId).classList.add('active');
        document.getElementById('panel-title').textContent = title;
    }
}

export function hideSidePanel() {
    state.domElements.sidePanel.classList.remove('is-open');
    document.body.classList.remove('panel-is-open');
}

function showGraphicsPanel() {
    updateGraphicsUIFromState();
    state.domElements.graphicsPanel.classList.remove('hidden');
}

function hideGraphicsPanel() {
    state.domElements.graphicsPanel.classList.add('hidden');
}

export function updateGraphicsUIFromState() {
    if (!state.graphics) return;
    const { graphics } = state;
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.preset === graphics.preset));
    document.getElementById('resolution-slider').value = graphics.resolution;
    document.getElementById('resolution-value').textContent = `${Math.round(graphics.resolution * 100)}%`;
    document.getElementById('shadow-quality-select').value = graphics.shadows;
    document.getElementById('fxaa-toggle').checked = graphics.fxaa;
    document.getElementById('ssao-toggle').checked = graphics.ssao;
    document.getElementById('bloom-toggle').checked = graphics.bloom;
}

export function updateCommentsList() {
    const listContainer = document.getElementById('comments-content');
    listContainer.innerHTML = '';
    if (state.placedPoints.length === 0) {
        listContainer.innerHTML = '<p class="no-comments-placeholder">Заметок пока нет.</p>';
        return;
    }
    const statusColors = { open: 'var(--status-open)', progress: 'var(--status-progress)', resolved: 'var(--status-resolved)' };
    const defectTypeTexts = { crack: 'Трещина', spall: 'Скол', leak: 'Протечка', corrosion: 'Коррозия арматуры', other: 'Другое' };

    state.placedPoints.forEach(point => {
        const card = document.createElement('div');
        card.className = 'comment-card';
        let imagesHTML = point.images && point.images.length > 0 ? `<div class="comment-card-images">${point.images.map(imgData => `<img src="${imgData}" class="img-preview comment-thumbnail" alt="Attachment">`).join('')}</div>` : '';

        card.innerHTML = `
            <div class="comment-card-header">
                <div>
                    <p class="comment-card-id">${point.id}</p>
                    <p class="comment-card-type">${defectTypeTexts[point.defectType]}</p>
                </div>
                <div class="status-dot" style="background-color: ${statusColors[point.status]};"></div>
            </div>
            <div class="comment-card-body">
                <p>${point.comment || 'Нет комментария.'}</p>
                <div class="comment-card-row"><span class="comment-card-label">Объект:</span><span class="comment-card-value">${point.objectName}</span></div>
                <div class="comment-card-row"><span class="comment-card-label">Ответственный:</span><span class="comment-card-value">${point.responsible || 'Не назначен'}</span></div>
                ${imagesHTML}
            </div>
            <div class="comment-card-actions">
                <button class="action-btn edit-point-btn" title="Редактировать"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="action-btn delete-point-btn" title="Удалить"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
            </div>`;

        card.querySelector('.comment-card-header').addEventListener('click', () => {
            hideSidePanel();
            const targetPosition = point.marker.position.clone();
            const direction = new THREE.Vector3().subVectors(state.camera.position, state.controls.target).normalize();
            state.camera.position.copy(targetPosition).addScaledVector(direction, 3);
            state.controls.target.copy(targetPosition);
        });
        card.querySelectorAll('.comment-thumbnail').forEach(thumb => thumb.addEventListener('click', (e) => {
            e.stopPropagation();
            state.domElements.fullscreenImg.src = e.target.src;
            state.domElements.imageViewer.classList.remove('hidden');
        }));
        card.querySelector('.edit-point-btn').addEventListener('click', (e) => { e.stopPropagation(); editPoint(point.internalId); });
        card.querySelector('.delete-point-btn').addEventListener('click', (e) => { e.stopPropagation(); promptDeletePoint(point.internalId); });
        listContainer.appendChild(card);
    });
}

export function setupUI() {
    document.getElementById('igj-input').addEventListener('change', handleIgjUpload);
    document.getElementById('measure-btn').addEventListener('click', () => setMode(state.currentMode === 'measuring' ? 'navigate' : 'measuring'));
    document.getElementById('filters-btn').addEventListener('click', () => showSidePanel('filters'));
    document.getElementById('graphics-btn').addEventListener('click', showGraphicsPanel);

    document.getElementById('dev-mode-checkbox').addEventListener('change', (e) => {
        document.body.classList.toggle('developer-mode-active', e.target.checked);
        if (state.selectedObject && state.domElements.sidePanel.classList.contains('is-open')) {
            displayAttributes(state.selectedObject);
        }
    });

    document.getElementById('minimap-header').addEventListener('click', () => {
        state.domElements.minimapContainer.classList.toggle('collapsed');
    });

    document.getElementById('set-spawn-btn').addEventListener('click', (e) => {
        if (state.isFirstPersonMode) return;
        state.isSettingSpawnPoint = !state.isSettingSpawnPoint;
        e.currentTarget.classList.toggle('active', state.isSettingSpawnPoint);
        state.domElements.container.style.cursor = state.isSettingSpawnPoint ? 'crosshair' : 'default';
        if (state.isSettingSpawnPoint) setMode('navigate');
    });

    state.domElements.addPointBtn.addEventListener('click', () => {
        if (state.isSettingSpawnPoint) {
            state.isSettingSpawnPoint = false;
            document.getElementById('set-spawn-btn').classList.remove('active');
        }
        setMode(state.currentMode === 'placing-point' ? 'navigate' : 'placing-point');
    });

    document.getElementById('save-point-btn').addEventListener('click', savePoint);
    document.getElementById('cancel-point-btn').addEventListener('click', cancelPoint);
    document.getElementById('comments-btn').addEventListener('click', () => showSidePanel('comments'));
    document.getElementById('image-input').addEventListener('change', handleImageFiles);
    document.getElementById('close-panel-btn').addEventListener('click', () => {
        hideSidePanel();
        if(state.currentMode === 'placing-point') setMode('navigate');
    });

    state.domElements.imageViewer.addEventListener('click', () => state.domElements.imageViewer.classList.add('hidden'));
    document.getElementById('cancel-delete-btn').addEventListener('click', () => state.domElements.confirmationModal.classList.add('hidden'));
    document.getElementById('confirm-delete-btn').addEventListener('click', deletePoint);

    document.getElementById('close-graphics-panel-btn').addEventListener('click', hideGraphicsPanel);
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyGraphicsPreset(btn.dataset.preset);
            updateGraphicsUIFromState();
        });
    });
    document.getElementById('resolution-slider').addEventListener('input', (e) => {
        setResolution(parseFloat(e.target.value));
        updateGraphicsUIFromState();
    });
    document.getElementById('shadow-quality-select').addEventListener('change', (e) => {
        setShadowQuality(e.target.value);
        updateGraphicsUIFromState();
    });
    document.getElementById('fxaa-toggle').addEventListener('change', (e) => toggleFXAA(e.target.checked));
    document.getElementById('ssao-toggle').addEventListener('change', (e) => toggleSSAO(e.target.checked));
    document.getElementById('bloom-toggle').addEventListener('change', (e) => toggleBloom(e.target.checked));

    const voiceBtn = document.getElementById('voice-input-btn');
    if (state.recognition) {
        voiceBtn.addEventListener('click', () => voiceBtn.classList.contains('recording') ? state.recognition.stop() : state.recognition.start());
        state.recognition.onstart = () => voiceBtn.classList.add('recording');
        state.recognition.onend = () => voiceBtn.classList.remove('recording');
        state.recognition.onresult = (e) => { document.getElementById('comment-input').value += (document.getElementById('comment-input').value ? ' ' : '') + e.results[0][0].transcript; };
    } else {
        voiceBtn.style.display = 'none';
    }
}

export function buildFilterUI() {
    const container = state.domElements.filtersContent;
    container.innerHTML = '<p>Выберите этаж для отображения.</p>';
    const group = document.createElement('div');
    group.className = 'filter-group';

    const showAllBtn = document.createElement('button');
    showAllBtn.textContent = 'Показать всё';
    showAllBtn.className = 'filter-btn active';
    showAllBtn.onclick = () => {
        applyFilter('all');
        document.querySelectorAll('.filter-btn.active').forEach(b => b.classList.remove('active'));
        showAllBtn.classList.add('active');
    };
    group.appendChild(showAllBtn);

    for (const name in state.storeyData.storeys) {
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.className = 'filter-btn';
        btn.onclick = () => {
            applyFilter(name);
            document.querySelectorAll('.filter-btn.active').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        group.appendChild(btn);
    }
    container.appendChild(group);
}
