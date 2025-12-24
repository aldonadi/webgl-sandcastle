import { Sphere } from './primitives/Sphere.js';

export class Player {
    constructor(gl, texGen) {
        this.gl = gl;
        this.radius = 0.5; // Player size
        this.mesh = new Sphere(gl, this.radius, 32, 32);

        this.position = { x: 0, y: this.radius, z: 2 }; // Start offset from origin
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = 0; // Yaw in radians

        // Animation
        this.breathingTime = 0;

        // Generate Texture
        this.texture = texGen.createTexture(256, 256, {
            color: '#ff4444',
            noise: 0.1
        });

        // Create a marble-like texture or stripes
        // We can do this by drawing onto a canvas manually using texGen helper or just custom logic here?
        // Let's make a custom marble texture using a canvas 
        this.createMarbleTexture(texGen);

        this.mesh.setTexture(this.texture);
        this.mesh.baseColor = [1.0, 1.0, 1.0];
        this.mesh.specularIntensity = 0.8;
        this.mesh.shininess = 32.0;

        // Normals?
        this.normalMap = texGen.createNormalMap(256, 256, 2.0);
        this.mesh.setNormalMap(this.normalMap);
    }

    createMarbleTexture(texGen) {
        const width = 256;
        const height = 256;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Base
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(0, 0, width, height);

        // Random Swirls
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.moveTo(x, y);

            // Bezier curve
            ctx.bezierCurveTo(
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height
            );

            ctx.lineWidth = Math.random() * 10 + 2;
            const hue = Math.random() * 360;
            ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.5)`;
            ctx.stroke();
        }

        // Add noise
        texGen.applyNoise(ctx, width, height, 0.1);

        this.texture = texGen.uploadTexture(canvas, width, height);
    }

    update(dt, inputVector) {
        const moveSpeed = 5.0;
        const turnSpeed = 2.0;

        // Tank Controls:
        // Input X: Turn Left/Right (Yaw)
        // Input Y: Move Forward/Back (relative to current rotation)

        if (Math.abs(inputVector.x) > 0.01) {
            // Invert x because usually Right (positive) input means Turn Right (negative Yaw in standard RH system if Z is forward?)
            // Let's test: 
            // -Z is Forward. 
            // Rotation +: Turns Left? or Right?
            // Standard: +Y axis rotation.
            // +Yaw -> rotates counter-clockwise (Left).
            // So +InputX (Right) should allow -Yaw.
            this.rotation -= inputVector.x * turnSpeed * dt;
        }

        let visualsRotation = this.rotation;

        if (Math.abs(inputVector.y) > 0.01) {
            // Up (-1) -> Move Forward (-Z relative to rotation).
            // Down (1) -> Move Backward (+Z relative to rotation).

            // Forward Vector from Rotation
            // Rot 0 -> +Z? (from atan2(0,1)).
            // Let's stick to: Rot 0 is +Z.
            // Forward (+Z direction) = (sin(rot), 0, cos(rot)).

            // Move Delta: input.y * speed
            // If input.y is -1 (Up), we want to move "Forward" (which is usually into screen, -Z?)
            // Camera is behind (-Z direction).
            // If Rot=0 (facing Z), Forward means +Z.
            // If input.y = -1 (Up stick). We want to move +Z?
            // Usually Up stick = Move away from camera.
            // If Camera looks at +Z (from -Z), "away" is +Z.
            // So Up (-1) -> +Z move.
            // speed * (-input.y).

            const fwdSpeed = -inputVector.y * moveSpeed * dt;

            // Calculate forward vector based on current rotation
            // Assuming Rot 0 faces +Z
            const dx = Math.sin(this.rotation);
            const dz = Math.cos(this.rotation);

            this.position.x += dx * fwdSpeed;
            this.position.z += dz * fwdSpeed;

            // Visual Rotation Logic
            // If moving backward (input.y > 0), face camera (180 turn)
            if (inputVector.y > 0) {
                visualsRotation = this.rotation + Math.PI;
            }
        }

        // Simple Gravity / Floor clamp
        this.position.y = this.radius;

        // Update Mesh Position
        this.mesh.setPosition(this.position.x, this.position.y, this.position.z);

        // Update Mesh Rotation (Visible)
        this.mesh.setRotation(0, visualsRotation * 180 / Math.PI, 0);
    }

    resolveCollision(sceneObjects) {
        // Simple iteration over scene objects
        // We assume objects have position and scale properties (Mesh has them)
        // We won't do full OBB collision, just simple circle-circle or circle-rect approximation in 2D (XZ plane)

        for (const obj of sceneObjects) {
            if (obj === this.mesh) continue; // Skip self
            if (!obj.position) continue;

            // Check types based on constructor name or just generic "size"
            // Bounds approximation
            const dx = this.position.x - obj.position.x;
            const dz = this.position.z - obj.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // Get object approximate radius from scale
            // Cube scale is (x, y, z). Box width approx max(scale.x, scale.z) / 2?
            // Cube size is 1.0 * scale.
            // Cylinder radius is passed in constructor, but usually not stored as prop unless we checked.
            // Let's assume everything is a "circle" of radius = max(scale.x, scale.z) * 0.7 for now
            // Or better, check for "Cube" vs "Cylinder".

            let objRadius = 0.5; // Default
            if (obj.scale) {
                objRadius = Math.max(obj.scale.x, obj.scale.z) * 0.6; // Slightly generous
            }

            const minDist = this.radius + objRadius;

            if (dist < minDist) {
                // Collision!
                // Push back
                const overlap = minDist - dist;
                if (dist > 0.001) {
                    const nx = dx / dist;
                    const nz = dz / dist;

                    this.position.x += nx * overlap;
                    this.position.z += nz * overlap;
                }
            }
        }
    }

    draw(gl, camera, light) {
        this.mesh.draw(gl, camera, light);
    }
}
