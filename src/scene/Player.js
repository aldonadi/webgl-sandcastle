import { Sphere } from './primitives/Sphere.js';

export class Player {
    constructor(gl, texGen) {
        this.gl = gl;
        this.radius = 0.5; // Player size
        this.mesh = new Sphere(gl, this.radius, 32, 32);

        this.position = { x: 0, y: this.radius, z: 2 }; // Start offset from origin
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = 0; // Yaw in radians

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

    update(dt, inputVector, cameraYaw) {
        const speed = 5.0; // Units per second

        // Input Vector is (x: left/right, y: forward/back) from joystick
        // We need to convert this to world space based on camera angle
        if (Math.abs(inputVector.x) > 0.01 || Math.abs(inputVector.y) > 0.01) {

            // Calculate movement direction relative to camera
            // CameraYaw is in degrees usually? No check main.js, it says camera.yaw = -90 (degrees).
            // But let's assume we get radians or convert.
            // Let's assume we pass in radians for easier math here.

            const yawRad = cameraYaw;

            // Forward is -Z in view space usually?
            // If camera looks down -Z, then Forward input (y < 0) should move -Z.
            // Actually Joystick usually: Y is up/down (-1 to 1). If Up is -1, then we want to move Forward.

            const fwdX = -Math.sin(yawRad);
            const fwdZ = -Math.cos(yawRad);

            const rightX = -Math.sin(yawRad + Math.PI / 2);
            const rightZ = -Math.cos(yawRad + Math.PI / 2);

            // Input: x (left/right), y (forward/back)
            // If y is -1 (forward), we want positive forward movement? 
            // Let's assume Stick Y: -1 is Forward (Up on screen)

            const dx = (inputVector.x * rightX) + (inputVector.y * fwdX); // Check signs
            const dz = (inputVector.x * rightZ) + (inputVector.y * fwdZ);

            // Normalize direction if magnitude > 1 (to prevent faster diagonal)
            // But input stick usually handles this circle clamping or we just use it raw for analog control.

            this.position.x += dx * speed * dt;
            this.position.z += dz * speed * dt;

            // Rotate player to face movement?
            if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
                this.rotation = Math.atan2(dx, dz);
            }
        }

        // Simple Gravity / Floor clamp
        // We will do collision properly later, for now clamp to y=radius
        this.position.y = this.radius;

        // Update Mesh
        this.mesh.setPosition(this.position.x, this.position.y, this.position.z);

        // Ball rolling effect? 
        // A bit complex because we need axis of rotation perpendicular to movement.
        // Let's just slide with fixed orientation (like a character) or rotate Y to face dir.
        this.mesh.setRotation(0, this.rotation * 180 / Math.PI, 0);
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
