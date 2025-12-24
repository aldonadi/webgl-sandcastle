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

    update(dt, inputVector, sceneObjects) {
        const moveSpeed = 5.0;
        const turnSpeed = 2.0;

        // Tank Controls...
        if (Math.abs(inputVector.x) > 0.01) {
            this.rotation -= inputVector.x * turnSpeed * dt;
        }

        let visualsRotation = this.rotation;

        // Potential Position
        let newX = this.position.x;
        let newZ = this.position.z;

        if (Math.abs(inputVector.y) > 0.01) {
            const fwdSpeed = -inputVector.y * moveSpeed * dt;

            const dx = Math.sin(this.rotation);
            const dz = Math.cos(this.rotation);

            newX += dx * fwdSpeed;
            newZ += dz * fwdSpeed;

            if (inputVector.y > 0) {
                visualsRotation = this.rotation + Math.PI;
            }
        }

        // Check Collision PREDICTIVELY
        // We check if moving to (newX, newZ) causes intersection.
        if (sceneObjects) {
            if (!this.checkCollision(newX, this.position.z, sceneObjects)) {
                this.position.x = newX;
            }
            if (!this.checkCollision(this.position.x, newZ, sceneObjects)) {
                this.position.z = newZ;
            }
            // Logic: Try moving X, if safe commit. Try moving Z, if safe commit. 
            // This allows sliding along walls.
        } else {
            this.position.x = newX;
            this.position.z = newZ;
        }

        // Simple Gravity / Floor clamp
        this.position.y = this.radius;

        // Breathing...
        this.breathingTime += dt;
        const breathRate = 2.0;
        const breathAmount = 0.05;

        const sinVal = Math.sin(this.breathingTime * breathRate);
        const scaleY = 1.0 - (sinVal * breathAmount);
        const scaleXZ = 1.0 + (sinVal * breathAmount * 0.5);

        // Update Mesh Position
        this.mesh.setPosition(this.position.x, this.position.y, this.position.z);

        // Update Mesh Rotation (Visible)
        this.mesh.setRotation(0, visualsRotation * 180 / Math.PI, 0);

        // Apply Scaling
        this.mesh.setScale(scaleXZ, scaleY, scaleXZ);
    }

    getBoundingBox(x, z) {
        // Player AABB centered at x, z
        const radius = this.radius;
        // Use slight buffer?
        return {
            min: { x: x - radius, y: 0, z: z - radius },
            max: { x: x + radius, y: radius * 2, z: z + radius }
        };
    }

    checkCollision(newX, newZ, sceneObjects) {
        const playerBox = this.getBoundingBox(newX, newZ);

        for (const obj of sceneObjects) {
            if (obj === this.mesh) continue;
            if (!obj.isCollidable) continue; // Respect flag

            // Get Object AABB
            // If obj has getAABB, use it.
            let objBox = null;
            if (obj.getAABB) {
                objBox = obj.getAABB();
            } else if (obj.position) {
                // Fallback (assume size 1)
                objBox = {
                    min: { x: obj.position.x - 0.5, y: obj.position.y - 0.5, z: obj.position.z - 0.5 },
                    max: { x: obj.position.x + 0.5, y: obj.position.y + 0.5, z: obj.position.z + 0.5 }
                };
            }

            if (objBox) {
                // AABB Overlap Test
                const overlap = (
                    playerBox.min.x < objBox.max.x &&
                    playerBox.max.x > objBox.min.x &&
                    playerBox.min.y < objBox.max.y &&
                    playerBox.max.y > objBox.min.y &&
                    playerBox.min.z < objBox.max.z &&
                    playerBox.max.z > objBox.min.z
                );

                if (overlap) return true;
            }
        }
        return false;
    }

    resolveCollision(sceneObjects) {
        // Deprecated/Unused now handled in update
    }

    draw(gl, camera, light) {
        this.mesh.draw(gl, camera, light);
    }
}
