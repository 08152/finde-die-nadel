
(() => {
    "use strict";

    // ==========================================
    // FIND THE NEEDLE - HEU SYSTEM
    // ==========================================

    const HEU_CONFIG = {
        count: 100000,

        center: {
            x: 0,
            y: 0,
            z: -8
        },

        radiusX: 6,
        radiusZ: 5,
        height: 4.5,

        minLength: 0.35,
        maxLength: 0.85,

        minThickness: 0.045,
        maxThickness: 0.085,

        texture: "1.png",

        collectionDistance: 4.5
    };

    let hayMesh = null;
    let needleMesh = null;
    let hayGeometry = null;
    let hayMaterial = null;
    let needleInstanceId = -1;

    let hayInstanceData = [];
    let collectedCount = 0;

    let raycaster = null;
    let initialized = false;

    // ==========================================
    // ZUFALL
    // ==========================================

    function random(min, max) {
        return min + Math.random() * (max - min);
    }

    // ==========================================
    // HEUPOSITION
    // ==========================================

    function getHayPosition() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random());

        const x = Math.cos(angle) * radius * HEU_CONFIG.radiusX;
        const z = Math.sin(angle) * radius * HEU_CONFIG.radiusZ;

        const normalizedX = x / HEU_CONFIG.radiusX;
        const normalizedZ = z / HEU_CONFIG.radiusZ;

        const distance = normalizedX * normalizedX +
                         normalizedZ * normalizedZ;

        const domeHeight = Math.sqrt(
            Math.max(0, 1 - distance)
        ) * HEU_CONFIG.height;

        const y = random(0, Math.max(0.08, domeHeight));

        return new THREE.Vector3(
            HEU_CONFIG.center.x + x,
            HEU_CONFIG.center.y + y,
            HEU_CONFIG.center.z + z
        );
    }

    // ==========================================
    // BLOCK-GEOMETRIE
    // ==========================================

    function createHayGeometry() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        return geometry;
    }

    // ==========================================
    // TEXTUR LADEN
    // ==========================================

    function createHayMaterial() {
        const loader = new THREE.TextureLoader();

        const texture = loader.load(
            HEU_CONFIG.texture,
            () => console.log("Heutextur geladen: 1.png"),
            undefined,
            () => console.warn(
                "1.png konnte nicht geladen werden. Verwende Ersatzfarbe."
            )
        );

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);

        return new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            roughness: 1,
            metalness: 0
        });
    }

    // ==========================================
    // INSTANZIERTE HEUHALME ERSTELLEN
    // ==========================================

    function createHayStack() {
        const scene = window.scene;

        if (!scene) {
            throw new Error("Three.js Szene nicht gefunden!");
        }

        hayGeometry = createHayGeometry();
        hayMaterial = createHayMaterial();

        hayMesh = new THREE.InstancedMesh(
            hayGeometry,
            hayMaterial,
            HEU_CONFIG.count
        );

        hayMesh.name = "Heuhaufen";
        hayMesh.frustumCulled = false;
        hayMesh.castShadow = true;
        hayMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();

        hayInstanceData = new Array(HEU_CONFIG.count);

        for (let i = 0; i < HEU_CONFIG.count; i++) {
            const position = getHayPosition();

            const length = random(
                HEU_CONFIG.minLength,
                HEU_CONFIG.maxLength
            );

            const thickness = random(
                HEU_CONFIG.minThickness,
                HEU_CONFIG.maxThickness
            );

            // Länglicher Block
            dummy.position.copy(position);

            // Alle drei Rotationsachsen zufällig
            dummy.rotation.set(
                random(0, Math.PI * 2),
                random(0, Math.PI * 2),
                random(0, Math.PI * 2)
            );

            dummy.scale.set(
                thickness,
                thickness,
                length
            );

            dummy.updateMatrix();

            hayMesh.setMatrixAt(i, dummy.matrix);

            // Kleine Farbabweichungen für mehr Natürlichkeit
            const variation = random(0.82, 1.0);

            hayMesh.setColorAt(
                i,
                new THREE.Color(
                    variation,
                    variation * 0.88,
                    variation * 0.48
                )
            );

            hayInstanceData[i] = {
                position: position.clone(),
                length,
                thickness,
                active: true
            };
        }

        hayMesh.instanceMatrix.needsUpdate = true;

        if (hayMesh.instanceColor) {
            hayMesh.instanceColor.needsUpdate = true;
        }

        scene.add(hayMesh);

        console.log(
            HEU_CONFIG.count + " Heuhalme erstellt."
        );
    }

    // ==========================================
    // NADEL ERSTELLEN
    // ==========================================

    function createNeedle() {
        const scene = window.scene;

        needleInstanceId = Math.floor(
            Math.random() * HEU_CONFIG.count
        );

        const needleData = hayInstanceData[needleInstanceId];

        const geometry = new THREE.CylinderGeometry(
            0.018,
            0.018,
            0.65,
            8
        );

        const material = new THREE.MeshStandardMaterial({
            color: 0x999999,
            metalness: 0.85,
            roughness: 0.25
        });

        needleMesh = new THREE.Mesh(geometry, material);

        needleMesh.name = "Versteckte_Nadel";
        needleMesh.position.copy(needleData.position);
        needleMesh.rotation.z = Math.PI / 2;
        needleMesh.visible = false;

        scene.add(needleMesh);
    }

    // ==========================================
    // HALM ENTFERNEN
    // ==========================================

    function removeHayInstance(index) {
        if (!hayMesh || !hayInstanceData[index]) {
            return;
        }

        const data = hayInstanceData[index];

        if (!data.active) {
            return;
        }

        data.active = false;

        const dummy = new THREE.Object3D();

        // Instanz außerhalb der Welt platzieren
        dummy.position.set(0, -10000, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();

        hayMesh.setMatrixAt(index, dummy.matrix);
        hayMesh.instanceMatrix.needsUpdate = true;

        collectedCount++;
    }

    // ==========================================
    // NADEL GEFUNDEN
    // ==========================================

    function findNeedle() {
        if (window.GAME && window.GAME.won) {
            return;
        }

        console.log("NADEL GEFUNDEN!");

        if (needleMesh) {
            needleMesh.visible = true;
        }

        if (typeof window.winGame === "function") {
            window.winGame();
        }
    }

    // ==========================================
    // HEU EINSAMMELN
    // ==========================================

    function collectHayInstance(index) {
        if (!hayInstanceData[index]) {
            return false;
        }

        if (!hayInstanceData[index].active) {
            return false;
        }

        // Ist das die Nadel?
        if (index === needleInstanceId) {
            removeHayInstance(index);
            findNeedle();
            return true;
        }

        // Tasche voll?
        if (
            window.GAME &&
            window.GAME.hay >= window.GAME.maxHay
        ) {
            if (typeof window.showNotification === "function") {
                window.showNotification(
                    "Dein Sack ist voll! Verkaufe dein Heu."
                );
            }

            return false;
        }

        removeHayInstance(index);

        if (typeof window.onHayCollected === "function") {
            window.onHayCollected(1);
        }

        return true;
    }

    // ==========================================
    // ZIEL-HEU MIT RAYCASTER FINDEN
    // ==========================================

    function collectTargetHay() {
        if (!hayMesh || !window.camera) {
            return false;
        }

        if (window.GAME && window.GAME.won) {
            return false;
        }

        raycaster.setFromCamera(
            new THREE.Vector2(0, 0),
            window.camera
        );

        raycaster.far = HEU_CONFIG.collectionDistance;

        const hits = raycaster.intersectObject(hayMesh);

        if (hits.length === 0) {
            return false;
        }

        const hit = hits[0];

        if (hit.instanceId === undefined) {
            return false;
        }

        return collectHayInstance(hit.instanceId);
    }

    // ==========================================
    // MAUSKLICK
    // ==========================================

    function registerHayControls() {
        if (!window.renderer) {
            return;
        }

        const canvas = window.renderer.domElement;

        canvas.addEventListener("pointerdown", event => {
            if (event.button !== 0) {
                return;
            }

            if (
                !window.GAME ||
                !window.GAME.started ||
                window.GAME.won
            ) {
                return;
            }

            collectTargetHay();
        });
    }

    // ==========================================
    // INITIALISIERUNG
    // ==========================================

    async function initHay() {
        if (initialized) {
            return;
        }

        if (!window.THREE && typeof THREE === "undefined") {
            throw new Error("Three.js wurde nicht geladen!");
        }

        if (!window.scene || !window.camera || !window.renderer) {
            throw new Error(
                "Welt nicht bereit! Erst welt.js initialisieren."
            );
        }

        raycaster = new THREE.Raycaster();

        console.log("Erstelle Heuhaufen ...");

        createHayStack();
        createNeedle();
        registerHayControls();

        initialized = true;

        console.log("Heusystem bereit!");
    }

    // ==========================================
    // ÖFFENTLICHE FUNKTIONEN
    // ==========================================

    window.initHay = initHay;
    window.collectTargetHay = collectTargetHay;
    window.collectHayInstance = collectHayInstance;

    window.HEU_CONFIG = HEU_CONFIG;

    window.getHayStats = function() {
        return {
            total: HEU_CONFIG.count,
            collected: collectedCount,
            remaining: HEU_CONFIG.count - collectedCount,
            needleIndex: needleInstanceId
        };
    };

})();
