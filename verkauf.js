
/* =====================================================
   FIND THE NEEDLE
   VERKAUFSTISCH
===================================================== */

"use strict";


/* =====================================================
   EINSTELLUNGEN
===================================================== */

const SALE_CONFIG = {

    // Position des Verkaufstisches
    x: 0,
    y: 0,
    z: 4,

    // Größe
    width: 2.8,
    height: 1.1,
    depth: 1.7,

    // Abstand zum Verkaufen
    interactionDistance: 3.2,

    // Verkaufspreis pro Halm
    pricePerHay: 0.01

};


/* =====================================================
   INTERNE VARIABLEN
===================================================== */

let saleScene = null;

let saleCamera = null;

let saleTable = null;

let saleBox = null;

let saleSign = null;

let saleInitialized = false;

let salePlayerNear = false;

let saleInteractionCooldown = false;

let saleAnimationTime = 0;


/* =====================================================
   SZENE FINDEN
===================================================== */

function getSaleScene() {

    return window.scene
        || window.worldScene
        || window.gameScene
        || window.THREE_SCENE
        || null;

}


function getSaleCamera() {

    return window.camera
        || window.worldCamera
        || window.playerCamera
        || window.gameCamera
        || null;

}


/* =====================================================
   MATERIALIEN
===================================================== */

function saleMaterial(color, roughness = 0.85) {

    return new THREE.MeshStandardMaterial({

        color: color,

        roughness: roughness,

        metalness: 0

    });

}


/* =====================================================
   WÜRFEL ERSTELLEN
===================================================== */

function saleBoxGeometry(

    width,
    height,
    depth,
    material,
    x,
    y,
    z

) {

    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.position.set(x, y, z);

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    return mesh;

}


/* =====================================================
   TISCHPLATTE
===================================================== */

function createSaleTableTop() {

    const wood = saleMaterial(0x92552d);

    const darkWood = saleMaterial(0x61371e);

    const top = saleBoxGeometry(

        SALE_CONFIG.width,
        0.18,
        SALE_CONFIG.depth,

        wood,

        0,
        SALE_CONFIG.height,
        0

    );

    saleTable.add(top);


    // Holzstreifen auf der Oberseite

    for (let i = 0; i < 7; i++) {

        const plank = saleBoxGeometry(

            SALE_CONFIG.width - 0.08,
            0.025,
            0.025,

            darkWood,

            0,
            SALE_CONFIG.height + 0.105,
            -0.7 + i * 0.23

        );

        saleTable.add(plank);

    }

}


/* =====================================================
   TISCHBEINE
===================================================== */

function createSaleTableLegs() {

    const wood = saleMaterial(0x71401f);

    const legHeight = SALE_CONFIG.height;

    const legWidth = 0.17;

    const xOffset = SALE_CONFIG.width / 2 - 0.2;

    const zOffset = SALE_CONFIG.depth / 2 - 0.2;


    const positions = [

        [-xOffset, legHeight / 2, -zOffset],

        [xOffset, legHeight / 2, -zOffset],

        [-xOffset, legHeight / 2, zOffset],

        [xOffset, legHeight / 2, zOffset]

    ];


    for (const position of positions) {

        const leg = saleBoxGeometry(

            legWidth,
            legHeight,
            legWidth,

            wood,

            position[0],
            position[1],
            position[2]

        );

        saleTable.add(leg);

    }

}


/* =====================================================
   VERKAUFSKISTE
===================================================== */

function createSaleBox() {

    const yellow = saleMaterial(0xe9ad32);

    const dark = saleMaterial(0x9b651c);

    saleBox = new THREE.Group();

    saleBox.position.set(

        0,
        SALE_CONFIG.height + 0.12,
        0

    );


    // Unterer Kasten

    const body = saleBoxGeometry(

        1.3,
        0.45,
        0.85,

        yellow,

        0,
        0.22,
        0

    );

    saleBox.add(body);


    // Vorderer dunkler Streifen

    const frontStripe = saleBoxGeometry(

        1.32,
        0.09,
        0.035,

        dark,

        0,
        0.22,
        0.44

    );

    saleBox.add(frontStripe);


    // Hinterer Streifen

    const backStripe = saleBoxGeometry(

        1.32,
        0.09,
        0.035,

        dark,

        0,
        0.22,
        -0.44

    );

    saleBox.add(backStripe);


    // Linke Seite

    const leftStripe = saleBoxGeometry(

        0.035,
        0.09,
        0.85,

        dark,

        -0.65,
        0.22,
        0

    );

    saleBox.add(leftStripe);


    // Rechte Seite

    const rightStripe = saleBoxGeometry(

        0.035,
        0.09,
        0.85,

        dark,

        0.65,
        0.22,
        0

    );

    saleBox.add(rightStripe);


    saleTable.add(saleBox);

}


/* =====================================================
   SCHILD
===================================================== */

function createSaleSign() {

    saleSign = new THREE.Group();

    const dark = saleMaterial(0x282828);

    const white = saleMaterial(0xffffff);

    // Schildplatte

    const board = saleBoxGeometry(

        1.75,
        0.55,
        0.09,

        dark,

        0,
        0,
        0

    );

    saleSign.add(board);


    // Schildrahmen

    const frameMaterial = saleMaterial(0xffd447);

    const top = saleBoxGeometry(

        1.85,
        0.07,
        0.12,

        frameMaterial,

        0,
        0.31,
        0

    );

    const bottom = saleBoxGeometry(

        1.85,
        0.07,
        0.12,

        frameMaterial,

        0,
        -0.31,
        0

    );

    saleSign.add(top);

    saleSign.add(bottom);


    // Text auf dem Schild

    const canvas = document.createElement("canvas");

    canvas.width = 512;

    canvas.height = 160;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#282828";

    ctx.fillRect(0, 0, 512, 160);

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.font = "bold 62px Arial";

    ctx.lineWidth = 8;

    ctx.strokeStyle = "#000000";

    ctx.strokeText("HEU VERKAUF", 256, 80);

    ctx.fillStyle = "#ffe15b";

    ctx.fillText("HEU VERKAUF", 256, 80);


    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    const textMaterial = new THREE.MeshBasicMaterial({

        map: texture,

        transparent: false

    });


    const textMesh = new THREE.Mesh(

        new THREE.PlaneGeometry(1.65, 0.5),

        textMaterial

    );

    textMesh.position.z = 0.055;

    saleSign.add(textMesh);


    // Schild auf dem Tisch platzieren

    saleSign.position.set(

        0,

        SALE_CONFIG.height + 1.15,

        -0.65

    );

    saleSign.rotation.x = -0.08;

    saleTable.add(saleSign);

}


/* =====================================================
   VERKAUFSTISCH ERSTELLEN
===================================================== */

function createSaleTable() {

    saleTable = new THREE.Group();

    saleTable.name = "SALE_TABLE";

    saleTable.position.set(

        SALE_CONFIG.x,

        SALE_CONFIG.y,

        SALE_CONFIG.z

    );


    createSaleTableTop();

    createSaleTableLegs();

    createSaleBox();

    createSaleSign();


    saleScene.add(saleTable);

}


/* =====================================================
   SPIELERPOSITION
===================================================== */

function getSalePlayerPosition() {

    if (!saleCamera) return null;

    return saleCamera.position;

}


/* =====================================================
   ENTFERNUNG ZUM TISCH
===================================================== */

function getSaleDistance() {

    const playerPosition = getSalePlayerPosition();

    if (!playerPosition) return Infinity;


    const tablePosition = new THREE.Vector3(

        SALE_CONFIG.x,

        SALE_CONFIG.y,

        SALE_CONFIG.z

    );


    const playerXZ = new THREE.Vector2(

        playerPosition.x,

        playerPosition.z

    );


    const tableXZ = new THREE.Vector2(

        tablePosition.x,

        tablePosition.z

    );


    return playerXZ.distanceTo(tableXZ);

}


/* =====================================================
   INTERAKTION ANZEIGEN
===================================================== */

function updateSaleInteraction() {

    if (!saleInitialized) return;

    if (!window.GAME || !window.GAME.started) return;


    const distance = getSaleDistance();

    const isNear = distance <= SALE_CONFIG.interactionDistance;


    if (isNear !== salePlayerNear) {

        salePlayerNear = isNear;

    }


    const hint = document.getElementById("sell-hint");

    const interaction = document.getElementById("interaction-ui");

    if (hint) {

        hint.classList.toggle(

            "visible",

            salePlayerNear && window.GAME.hay > 0

        );

    }


    if (interaction) {

        interaction.classList.toggle(

            "visible",

            salePlayerNear

        );

        if (salePlayerNear) {

            const description = document.getElementById(
                "interaction-description"
            );

            const title = document.getElementById(
                "interaction-title"
            );

            if (title) {

                title.textContent = "VERKAUFSTISCH";

            }

            if (description) {

                description.textContent =
                    window.GAME.hay > 0
                        ? "Drücke E, um dein Heu zu verkaufen"
                        : "Sammle zuerst etwas Heu";

            }

        }

    }

}


/* =====================================================
   HEU VERKAUFEN
===================================================== */

function trySellHay() {

    if (!saleInitialized) return false;

    if (!window.GAME) return false;

    if (window.GAME.won) return false;


    // Spieler muss nahe genug sein

    const distance = getSaleDistance();

    if (distance > SALE_CONFIG.interactionDistance) {

        return false;

    }


    if (saleInteractionCooldown) return false;


    const game = window.GAME;

    if (game.hay <= 0) {

        if (typeof window.showNotification === "function") {

            window.showNotification(
                "Du hast noch kein Heu gesammelt!"
            );

        }

        return false;

    }


    saleInteractionCooldown = true;


    // Anzahl der Halme sichern

    const amount = game.hay;


    // Verkauf berechnen

    const earnings = Math.round(

        amount * SALE_CONFIG.pricePerHay * 100

    ) / 100;


    // Beutel leeren

    game.hay = 0;


    // Geld hinzufügen

    game.money = Math.round(

        (game.money + earnings) * 100

    ) / 100;


    // Interface aktualisieren

    if (typeof window.updateUI === "function") {

        window.updateUI();

    }


    if (typeof window.showNotification === "function") {

        window.showNotification(

            amount + " Halme verkauft! +" +

            earnings.toFixed(2).replace(".", ",") +

            " €"

        );

    }


    // Kiste kurz animieren

    animateSaleBox();


    setTimeout(() => {

        saleInteractionCooldown = false;

    }, 700);


    return true;

}


/* =====================================================
   VERKAUFSANIMATION
===================================================== */

function animateSaleBox() {

    if (!saleBox) return;

    const startY = saleBox.position.y;

    const startTime = performance.now();

    const duration = 300;


    function animate(now) {

        const progress = Math.min(

            1,

            (now - startTime) / duration

        );


        const bounce = Math.sin(

            progress * Math.PI

        ) * 0.12;


        saleBox.position.y = startY + bounce;


        if (progress < 1) {

            requestAnimationFrame(animate);

        } else {

            saleBox.position.y = startY;

        }

    }


    requestAnimationFrame(animate);

}


/* =====================================================
   UPDATE
===================================================== */

function updateSaleTable(deltaTime = 0.016) {

    if (!saleInitialized) return;

    if (!window.GAME || !window.GAME.started) return;


    saleAnimationTime += deltaTime;


    updateSaleInteraction();

}


/* =====================================================
   INITIALISIERUNG
===================================================== */

function initSaleTable() {

    if (saleInitialized) return;

    if (typeof THREE === "undefined") {

        throw new Error(
            "Three.js ist nicht geladen."
        );

    }


    saleScene = getSaleScene();

    saleCamera = getSaleCamera();


    if (!saleScene) {

        throw new Error(
            "Keine Szene gefunden. Prüfe welt.js."
        );

    }


    if (!saleCamera) {

        throw new Error(
            "Keine Kamera gefunden. Prüfe welt.js."
        );

    }


    createSaleTable();


    saleInitialized = true;


    console.log(
        "Verkaufstisch erstellt."
    );


    // Regelmäßige Distanzprüfung

    setInterval(() => {

        updateSaleInteraction();

    }, 100);

}


/* =====================================================
   GLOBALE FUNKTIONEN
===================================================== */

window.initSaleTable = initSaleTable;

window.trySellHay = trySellHay;

window.updateSaleTable = updateSaleTable;

window.SALE_CONFIG = SALE_CONFIG;


/* =====================================================
   ENDE
===================================================== */
