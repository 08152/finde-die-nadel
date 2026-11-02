
/* =========================================================
   FIND THE NEEDLE
   WELT.JS
   First-Person-Spielwelt und Spielersteuerung
========================================================= */

"use strict";


/* =========================================================
   EINSTELLUNGEN
========================================================= */

const WORLD_CONFIG = {

    // Welt
    worldSize: 180,

    // Spieler
    playerHeight: 1.7,
    walkSpeed: 5.5,
    sprintSpeed: 9,
    mouseSensitivity: 0.002,

    // Spielerstart
    startX: 0,
    startZ: 9,

    // Spielfeldgrenzen
    boundary: 85,

    // Grafik
    shadows: true,
    pixelRatioLimit: 1.5

};


/* =========================================================
   GLOBALE THREE.JS-VARIABLEN
========================================================= */

let scene = null;
let camera = null;
let renderer = null;

let worldClock = null;

let worldContainer = null;

let ground = null;

let animationFrame = null;

let worldInitialized = false;


/* =========================================================
   SPIELERSTEUERUNG
========================================================= */

const PLAYER = {

    x: WORLD_CONFIG.startX,
    y: WORLD_CONFIG.playerHeight,
    z: WORLD_CONFIG.startZ,

    velocityX: 0,
    velocityZ: 0,

    yaw: 0,
    pitch: 0,

    forward: false,
    backward: false,
    left: false,
    right: false,

    sprint: false,

    pointerLocked: false,

    moving: false

};


const PLAYER_KEYS = new Set([

    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ShiftLeft",
    "ShiftRight"

]);


/* =========================================================
   HILFSFUNKTIONEN
========================================================= */

function worldMaterial(color, roughness = 1) {

    return new THREE.MeshStandardMaterial({

        color: color,

        roughness: roughness,

        metalness: 0

    });

}


function worldRandom(min, max) {

    return min + Math.random() * (max - min);

}


/* =========================================================
   SZENE ERSTELLEN
========================================================= */

function createWorldScene() {

    scene = new THREE.Scene();

    scene.name = "FIND_THE_NEEDLE_WORLD";

    scene.background = new THREE.Color(0x9bd9ff);

    scene.fog = new THREE.FogExp2(
        0x9bd9ff,
        0.0035
    );

    worldContainer = new THREE.Group();

    worldContainer.name = "WORLD_OBJECTS";

    scene.add(worldContainer);

    // Wichtig für heu.js und verkauf.js

    window.scene = scene;

}


/* =========================================================
   KAMERA
========================================================= */

function createWorldCamera() {

    camera = new THREE.PerspectiveCamera(

        75,

        window.innerWidth / window.innerHeight,

        0.1,

        250

    );

    camera.position.set(

        PLAYER.x,
        PLAYER.y,
        PLAYER.z

    );

    camera.rotation.order = "YXZ";

    scene.add(camera);

    // Wichtig für heu.js und verkauf.js

    window.camera = camera;

}


/* =========================================================
   RENDERER
========================================================= */

function createWorldRenderer() {

    renderer = new THREE.WebGLRenderer({

        antialias: true,

        powerPreference: "high-performance",

        alpha: false

    });

    renderer.setSize(

        window.innerWidth,
        window.innerHeight

    );

    renderer.setPixelRatio(

        Math.min(

            window.devicePixelRatio || 1,

            WORLD_CONFIG.pixelRatioLimit

        )

    );

    renderer.shadowMap.enabled =
        WORLD_CONFIG.shadows;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.15;

    const container =
        document.getElementById("game-container");

    if (!container) {

        throw new Error(
            "game-container wurde nicht gefunden."
        );

    }

    container.innerHTML = "";

    container.appendChild(renderer.domElement);

    renderer.domElement.id = "game-canvas";

    renderer.domElement.style.display = "block";

    renderer.domElement.style.width = "100%";

    renderer.domElement.style.height = "100%";

    // Wichtig für heu.js

    window.renderer = renderer;

}


/* =========================================================
   HIMMEL UND LICHT
========================================================= */

function createWorldLighting() {

    // Grundbeleuchtung

    const ambient = new THREE.HemisphereLight(

        0xd8edff,

        0x647d36,

        1.7

    );

    scene.add(ambient);


    // Sonne

    const sunlight = new THREE.DirectionalLight(

        0xfff1cf,

        2.3

    );

    sunlight.position.set(

        -35,
        65,
        25

    );

    sunlight.castShadow = WORLD_CONFIG.shadows;

    sunlight.shadow.mapSize.width = 1024;

    sunlight.shadow.mapSize.height = 1024;

    sunlight.shadow.camera.left = -45;

    sunlight.shadow.camera.right = 45;

    sunlight.shadow.camera.top = 45;

    sunlight.shadow.camera.bottom = -45;

    sunlight.shadow.camera.near = 1;

    sunlight.shadow.camera.far = 140;

    sunlight.shadow.bias = -0.0003;

    scene.add(sunlight);


    // Schwache Füllbeleuchtung

    const fill = new THREE.DirectionalLight(

        0xffffff,

        0.35

    );

    fill.position.set(

        25,
        15,
        -30

    );

    scene.add(fill);

}


/* =========================================================
   BODEN
========================================================= */

function createGround() {

    const geometry = new THREE.PlaneGeometry(

        WORLD_CONFIG.worldSize,
        WORLD_CONFIG.worldSize,
        1,
        1

    );

    const material = new THREE.MeshStandardMaterial({

        color: 0x579b36,

        roughness: 1,

        metalness: 0

    });

    ground = new THREE.Mesh(

        geometry,
        material

    );

    ground.name = "MEADOW_GROUND";

    ground.rotation.x = -Math.PI / 2;

    ground.position.y = -0.04;

    ground.receiveShadow = true;

    worldContainer.add(ground);

}


/* =========================================================
   GRASDEKORATION
========================================================= */

function createGrassDecoration() {

    const grassGeometry = new THREE.ConeGeometry(

        0.045,
        0.23,
        3

    );

    grassGeometry.translate(0, 0.115, 0);

    const grassMaterial = new THREE.MeshStandardMaterial({

        color: 0x78b83e,

        roughness: 1

    });

    const grassCount = 1600;

    const grassMesh = new THREE.InstancedMesh(

        grassGeometry,

        grassMaterial,

        grassCount

    );

    grassMesh.name = "MEADOW_GRASS";

    grassMesh.frustumCulled = false;

    const dummy = new THREE.Object3D();

    const color = new THREE.Color();

    for (let i = 0; i < grassCount; i++) {

        const x = worldRandom(

            -WORLD_CONFIG.worldSize / 2,
            WORLD_CONFIG.worldSize / 2

        );

        const z = worldRandom(

            -WORLD_CONFIG.worldSize / 2,
            WORLD_CONFIG.worldSize / 2

        );

        // Freie Fläche rund um den Spielerstart

        if (Math.abs(x) < 2 && Math.abs(z - 9) < 2) {

            continue;

        }

        dummy.position.set(

            x,
            0,
            z

        );

        dummy.rotation.y = worldRandom(

            0,
            Math.PI * 2

        );

        const scale = worldRandom(0.6, 1.5);

        dummy.scale.set(

            scale,
            scale,
            scale

        );

        dummy.updateMatrix();

        grassMesh.setMatrixAt(

            i,
            dummy.matrix

        );

        color.setHSL(

            worldRandom(0.22, 0.30),
            worldRandom(0.35, 0.65),
            worldRandom(0.30, 0.47)

        );

        grassMesh.setColorAt(

            i,
            color

        );

    }

    grassMesh.instanceMatrix.needsUpdate = true;

    if (grassMesh.instanceColor) {

        grassMesh.instanceColor.needsUpdate = true;

    }

    worldContainer.add(grassMesh);

}


/* =========================================================
   ENTFERNTE HÜGEL
========================================================= */

function createDistantHills() {

    const hillMaterial = worldMaterial(0x669b4d);

    const hillPositions = [

        [-55, -20, -65, 28, 15, 18],

        [-25, -15, -75, 35, 18, 20],

        [20, -17, -70, 32, 17, 18],

        [58, -20, -60, 30, 15, 20],

        [-65, -20, 35, 35, 18, 25],

        [60, -20, 40, 32, 17, 25]

    ];

    for (const values of hillPositions) {

        const hill = new THREE.Mesh(

            new THREE.SphereGeometry(1, 16, 12),

            hillMaterial

        );

        hill.position.set(

            values[0],
            values[1],
            values[2]

        );

        hill.scale.set(

            values[3],
            values[4],
            values[5]

        );

        hill.receiveShadow = true;

        worldContainer.add(hill);

    }

}


/* =========================================================
   DEKORATIVE BÄUME
========================================================= */

function createTree(x, z, scale = 1) {

    const tree = new THREE.Group();

    const trunkMaterial = worldMaterial(0x704525);

    const leafMaterial = worldMaterial(0x347c32);


    const trunk = new THREE.Mesh(

        new THREE.CylinderGeometry(

            0.22 * scale,
            0.32 * scale,
            2.3 * scale,
            7

        ),

        trunkMaterial

    );

    trunk.position.y = 1.15 * scale;

    trunk.castShadow = true;

    tree.add(trunk);


    const crown = new THREE.Mesh(

        new THREE.SphereGeometry(

            1.3 * scale,
            9,
            7

        ),

        leafMaterial

    );

    crown.position.y = 2.7 * scale;

    crown.scale.set(

        1,
        1.1,
        1

    );

    crown.castShadow = true;

    tree.add(crown);


    tree.position.set(x, 0, z);

    worldContainer.add(tree);

}


function createTrees() {

    const positions = [

        [-22, -20, 1.3],
        [-29, -12, 1.1],
        [-35, 8, 1.4],
        [-27, 22, 1.2],

        [24, -23, 1.3],
        [32, -15, 1.1],
        [37, 7, 1.4],
        [28, 25, 1.2],

        [-48, -40, 1.5],
        [-35, -48, 1.3],
        [42, -45, 1.5],
        [55, -30, 1.2],

        [-55, 30, 1.4],
        [50, 35, 1.5]

    ];

    for (const p of positions) {

        createTree(

            p[0],
            p[1],
            p[2]

        );

    }

}


/* =========================================================
   SPIELERPOSITION AKTUALISIEREN
========================================================= */

function updatePlayerPosition() {

    camera.position.set(

        PLAYER.x,
        PLAYER.y,
        PLAYER.z

    );

    camera.rotation.order = "YXZ";

    camera.rotation.y = PLAYER.yaw;

    camera.rotation.x = PLAYER.pitch;

}


/* =========================================================
   MAUSSTEUERUNG
========================================================= */

function requestMouseLock() {

    if (!renderer) return;

    if (document.pointerLockElement === renderer.domElement) {

        return;

    }

    renderer.domElement.requestPointerLock?.();

}


function onPointerLockChange() {

    PLAYER.pointerLocked =

        document.pointerLockElement ===
        renderer.domElement;

}


function onMouseMove(event) {

    if (!PLAYER.pointerLocked) return;

    PLAYER.yaw -=

        event.movementX *
        WORLD_CONFIG.mouseSensitivity;

    PLAYER.pitch -=

        event.movementY *
        WORLD_CONFIG.mouseSensitivity;


    // Blick nach oben/unten begrenzen

    const limit = Math.PI / 2 - 0.05;

    PLAYER.pitch = Math.max(

        -limit,

        Math.min(limit, PLAYER.pitch)

    );


    updatePlayerPosition();

}


/* =========================================================
   TASTATUR
========================================================= */

function onWorldKeyDown(event) {

    if (PLAYER_KEYS.has(event.code)) {

        event.preventDefault();

    }

    switch (event.code) {

        case "KeyW":

            PLAYER.forward = true;

            break;

        case "KeyS":

            PLAYER.backward = true;

            break;

        case "KeyA":

            PLAYER.left = true;

            break;

        case "KeyD":

            PLAYER.right = true;

            break;

        case "ShiftLeft":
        case "ShiftRight":

            PLAYER.sprint = true;

            break;

    }

}


function onWorldKeyUp(event) {

    switch (event.code) {

        case "KeyW":

            PLAYER.forward = false;

            break;

        case "KeyS":

            PLAYER.backward = false;

            break;

        case "KeyA":

            PLAYER.left = false;

            break;

        case "KeyD":

            PLAYER.right = false;

            break;

        case "ShiftLeft":
        case "ShiftRight":

            PLAYER.sprint = false;

            break;

    }

}


function onWorldBlur() {

    PLAYER.forward = false;

    PLAYER.backward = false;

    PLAYER.left = false;

    PLAYER.right = false;

    PLAYER.sprint = false;

}


/* =========================================================
   SPIELERBEWEGUNG
========================================================= */

function updatePlayerMovement(deltaTime) {

    if (!PLAYER.pointerLocked) {

        PLAYER.velocityX = 0;

        PLAYER.velocityZ = 0;

        PLAYER.moving = false;

        return;

    }


    let moveForward = 0;

    let moveSide = 0;


    if (PLAYER.forward) {

        moveForward += 1;

    }

    if (PLAYER.backward) {

        moveForward -= 1;

    }

    if (PLAYER.right) {

        moveSide += 1;

    }

    if (PLAYER.left) {

        moveSide -= 1;

    }


    const length = Math.hypot(

        moveForward,

        moveSide

    );


    if (length > 0) {

        moveForward /= length;

        moveSide /= length;

    }


    PLAYER.moving = length > 0;


    const speed = PLAYER.sprint

        ? WORLD_CONFIG.sprintSpeed

        : WORLD_CONFIG.walkSpeed;


    /*
       Vorwärtsrichtung anhand der Kamera berechnen.
    */

    const forwardX = -Math.sin(PLAYER.yaw);

    const forwardZ = -Math.cos(PLAYER.yaw);


    const rightX = Math.cos(PLAYER.yaw);

    const rightZ = -Math.sin(PLAYER.yaw);


    const directionX =

        forwardX * moveForward +

        rightX * moveSide;


    const directionZ =

        forwardZ * moveForward +

        rightZ * moveSide;


    PLAYER.velocityX = directionX * speed;

    PLAYER.velocityZ = directionZ * speed;


    const nextX =

        PLAYER.x + PLAYER.velocityX * deltaTime;


    const nextZ =

        PLAYER.z + PLAYER.velocityZ * deltaTime;


    /*
       Weltgrenzen
    */

    PLAYER.x = Math.max(

        -WORLD_CONFIG.boundary,

        Math.min(

            WORLD_CONFIG.boundary,

            nextX

        )

    );


    PLAYER.z = Math.max(

        -WORLD_CONFIG.boundary,

        Math.min(

            WORLD_CONFIG.boundary,

            nextZ

        )

    );


    updatePlayerPosition();

}


/* =========================================================
   MAUSKLICK / POINTER LOCK
========================================================= */

function registerWorldControls() {

    const canvas = renderer.domElement;


    canvas.addEventListener(

        "click",

        () => {

            if (!PLAYER.pointerLocked) {

                requestMouseLock();

            }

        }

    );


    document.addEventListener(

        "pointerlockchange",

        onPointerLockChange

    );


    document.addEventListener(

        "mousemove",

        onMouseMove

    );


    document.addEventListener(

        "keydown",

        onWorldKeyDown

    );


    document.addEventListener(

        "keyup",

        onWorldKeyUp

    );


    window.addEventListener(

        "blur",

        onWorldBlur

    );


    window.addEventListener(

        "resize",

        resizeWorld

    );

}


/* =========================================================
   RESIZE
========================================================= */

function resizeWorld() {

    if (!camera || !renderer) return;

    camera.aspect =

        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(

        window.innerWidth,
        window.innerHeight

    );

    renderer.setPixelRatio(

        Math.min(

            window.devicePixelRatio || 1,

            WORLD_CONFIG.pixelRatioLimit

        )

    );

}


/* =========================================================
   ANIMATIONS-SCHLEIFE
========================================================= */

function animateWorld() {

    animationFrame = requestAnimationFrame(

        animateWorld

    );


    if (!worldInitialized) return;


    const deltaTime = Math.min(

        worldClock.getDelta(),

        0.05

    );


    updatePlayerMovement(deltaTime);


    /*
       Verkaufstisch aktualisieren.
    */

    if (typeof window.updateSaleTable === "function") {

        window.updateSaleTable(deltaTime);

    }


    /*
       Szene rendern.
    */

    renderer.render(

        scene,

        camera

    );

}


/* =========================================================
   WELT INITIALISIEREN
========================================================= */

async function initWorld() {

    if (worldInitialized) return;


    if (typeof THREE === "undefined") {

        throw new Error(
            "Three.js ist nicht verfügbar."
        );

    }


    console.log(
        "FIND THE NEEDLE: Welt wird erstellt ..."
    );


    // Szene

    createWorldScene();


    // Kamera

    createWorldCamera();


    // Renderer

    createWorldRenderer();


    // Licht

    createWorldLighting();


    // Boden

    createGround();


    // Gras

    createGrassDecoration();


    // Hügel

    createDistantHills();


    // Bäume

    createTrees();


    // Spieler

    updatePlayerPosition();


    // Steuerung

    registerWorldControls();


    // Uhr

    worldClock = new THREE.Clock();


    // Welt fertig

    worldInitialized = true;


    // Globale Variablen für andere Module

    window.scene = scene;

    window.camera = camera;

    window.renderer = renderer;


    // Animation starten

    animateWorld();


    console.log(
        "FIND THE NEEDLE: Welt bereit."
    );

}


/* =========================================================
   GLOBALE FUNKTIONEN
========================================================= */

window.initWorld = initWorld;

window.resizeWorld = resizeWorld;

window.updatePlayerMovement = updatePlayerMovement;

window.WORLD_CONFIG = WORLD_CONFIG;

window.PLAYER = PLAYER;


/* =========================================================
   ENDE
========================================================= */
