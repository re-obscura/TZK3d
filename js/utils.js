import * as THREE from 'three';

export const TEXTURES = {
    'бетон': {
        map: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Concrete/Bare/48591/ConcreteBare0237_1_S.jpg',
        normalMap: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Concrete/Bare/48591/ConcreteBare0237_1_N.jpg',
        roughnessMap: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Concrete/Bare/48591/ConcreteBare0237_1_S.jpg',
    },
    'дерев': {
        map: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Wood/Planks/Clean/23402/WoodPlanksClean0001_1_S.jpg',
        normalMap: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Wood/Planks/Clean/23402/WoodPlanksClean0001_1_N.jpg',
        roughnessMap: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Wood/Planks/Clean/23402/WoodPlanksClean0001_1_S.jpg',
    },
    'кирпич': {
        map: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Brick/Modern/113883/BricksModern0299_1_S.jpg',
        normalMap: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Brick/Modern/113883/BricksModern0299_1_N.jpg',
        roughnessMap: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Brick/Modern/113883/BricksModern0299_1_S.jpg',
    },
    'металл': {
        map: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Metal/Bare/113645/MetalBare0212_1_S.jpg',
        normalMap: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Metal/Bare/113645/MetalBare0212_1_N.jpg',
        roughnessMap: 'https://img.gs/bbdkhfbzkk/256x256,quality=medium/http://www.textures.com/system/gallery/photos/Metal/Bare/113645/MetalBare0212_1_S.jpg',
        metalness: 0.8,
    },
    'стекло': {
        color: 0xadd8e6,
        transmission: 1.0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.2,
    },
    'пвх': {
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.0,
    }
};

const TRANSLATIONS = {
    "Name": "Имя", "IfcType": "Тип IFC", "Properties": "Свойства", "id": "ID", "Pset_BeamCommon": "Балка: Общие параметры",
    "Qto_BeamBaseQuantities": "Балка: Количественные характеристики", "Pset_WallCommon": "Стена: Общие параметры",
    "Qto_WallBaseQuantities": "Стена: Количественные характеристики", "Pset_ColumnCommon": "Колонна: Общие параметры",
    "Qto_ColumnBaseQuantities": "Колонна: Количественные характеристики", "Pset_SlabCommon": "Плита: Общие параметры",
    "Qto_SlabBaseQuantities": "Плита: Количественные характеристики", "Pset_ReinforcementBarPitchOfWall": "Стена: Шаг арматуры",
    "Pset_DoorCommon": "Дверь: Общие параметры", "Qto_DoorBaseQuantities": "Дверь: Количественные характеристики",
    "Pset_WindowCommon": "Окно: Общие параметры", "Qto_WindowBaseQuantities": "Окно: Количественные характеристики",
    "Pset_RailingCommon": "Ограждение: Общие параметры", "Qto_RailingBaseQuantities": "Ограждение: Количественные характеристики",
    "Pset_RoofCommon": "Кровля: Общие параметры", "Qto_RoofBaseQuantities": "Кровля: Количественные характеристики",
    "Pset_ReinforcementBarPitchOfSlab": "Плита: Шаг арматуры", "Pset_StairFlightCommon": "Лестничный марш: Общие параметры",
    "Qto_StairFlightBaseQuantities": "Лестничный марш: Количественные характеристики", "Pset_OpeningElementCommon": "Проем: Общие параметры",
    "Qto_OpeningElementBaseQuantities": "Проем: Количественные характеристики", "Pset_BuildingCommon": "Здание: Общие параметры",
    "Pset_BuildingStoreyCommon": "Этаж: Общие параметры", "Pset_SiteCommon": "Площадка: Общие параметры",
    "Door Lining Properties": "Свойства коробки двери", "Распашное": "Распашное", "Фрамуга": "Фрамуга", "Нижний подвес": "Нижний подвес",
    "Боковой и нижний подвес": "Поворотно-откидное", "FireRating": "Класс огнестойкости", "Reference": "Марка / Артикул",
    "Roll": "Угол поворота", "CrossSectionArea": "Площадь сечения", "Length": "Длина", "NetVolume": "Чистый объем", "NetWeight": "Чистый вес",
    "OuterSurfaceArea": "Площадь внешней поверхности", "Height": "Высота", "NetFootprintArea": "Чистая площадь основания",
    "NetSideArea": "Чистая боковая площадь", "Width": "Ширина", "Area": "Площадь", "Perimeter": "Периметр", "Description": "Описание",
    "LiningDepth": "Глубина коробки", "LiningThickness": "Толщина коробки", "LiningOffset": "Смещение коробки", "PanelDepth": "Толщина полотна",
    "PanelOperation": "Тип открывания", "PanelWidth": "Ширина полотна", "PanelPosition": "Расположение полотна",
    "ThermalTransmittance": "Коэф. теплопередачи", "TransomThickness": "Толщина фрамуги", "TransomOffset": "Смещение фрамуги",
    "MullionThickness": "Толщина импоста", "OperationType": "Тип операции", "FrameDepth": "Глубина рамы", "FrameThickness": "Толщина рамы",
    "HasSillExternal": "Внешний подоконник", "HasSillInternal": "Внутренний подоконник", "GrossArea": "Общая площадь",
    "NumberOfRiser": "Кол-во подступенков", "NumberOfTreads": "Кол-во ступеней", "RiserHeight": "Высота подступенка",
    "BarAllocationType": "Тип армирования", "BuildingID": "ID Здания",
};

export const translate = (key) => TRANSLATIONS[key] || key;

export function ifcGuidToUuid(ifcGuid) {
    const base64Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
    if (ifcGuid.length !== 22) return null;
    let num = BigInt(0);
    for (let i = 0; i < ifcGuid.length; i++) {
        const index = base64Chars.indexOf(ifcGuid[i]);
        if (index === -1) return null;
        num = (num * BigInt(64)) + BigInt(index);
    }
    let hex = num.toString(16).padStart(32, '0');
    const p0 = hex.substring(0, 8); const p1 = hex.substring(8, 12); const p2 = hex.substring(12, 16);
    const p3 = hex.substring(16, 20); const p4 = hex.substring(20, 32);
    return `${p0}-${p1}-${p2}-${p3}-${p4}`.toLowerCase();
}

export function zoomToExtents(state) {
    if (!state.model) return;
    animateCameraToObject(state.model, state, true);
}

export function animateCameraToObject(targetObject, state, isExtents = false) {
    const PADDING_FACTOR = 1.25;

    const sidePanelWidth = 380;
    const isPanelOpen = !isExtents && document.body.classList.contains('panel-is-open');
    const canvas = state.renderer.domElement;
    const effectiveWidth = canvas.clientWidth - (isPanelOpen ? sidePanelWidth : 0);
    const effectiveHeight = canvas.clientHeight;
    const effectiveAspect = effectiveWidth / effectiveHeight;

    const box = new THREE.Box3().setFromObject(targetObject);
    const center = box.getCenter(new THREE.Vector3());

    const viewDirection = new THREE.Vector3().subVectors(state.camera.position, center).normalize();
    if (viewDirection.lengthSq() === 0) {
        viewDirection.z = 1;
    }

    const viewX = new THREE.Vector3().crossVectors(state.camera.up, viewDirection).normalize();
    if (viewX.lengthSq() === 0) { // Edge case for looking straight up or down
        viewX.set(1, 0, 0);
    }
    const viewY = new THREE.Vector3().crossVectors(viewDirection, viewX).normalize();

    const corners = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];

    let minProjX = Infinity, maxProjX = -Infinity;
    let minProjY = Infinity, maxProjY = -Infinity;

    for (const corner of corners) {
        const relativeCorner = corner.clone().sub(center);
        const projX = relativeCorner.dot(viewX);
        const projY = relativeCorner.dot(viewY);

        minProjX = Math.min(minProjX, projX);
        maxProjX = Math.max(maxProjX, projX);
        minProjY = Math.min(minProjY, projY);
        maxProjY = Math.max(maxProjY, projY);
    }

    const projectedWidth = maxProjX - minProjX;
    const projectedHeight = maxProjY - minProjY;

    const verticalFovRad = state.camera.fov * (Math.PI / 180);
    const horizontalFovRad = 2 * Math.atan(Math.tan(verticalFovRad / 2) * effectiveAspect);

    const distForHeight = (projectedHeight / 2) / Math.tan(verticalFovRad / 2);
    const distForWidth = (projectedWidth / 2) / Math.tan(horizontalFovRad / 2);

    const distance = Math.max(distForHeight, distForWidth) * PADDING_FACTOR;

    const endPos = new THREE.Vector3().copy(center).addScaledVector(viewDirection, distance);

    state.cameraAnimation.startPos = state.camera.position.clone();
    state.cameraAnimation.endPos = endPos;
    state.cameraAnimation.startTarget = state.controls.target.clone();
    state.cameraAnimation.endTarget = center;
    state.cameraAnimation.startTime = performance.now();
    state.cameraAnimation.active = true;
}

export function calculateDistanceToNearestEdge(intersect) {
    const obj = intersect.object;
    const face = intersect.face;
    const geometry = obj.geometry;
    const pointLocal = obj.worldToLocal(intersect.point.clone());
    const positionAttribute = geometry.attributes.position;
    const va = new THREE.Vector3().fromBufferAttribute(positionAttribute, face.a);
    const vb = new THREE.Vector3().fromBufferAttribute(positionAttribute, face.b);
    const vc = new THREE.Vector3().fromBufferAttribute(positionAttribute, face.c);
    const edge1 = new THREE.Line3(va, vb);
    const edge2 = new THREE.Line3(vb, vc);
    const edge3 = new THREE.Line3(vc, va);
    const closestPoint = new THREE.Vector3();
    const d1 = edge1.closestPointToPoint(pointLocal, true, closestPoint).distanceTo(pointLocal);
    const d2 = edge2.closestPointToPoint(pointLocal, true, closestPoint).distanceTo(pointLocal);
    const d3 = edge3.closestPointToPoint(pointLocal, true, closestPoint).distanceTo(pointLocal);
    return Math.min(d1, d2, d3) * obj.scale.x;
}