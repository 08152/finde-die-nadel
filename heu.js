
/* =====================================================
   FIND THE NEEDLE
   HEU-SYSTEM
   100.000 EINZELNE HEUHALME
===================================================== */

"use strict";


/* =====================================================
   EINSTELLUNGEN
===================================================== */

const HAY_CONFIG = {

    // Anzahl der Heuhalme
    count: 100000,

    // Größe des Heuhaufens
    width: 12,
    depth: 10,
    height: 4.5,

    // Position des Heuhaufens
    x: 0,
    y: 0,
    z: -8,

    // Größe der Halme
    minHeight: 0.12,
    maxHeight: 0.42,

    minWidth: 0.018,
    maxWidth: 0.045,

    // Sammelreichweite
    collectDistance: 4.5,

    // Farben
    colors: [
        0xc99a3b,
        0xd5a747,
        0xe2b954,
        0xb9872e,
        0xf0ca70,
        0xc18c32,
        0xe5bd5b
    ],

    // Wie viele Halme beim Sammeln verschwinden
    collectAmount: 1

};


/* =====================================================
   INTERNE DATEN
===================================================== */

let hayScene = null;
let hayCamera = null;
let hayRenderer = null;

let hayMesh = null;
let needleMesh = null;

let hayGeometry = null;
let hayMaterial = null;

let hayRaycaster = null;

let hayDummy = null;

let hayInitialized = false;

let hayCollected = 0;

let hayInstanceData = [];

let hayRemaining = HAY_CONFIG.count;

let needleInstanceId = -1;

let needleFound = false;

let hayClickCooldown = false;


/* =====================================================
   ZUFALL
===================================================== */

function hayRandom(min, max) {

    return min + Math.random() * (max - min);

}


function hayRandomInt(max) {

    return Math.floor(Math.random() * max);

}


/* =====================================================
   SZENE FINDEN
===================================================== */

function getHayScene() {

    return window.scene
        || window.worldScene
        || window.gameScene
        || window.THREE_SCENE
        || null;

}


function getHayCamera() {

    return window.camera
        || window.worldCamera
        || window.playerCamera
        || window.gameCamera
        || null;

}


function getHayRenderer() {

    return window.renderer
        || window.worldRenderer
        || window.gameRenderer
        || null;

}


/* =====================================================
   POSITION EINES HEUHALMS
===================================================== */

function getHayPosition() {

    /*
       Die Halme liegen innerhalb eines großen,
       kuppelförmigen Heuhaufens.
    */

    let x;
    let z;
    let y;

    while (true) {

        x = hayRandom(
            -HAY_CONFIG.width / 2,
            HAY_CONFIG.width / 2
        );

        z = hayRandom(
            -HAY_CONFIG.depth / 2,
            HAY_CONFIG.depth / 2
        );

        const nx = x / (HAY_CONFIG.width / 2);
        const nz = z / (HAY_CONFIG.depth / 2);

        const distance = nx * nx + nz * nz;

        if (distance <= 1) {

            const domeHeight =
                Math.sqrt(1 - distance) *
                HAY_CONFIG.height;

            y = hayRandom(0, domeHeight);

            break;

        }

    }

    return {

        x: HAY_CONFIG.x + x,

        y: HAY_CONFIG.y + y,

        z: HAY_CONFIG.z + z

    };

}


/* =====================================================
   GEOMETRIE
===================================================== */

function createHayGeometry() {

    /*
       Ein einzelner gebogener Heuhalm.
       Die Geometrie wird anschließend 100.000-mal
       als Instanz dargestellt.
    */

    const positions = [

        // Untere Spitze
        0, 0, 0,

        // Mitte links
        -0.5, 0.45, 0,

        // Mitte rechts
        0.5, 0.45, 0,

        // Obere Spitze
        0.15, 1, 0

    ];

    const indices = [

        0, 1, 2,

        1, 3, 2

    ];

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    return geometry;

}


/* =====================================================
   MATERIAL
===================================================== */

function createHayMaterial() {

    return new THREE.MeshStandardMaterial({

        color: 0xffffff,

        side: THREE.DoubleSide,

        roughness: 0.95,

        metalness: 0,

        vertexColors: true

    });

}


/* =====================================================
   EINZELNE HALME ERSTELLEN
===================================================== */

function createHayInstances() {

    hayGeometry = createHayGeometry();

    hayMaterial = createHayMaterial();

    hayMesh = new THREE.InstancedMesh(
        hayGeometry,
        hayMaterial,
        HAY_CONFIG.count
    );

    hayMesh.name = "HAY_100000";

    hayMesh.frustumCulled = false;

    hayMesh.instanceMatrix.setUsage(
        THREE.DynamicDrawUsage
    );

    hayDummy = new THREE.Object3D();

    const color = new THREE.Color();

    hayInstanceData = new Array(HAY_CONFIG.count);

    for (let i = 0; i < HAY_CONFIG.count; i++) {

        const position = getHayPosition();

        const height = hayRandom(
            HAY_CONFIG.minHeight,
            HAY_CONFIG.maxHeight
        );

        const width = hayRandom(
            HAY_CONFIG.minWidth,
            HAY_CONFIG.maxWidth
        );

        const rotation = hayRandom(0, Math.PI * 2);

        hayDummy.position.set(
            position.x,
            position.y,
            position.z
        );

        hayDummy.rotation.set(
            hayRandom(-0.2, 0.2),
            rotation,
            hayRandom(-0.15, 0.15)
        );

        hayDummy.scale.set(
            width,
            height,
            width
        );

        hayDummy.updateMatrix();

        hayMesh.setMatrixAt(
            i,
            hayDummy.matrix
        );

        const baseColor = HAY_CONFIG.colors[
            hayRandomInt(HAY_CONFIG.colors.length)
        ];

        color.setHex(baseColor);

        // Kleine natürliche Farbunterschiede
        color.multiplyScalar(
            hayRandom(0.88, 1.12)
        );

        hayMesh.setColorAt(
            i,
            color
        );

        hayInstanceData[i] = {

            active: true,

            x: position.x,

            y: position.y,

            z: position.z,

            height: height,

            width: width

        };

    }

    hayMesh.instanceMatrix.needsUpdate = true;

    if (hayMesh.instanceColor) {

        hayMesh.instanceColor.needsUpdate = true;

    }

    hayScene.add(hayMesh);

}


/* =====================================================
   NADEL ERZEUGEN
===================================================== */

function createNeedle() {

    /*
       Die Nadel liegt zufällig zwischen den Halmen.
       Sie ist klein und metallisch.
    */

    needleInstanceId = hayRandomInt(
        HAY_CONFIG.count
    );

    const data = hayInstanceData[needleInstanceId];

    const geometry = new THREE.CylinderGeometry(
        0.009,
        0.009,
        0.32,
        6
    );

    const material = new THREE.MeshStandardMaterial({

        color: 0xe2e7ee,

        metalness: 0.95,

        roughness: 0.16

    });

    needleMesh = new THREE.Mesh(
        geometry,
        material
    );

    needleMesh.name = "HIDDEN_NEEDLE";

    needleMesh.position.set(
        data.x,
        data.y + 0.08,
        data.z
    );

    needleMesh.rotation.set(
        Math.PI / 2,
        hayRandom(0, Math.PI),
        0
    );

    /*
       Die Nadel wird zunächst unsichtbar gehalten.
       Sie wird sichtbar, wenn der entsprechende
       Halm eingesammelt wird.
    */

    needleMesh.visible = false;

    hayScene.add(needleMesh);

}


/* =====================================================
   EINEN HALM ENTFERNEN
===================================================== */

function removeHayInstance(instanceId) {

    if (instanceId < 0) return false;

    if (instanceId >= hayInstanceData.length) return false;

    const data = hayInstanceData[instanceId];

    if (!data || !data.active) return false;

    data.active = false;

    /*
       Instanz auf Größe 0 setzen.
       Der Halm verschwindet dadurch.
    */

    hayDummy.position.set(
        data.x,
        data.y,
        data.z
    );

    hayDummy.rotation.set(0, 0, 0);

    hayDummy.scale.set(0, 0, 0);

    hayDummy.updateMatrix();

    hayMesh.setMatrixAt(
        instanceId,
        hayDummy.matrix
    );

    hayMesh.instanceMatrix.needsUpdate = true;

    hayRemaining--;

    return true;

}


/* =====================================================
   NADEL FINDEN
===================================================== */

function findNeedle() {

    if (needleFound) return;

    needleFound = true;

    if (needleMesh) {

        needleMesh.visible = true;

    }

    if (typeof window.winGame === "function") {

        window.winGame();

    }

}


/* =====================================================
   HEU SAMMELN
===================================================== */

function collectHayInstance(instanceId) {

    if (needleFound) return;

    if (instanceId === undefined || instanceId === null) {
        return;
    }

    if (instanceId < 0) return;

    const data = hayInstanceData[instanceId];

    if (!data || !data.active) return;

    const game = window.GAME;

    if (!game) return;

    /*
       Die Nadel wird beim Einsammeln des
       zugehörigen Heuhalms gefunden.
    */

    if (instanceId === needleInstanceId) {

        removeHayInstance(instanceId);

        findNeedle();

        return;

    }

    /*
       Prüfen, ob der Beutel voll ist.
    */

    if (game.hay >= game.maxHay) {

        if (typeof window.showNotification === "function") {

            window.showNotification(
                "Dein Beutel ist voll! Geh zum Verkaufstisch."
            );

        }

        return;

    }

    /*
       Halm entfernen.
    */

    if (!removeHayInstance(instanceId)) return;

    /*
       Beutel erhöhen.
    */

    if (typeof window.onHayCollected === "function") {

        window.onHayCollected(1);

    } else {

        game.hay++;

        if (typeof window.updateUI === "function") {

            window.updateUI();

        }

    }

    hayCollected++;

}


/* =====================================================
   RAYCASTING
===================================================== */

function createHayRaycaster() {

    hayRaycaster = new THREE.Raycaster();

    hayRaycaster.far = HAY_CONFIG.collectDistance;

}


/* =====================================================
   KAMERA-RAYCAST
===================================================== */

function getCenterRay() {

    if (!hayCamera) return null;

    hayRaycaster.setFromCamera(

        new THREE.Vector2(0, 0),

        hayCamera

    );

    return hayRaycaster;

}


/* =====================================================
   HEU MIT FADENKREUZ TREFFEN
===================================================== */

function collectTargetHay() {

    if (!hayInitialized) return;

    if (!hayMesh) return;

    if (needleFound) return;

    const raycaster = getCenterRay();

    if (!raycaster) return;

    /*
       Nur den Heuhaufen prüfen.
       Das spart unnötige Berechnungen.
    */

    const hits = raycaster.intersectObject(
        hayMesh,
        false
    );

    if (!hits.length) return;

    const hit = hits[0];

    if (hit.instanceId === undefined) return;

    collectHayInstance(hit.instanceId);

}


/* =====================================================
   MAUSKLICK
===================================================== */

function handleHayClick(event) {

    if (!hayInitialized) return;

    if (!window.GAME || !window.GAME.started) return;

    if (window.GAME.won) return;

    if (event.button !== 0) return;

    /*
       Keine Sammlung, wenn auf ein UI-Element
       geklickt wird.
    */

    const target = event.target;

    if (
        target.closest &&
        target.closest(
            "#game-ui, #loading-screen, #victory-screen"
        )
    ) {

        return;

    }

    if (hayClickCooldown) return;

    hayClickCooldown = true;

    collectTargetHay();

    setTimeout(() => {

        hayClickCooldown = false;

    }, 100);

}


/* =====================================================
   KLICK-EVENT REGISTRIEREN
===================================================== */

function registerHayClick() {

    const canvas =
        hayRenderer && hayRenderer.domElement
            ? hayRenderer.domElement
            : document.getElementById("game-container");

    if (!canvas) return;

    canvas.addEventListener(
        "pointerdown",
        handleHayClick
    );

}


/* =====================================================
   HEU-SYSTEM INITIALISIEREN
===================================================== */

async function initHay() {

    if (hayInitialized) return;

    if (typeof THREE === "undefined") {

        throw new Error(
            "Three.js ist nicht geladen."
        );

    }

    hayScene = getHayScene();

    hayCamera = getHayCamera();

    hayRenderer = getHayRenderer();

    if (!hayScene) {

        throw new Error(
            "Keine Three.js-Szene gefunden. Prüfe welt.js."
        );

    }

    if (!hayCamera) {

        throw new Error(
            "Keine Kamera gefunden. Prüfe welt.js."
        );

    }

    createHayRaycaster();

    /*
       Heuhaufen erstellen.
    */

    createHayInstances();

    /*
       Nadel zufällig verstecken.
    */

    createNeedle();

    /*
       Klicksystem starten.
    */

    registerHayClick();

    hayInitialized = true;

    console.log(
        "Heu-System bereit:",
        HAY_CONFIG.count,
        "Halme"
    );

    console.log(
        "Versteckte Nadel:",
        needleInstanceId
    );

}


/* =====================================================
   STATUS / DEBUG
===================================================== */

function getHayStatus() {

    return {

        initialized: hayInitialized,

        total: HAY_CONFIG.count,

        remaining: hayRemaining,

        collected: hayCollected,

        needleFound: needleFound,

        needleInstanceId: needleInstanceId

    };

}


/* =====================================================
   GLOBALE FUNKTIONEN
===================================================== */

window.initHay = initHay;

window.collectTargetHay = collectTargetHay;

window.collectHayInstance = collectHayInstance;

window.getHayStatus = getHayStatus;

window.HAY_CONFIG = HAY_CONFIG;


/* =====================================================
   ENDE
===================================================== */
