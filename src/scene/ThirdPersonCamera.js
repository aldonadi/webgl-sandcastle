import { Camera } from './Camera.js';
import { Vector3 } from '../math/Vector3.js';
import { MathUtils } from '../math/MathUtils.js';

export class ThirdPersonCamera extends Camera {
    constructor(fov, aspect, near, far) {
        super(fov, aspect, near, far);

        this.distance = 5.0;
        this.currentDistance = 5.0; // For smooth zoom or collision handling later

        // Offset from target (shoulder view)
        // Right: 1.0, Up: 1.5
        this.offsetRight = 1.0;
        this.offsetUp = 1.5; // Look at point height offset from player feet

        // Angles
        this.yaw = -90; // Degrees
        this.pitch = -15; // Degrees

        this.targetPosition = new Vector3(0, 0, 0); // Player position
    }

    update(dt, player, lookInput, isPlayerMoving, sceneObjects = []) {
        // 1. Handle Input (Orbit)
        // Look Input: x (yaw), y (pitch)
        const sensitivity = 2.0;

        this.yaw += lookInput.x * sensitivity;
        this.pitch += lookInput.y * sensitivity;

        // Clamp Pitch
        this.pitch = Math.max(-85, Math.min(85, this.pitch));

        // 2. Auto-Align logic (Case 1)
        if (isPlayerMoving) {
            // Strict follow mode requested: "turn with them"
            if (Math.abs(lookInput.x) < 0.001 && Math.abs(lookInput.y) < 0.001) {
                const playerRotDeg = player.rotation * 180 / Math.PI;
                const targetYaw = 90 - playerRotDeg;

                let delta = targetYaw - this.yaw;
                while (delta > 180) delta -= 360;
                while (delta < -180) delta += 360;

                // High speed for strict follow
                const followSpeed = 5.0;
                this.yaw += delta * followSpeed * dt;
            }
        }

        // 3. Update Position based on Spherical Coords around Target
        this.updateCameraPosition(player, sceneObjects);
    }

    updateCameraPosition(player, sceneObjects) {
        const radYaw = MathUtils.degToRad(this.yaw);
        const radPitch = MathUtils.degToRad(this.pitch);

        // 1. Calculate ideal direction
        const dirX = Math.cos(radYaw) * Math.cos(radPitch);
        const dirY = Math.sin(radPitch);
        const dirZ = Math.sin(radYaw) * Math.cos(radPitch);

        const direction = new Vector3(dirX, dirY, dirZ).normalize();

        // 2. Calculate ideal Target and Position
        // Target is Player + Up Offset
        this.targetPosition.set(player.position.x, player.position.y + this.offsetUp, player.position.z);

        // Apply Side Offset (Right)
        const worldUp = new Vector3(0, 1, 0);
        const right = new Vector3().crossVectors(direction, worldUp).normalize();

        // Ideal Camera Position (without collision)
        // Pos = Target - Direction * Distance + Right * OffsetRight
        const idealPos = new Vector3(
            this.targetPosition.x - direction.x * this.distance + right.x * this.offsetRight,
            this.targetPosition.y - direction.y * this.distance + right.y * this.offsetRight,
            this.targetPosition.z - direction.z * this.distance + right.z * this.offsetRight
        );

        // 3. Camera Collision / Raycast
        const rayStart = this.targetPosition;
        const rayEnd = idealPos;

        let finalPos = idealPos;
        let minHitDist = this.distance + 2.0; // Max check

        // Check collision against objects
        if (sceneObjects) {
            const rayDir = new Vector3().subVectors(rayEnd, rayStart);
            const maxDist = Math.sqrt(rayDir.x * rayDir.x + rayDir.y * rayDir.y + rayDir.z * rayDir.z);
            if (maxDist > 0.001) {
                rayDir.normalize();

                for (const obj of sceneObjects) {
                    if (obj === player.mesh) continue; // Ignore player

                    // Sphere Test:
                    // Radius ~ max scale
                    let radius = 1.0;
                    if (obj.scale) radius = Math.max(obj.scale.x, Math.max(obj.scale.y, obj.scale.z)) * 0.8;

                    // Check Ray-Sphere
                    // L = Center - Origin
                    const lx = obj.position.x - rayStart.x;
                    const ly = obj.position.y - rayStart.y;
                    const lz = obj.position.z - rayStart.z;

                    const tca = lx * rayDir.x + ly * rayDir.y + lz * rayDir.z;
                    if (tca < 0) continue; // Behind ray

                    const d2 = (lx * lx + ly * ly + lz * lz) - tca * tca;
                    if (d2 > radius * radius) continue; // Miss

                    const thc = Math.sqrt(radius * radius - d2);
                    const t0 = tca - thc;

                    if (t0 > 0 && t0 < maxDist) {
                        // Hit!
                        // Clamp distance
                        if (t0 < minHitDist) {
                            minHitDist = t0;
                        }
                    }
                }

                if (minHitDist < maxDist) {
                    // We hit something!
                    // Place camera at hit point (minus buffer)
                    const buffer = 0.5;
                    const hitDist = Math.max(0.2, minHitDist - buffer);

                    finalPos = new Vector3(
                        rayStart.x + rayDir.x * hitDist,
                        rayStart.y + rayDir.y * hitDist,
                        rayStart.z + rayDir.z * hitDist
                    );
                }
            }
        }

        // Ground Clamp
        if (finalPos.y < 0.5) finalPos.y = 0.5;

        this.position.set(finalPos.x, finalPos.y, finalPos.z);

        // Update View Matrix
        this.viewMatrix.setLookAt(
            this.position.x, this.position.y, this.position.z,
            this.targetPosition.x, this.targetPosition.y, this.targetPosition.z,
            0, 1, 0
        );
    }
}
