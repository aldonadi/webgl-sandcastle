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
        // Configuration
        const config = {
            width: 60,
            depth: 60,
            wallHeight: 4,
            wallThick: 1.5,
            towerRadius: 2.0,
            towerHeight: 8,
            parapetHeight: 0.6,
            parapetSize: 0.5,
            parapetGap: 0.5
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

        // Corners - Towers (4)
        this.createTower(scene, collidables, halfW, halfD, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, -halfW, halfD, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, halfW, -halfD, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, -halfW, -halfD, cfg.towerRadius, cfg.towerHeight);

        // Mid-Point Towers (4 more -> Total 8 on perimeter)
        this.createTower(scene, collidables, 0, halfD, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, 0, -halfD, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, halfW, 0, cfg.towerRadius, cfg.towerHeight);
        this.createTower(scene, collidables, -halfW, 0, cfg.towerRadius, cfg.towerHeight);

        // Walls with Parapets
        const cornerOffset = cfg.towerRadius;
        // North (split by mid tower)
        this.createWallSection(scene, collidables, -halfW + cornerOffset, -halfD, -cornerOffset, -halfD, cfg); // Left
        this.createWallSection(scene, collidables, cornerOffset, -halfD, halfW - cornerOffset, -halfD, cfg); // Right

        // South (split by mid tower)
        this.createWallSection(scene, collidables, -halfW + cornerOffset, halfD, -cornerOffset, halfD, cfg);
        this.createWallSection(scene, collidables, cornerOffset, halfD, halfW - cornerOffset, halfD, cfg);

        // East
        this.createWallSection(scene, collidables, halfW, -halfD + cornerOffset, halfW, -cornerOffset, cfg);
        this.createWallSection(scene, collidables, halfW, cornerOffset, halfW, halfD - cornerOffset, cfg);

        // West
        this.createWallSection(scene, collidables, -halfW, -halfD + cornerOffset, -halfW, -cornerOffset, cfg);
        this.createWallSection(scene, collidables, -halfW, cornerOffset, -halfW, halfD - cornerOffset, cfg);
    }

    createWallSection(scene, collidables, x1, z1, x2, z2, cfg) {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz) * (180 / Math.PI); // Rotation around Y

        const mx = (x1 + x2) / 2;
        const mz = (z1 + z2) / 2;

        // Main Wall Block
        const wall = new Cube(this.gl, 1);
        this.applyMaterial(wall);
        wall.setPosition(mx, cfg.wallHeight / 2, mz);
        wall.setRotation(0, angle, 0);
        wall.setScale(cfg.wallThick, cfg.wallHeight, len); // Z is length for 0 rot? Wait, Cube default scaling?
        // Let's assume Scale(x, y, z). If we rotate 0, it aligns with Z axis?
        // atan2(dx, dz): if dx=0, dz=1 -> 0 deg. Aligned with Z. Correct.
        // so scaling: Thickness is X, Height is Y, Length is Z.

        scene.add(wall);
        collidables.push(wall);

        // Parapets (Crenellations)
        this.createParapets(scene, collidables, mx, cfg.wallHeight, mz, angle, len, cfg);
    }

    createParapets(scene, collidables, x, y, z, angle, len, cfg) {
        // Create a row of small cubes on top
        const numMerlons = Math.floor(len / (cfg.parapetSize + cfg.parapetGap));
        const startZ = -len / 2 + cfg.parapetSize / 2; // Local Z

        // Helper to rotate local point to world
        const rad = angle * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        for (let i = 0; i < numMerlons; i++) {
            const localZ = startZ + i * (cfg.parapetSize + cfg.parapetGap);
            // Local pos relative to wall center (0, y, 0) is (0, y_top, localZ)
            // But we need world pos.
            // Rotated: X = x + localX*cos + localZ*sin
            //          Z = z - localX*sin + localZ*cos
            // localX is offset for thickness? Let's put them on the outer edge? 
            // Or just centered on wall thickness. Centered is easier.

            const wx = x + localZ * sin;
            const wz = z + localZ * cos;

            const merlon = new Cube(this.gl, 1);
            this.applyMaterial(merlon);
            merlon.setPosition(wx, y + cfg.parapetHeight / 2, wz);
            merlon.setRotation(0, angle, 0);
            merlon.setScale(cfg.wallThick * 0.8, cfg.parapetHeight, cfg.parapetSize);
            scene.add(merlon);
            // Parapets dont need to be collidable if above head height, but let's add them anyway
            // collidables.push(merlon); 
        }
    }

    buildKeep(scene, collidables) {
        // Central Keep: Tiered structure
        // Base
        const baseSize = 20;
        const baseH = 8;
        const base = new Cube(this.gl, 1);
        this.applyMaterial(base);
        base.setPosition(0, baseH / 2, 0);
        base.setScale(baseSize, baseH, baseSize);
        scene.add(base);
        collidables.push(base);

        // 2nd Tier
        const midSize = 14;
        const midH = 6;
        const mid = new Cube(this.gl, 1);
        this.applyMaterial(mid);
        mid.setPosition(0, baseH + midH / 2, 0);
        mid.setScale(midSize, midH, midSize);
        scene.add(mid);
        collidables.push(mid);

        // 3rd Tier
        const topSize = 8;
        const topH = 5;
        const top = new Cube(this.gl, 1);
        this.applyMaterial(top);
        top.setPosition(0, baseH + midH + topH / 2, 0);
        top.setScale(topSize, topH, topSize);
        scene.add(top);
        collidables.push(top);

        // Turrets on Keep Corners (Mid Tier)
        const midOffset = midSize / 2 - 1.0;
        const midTurretH = 5;
        const yMid = baseH + midH;
        this.createTower(scene, collidables, midOffset, midOffset, 1.5, midTurretH, yMid);
        this.createTower(scene, collidables, -midOffset, midOffset, 1.5, midTurretH, yMid);
        this.createTower(scene, collidables, midOffset, -midOffset, 1.5, midTurretH, yMid);
        this.createTower(scene, collidables, -midOffset, -midOffset, 1.5, midTurretH, yMid);

        // Central Spire
        const spireH = 10;
        const spireR = 2;
        this.createTower(scene, collidables, 0, 0, spireR, spireH, baseH + midH + topH);
    }

    buildGatehouse(scene, collidables, cfg) {
        // Front Gate (South Side?)
        // In perimeter, South is +D.
        const z = cfg.depth / 2;
        const gap = 8;

        // Two massive towers flanking the entrance
        const gateR = 3.0;
        const gateH = 12;

        this.createTower(scene, collidables, gap / 2 + gateR, z, gateR, gateH);
        this.createTower(scene, collidables, -(gap / 2 + gateR), z, gateR, gateH);

        // Archway lintel
        const lintelH = 3;
        const lintel = new Cube(this.gl, 1);
        this.applyMaterial(lintel);
        lintel.setPosition(0, 8, z); // High up
        lintel.setScale(gap + gateR * 2, lintelH, 3);
        scene.add(lintel);
        collidables.push(lintel);

        // Drawbridge (Extended)
        const bridgeLen = 15;
        const bridge = new Cube(this.gl, 1);
        // Special material?
        this.applyMaterial(bridge);
        bridge.baseColor = [0.6, 0.5, 0.4]; // Wood
        bridge.setPosition(0, 0.5, z + bridgeLen / 2 + 2); // Stick out
        bridge.setScale(6, 0.5, bridgeLen);
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
        const cone = new Cone(this.gl, r + 0.4, roofH, 32);
        this.applyMaterial(cone);
        cone.setPosition(x, yBase + h + 0.01, z); // Fixed: Cone base is at 0, so set to top of cylinder.
        scene.add(cone);
        // Roof usually not collidable for player walking, but good for blocking flying?
        collidables.push(cone);
    }
}
