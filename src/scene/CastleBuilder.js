import { Cube } from './primitives/Cube.js';
import { Cylinder } from './primitives/Cylinder.js';
import { Cone } from './primitives/Cone.js';

export class CastleBuilder {
    constructor(gl, texGen, materialCallback) {
        this.gl = gl;
        this.texGen = texGen;
        this.applyMaterial = materialCallback; // function(mesh) to apply sand textures
    }

    build(scene, collidables) {
        // Clear old? Assumes empty scene or append.

        // Configuration
        const config = {
            width: 40,
            depth: 40,
            wallHeight: 3,
            wallThick: 1.0,
            towerRadius: 1.5,
            towerHeight: 6
        };

        // 1. Great Outer Walls (Rectangular Perimeter)
        this.buildPerimeter(scene, collidables, config);

        // 2. The Inner Keep (Massive structure in center)
        this.buildKeep(scene, collidables);

        // 3. Gatehouse & Bridge
        this.buildGatehouse(scene, collidables, config);
    }

    buildPerimeter(scene, collidables, cfg) {
        const halfW = cfg.width / 2;
        const halfD = cfg.depth / 2;

        // Corners - Towers
        this.createTower(scene, collidables, halfW, halfD, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, -halfW, halfD, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, halfW, -halfD, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, -halfW, -halfD, cfg.towerRadius, cfg.towerHeight);

        // Walls
        // North
        this.createWall(scene, collidables, 0, -halfD, 0, cfg.width - cfg.towerRadius * 2, cfg.wallHeight, cfg.wallThick);
        // South
        this.createWall(scene, collidables, 0, halfD, 0, cfg.width - cfg.towerRadius * 2, cfg.wallHeight, cfg.wallThick);
        // East
        this.createWall(scene, collidables, halfW, 0, 90, cfg.depth - cfg.towerRadius * 2, cfg.wallHeight, cfg.wallThick);
        // West
        this.createWall(scene, collidables, -halfW, 0, 90, cfg.depth - cfg.towerRadius * 2, cfg.wallHeight, cfg.wallThick);
    }

    buildKeep(scene, collidables) {
        // Central Keep: Tiered structure
        // Base
        const baseSize = 12;
        const baseH = 8;
        const base = new Cube(this.gl, 1);
        this.applyMaterial(base);
        base.setPosition(0, baseH / 2, 0);
        base.setScale(baseSize, baseH, baseSize);
        scene.add(base);
        collidables.push(base);

        // 2nd Tier
        const midSize = 8;
        const midH = 5;
        const mid = new Cube(this.gl, 1);
        this.applyMaterial(mid);
        mid.setPosition(0, baseH + midH / 2, 0);
        mid.setScale(midSize, midH, midSize);
        scene.add(mid);
        collidables.push(mid);

        // Top Turrets
        const topH = 4;
        const topR = 1.0;
        const offset = midSize / 2 - topR;
        this.createTower(scene, collidables, offset, offset, topR, topH, baseH + midH);
        this.createTower(scene, collidables, -offset, offset, topR, topH, baseH + midH);
        this.createTower(scene, collidables, offset, -offset, topR, topH, baseH + midH);
        this.createTower(scene, collidables, -offset, -offset, topR, topH, baseH + midH);

        // Central Spire
        const spireH = 8;
        const spireR = 2;
        this.createTower(scene, collidables, 0, 0, spireR, spireH, baseH + midH);
    }

    buildGatehouse(scene, collidables, cfg) {
        // Front Gate (South Side?)
        const z = cfg.depth / 2;
        const gap = 6;

        // Two massive towers flanking the entrance
        const gateR = 2.5;
        const gateH = 8;

        this.createTower(scene, collidables, gap / 2 + gateR, z, gateR, gateH);
        this.createTower(scene, collidables, -(gap / 2 + gateR), z, gateR, gateH);

        // Archway? Using simple cube lintel for now
        const lintel = new Cube(this.gl, 1);
        this.applyMaterial(lintel);
        lintel.setPosition(0, 5, z);
        lintel.setScale(gap + gateR * 2, 2, 2);
        scene.add(lintel);
        collidables.push(lintel);

        // Drawbridge (Extended)
        const bridgeLen = 10;
        const bridge = new Cube(this.gl, 1);
        // Special material?
        this.applyMaterial(bridge);
        bridge.baseColor = [0.6, 0.5, 0.4]; // Wood
        bridge.setPosition(0, 0.5, z + bridgeLen / 2);
        bridge.setScale(4, 0.5, bridgeLen);
        scene.add(bridge);
        collidables.push(bridge); // Walkable
    }

    createTower(scene, collidables, x, z, r, h, yBase = 0) {
        // Body
        const cyl = new Cylinder(this.gl, r, h, 32);
        this.applyMaterial(cyl);
        cyl.setPosition(x, yBase + h / 2, z);
        scene.add(cyl);
        collidables.push(cyl);

        // Roof
        const roofH = r * 1.5;
        const cone = new Cone(this.gl, r + 0.2, roofH, 32);
        this.applyMaterial(cone);
        cone.setPosition(x, yBase + h + 0.01, z); // slight offset
        scene.add(cone);
        // Roof usually not collidable for player walking, but good for blocking flying?
        collidables.push(cone);
    }

    createWall(scene, collidables, x, z, rotY, len, h, thick) {
        const wall = new Cube(this.gl, 1);
        this.applyMaterial(wall);
        wall.setPosition(x, h / 2, z);
        wall.setRotation(0, rotY, 0);
        wall.setScale(len, h, thick);
        scene.add(wall);
        collidables.push(wall);
    }
}
