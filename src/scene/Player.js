import { Sphere } from './primitives/Sphere.js';

export class Player {
    constructor(gl, texGen) {
        this.gl = gl;
        this.radius = 0.5; // Player size
        this.mesh = new Sphere(gl, this.radius, 32, 32);

        this.position = { x: 0, y: this.radius, z: 10 }; // Start offset from origin (Outside)
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

    update(dt, inputVector, sceneObjects, actions) {
        const moveSpeed = 5.0;
        const turnSpeed = 2.0;

        // Tank Controls
        if (Math.abs(inputVector.x) > 0.01) {
            this.rotation -= inputVector.x * turnSpeed * dt;
        }

        let visualsRotation = this.rotation;

        // Calculate velocity from Input
        let vx = 0;
        let vz = 0;

        if (Math.abs(inputVector.y) > 0.01) {
            const fwdSpeed = -inputVector.y * moveSpeed;

            vx = Math.sin(this.rotation) * fwdSpeed;
            vz = Math.cos(this.rotation) * fwdSpeed;

            if (inputVector.y > 0) {
                visualsRotation = this.rotation + Math.PI;
            }
        }

        // --- Physics ---
        const gravity = -20.0; // Stronger gravity for snappier jump
        this.velocity.y += gravity * dt;

        // Jump
        // Target Height = 3 * Diameter = 3 * 1.0 = 3.0
        // v = sqrt(2 * g * h) = sqrt(2 * 20 * 3) = sqrt(120) ~ 11
        if (actions && actions.jump && this.isGrounded) {
            this.velocity.y = 11.0;
            this.isGrounded = false;
        }

        // Integration
        let currentVx = vx;
        let currentVy = this.velocity.y;
        let currentVz = vz;

        this.position.x += currentVx * dt;
        this.position.y += currentVy * dt;
        this.position.z += currentVz * dt;

        // Floor Safety (Beach Level)
        this.isGrounded = false; // Reset grounded state
        if (this.position.y < this.radius) {
            this.position.y = this.radius;
            if (this.velocity.y < 0) this.velocity.y = 0;
            this.isGrounded = true;
        }

        if (sceneObjects) {
            for (let i = 0; i < 3; i++) {
                let colFound = false;
                for (const obj of sceneObjects) {
                    if (obj === this.mesh) continue;

                    const hit = obj.resolveCollision(this);
                    if (hit) {
                        colFound = true;

                        const nx = hit.normal.x;
                        const ny = hit.normal.y;
                        const nz = hit.normal.z;

                        // 1. Resolve Penetration (Push Out)
                        const pushFactor = 1.001;
                        this.position.x += nx * hit.depth * pushFactor;
                        this.position.y += ny * hit.depth * pushFactor;
                        this.position.z += nz * hit.depth * pushFactor;

                        // 2. Velocity Projection
                        const vDotN = currentVx * nx + currentVy * ny + currentVz * nz;

                        if (vDotN < 0) {
                            currentVx -= vDotN * nx;
                            currentVy -= vDotN * ny;
                            currentVz -= vDotN * nz;

                            // 3. Grounded Check
                            // If we hit something flat enough, we are grounded
                            if (ny > 0.7) {
                                this.isGrounded = true;
                                if (this.velocity.y < 0) this.velocity.y = 0; // Stop falling
                            } else if (ny < -0.7) {
                                // Hit ceiling
                                if (this.velocity.y > 0) this.velocity.y = 0;
                            }
                        }
                    }
                }
                if (!colFound) break;
            }
        }

        // Persist vertical velocity state (gravity)
        // If we are grounded, velocity.y was set to 0 above.
        // If we are mid-air, it continues.

        // Animation Updates
        this.breathingTime += dt;
        const breathRate = 2.0;
        const breathAmount = 0.05;
        const sinVal = Math.sin(this.breathingTime * breathRate);
        const scaleY = 1.0 - (sinVal * breathAmount);
        const scaleXZ = 1.0 + (sinVal * breathAmount * 0.5);

        this.mesh.setPosition(this.position.x, this.position.y, this.position.z);
        this.mesh.setRotation(0, visualsRotation * 180 / Math.PI, 0);
        this.mesh.setScale(scaleXZ, scaleY, scaleXZ);
    }



    resolveCollision(sceneObjects) {
        // Deprecated/Unused now handled in update
    }

    draw(gl, camera, light) {
        this.mesh.draw(gl, camera, light);
    }
}
