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

    update(dt, player, lookInput, isPlayerMoving) {
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
            // If user is NOT looking around, we strictly align camera behind player
            if (Math.abs(lookInput.x) < 0.001 && Math.abs(lookInput.y) < 0.001) {
                const playerRotDeg = player.rotation * 180 / Math.PI;

                // Player Rot 0 (+Z) -> Camera Yaw 90 (+Z)
                // Player Rot 90 (+X) -> Camera Yaw 0 (+X)
                // Relation: TargetYaw = 90 - playerRotDeg

                const targetYaw = 90 - playerRotDeg;

                let delta = targetYaw - this.yaw;
                while (delta > 180) delta -= 360;
                while (delta < -180) delta += 360;

                // High speed for strict follow (almost locked, but smooth enough to not jitter)
                const followSpeed = 5.0;
                this.yaw += delta * followSpeed * dt;
            }
        }

        // 3. Update Position based on Spherical Coords around Target
        this.updateCameraPosition(player);
    }

    updateCameraPosition(player) {
        const radYaw = MathUtils.degToRad(this.yaw);
        const radPitch = MathUtils.degToRad(this.pitch);

        // 1. Calculate Orbit Position (relative to target center)

        const dirX = Math.cos(radYaw) * Math.cos(radPitch);
        const dirY = Math.sin(radPitch);
        const dirZ = Math.sin(radYaw) * Math.cos(radPitch);

        const direction = new Vector3(dirX, dirY, dirZ).normalize();

        // Position = PlayerPos + OffsetUp - Direction * Dist
        // Apply Side Offset?
        // Side offset (Right) needs Right Vector
        const worldUp = new Vector3(0, 1, 0);
        const right = new Vector3().crossVectors(direction, worldUp).normalize();

        // Smoothly track player position?
        // direct copy for now
        this.targetPosition.set(player.position.x, player.position.y + this.offsetUp, player.position.z);

        this.position.x = this.targetPosition.x - direction.x * this.distance + right.x * this.offsetRight;
        this.position.y = this.targetPosition.y - direction.y * this.distance + right.y * this.offsetRight;
        this.position.z = this.targetPosition.z - direction.z * this.distance + right.z * this.offsetRight;

        // Look At Target (with offset offset? No, look at target point)
        // We essentially orbit 'targetPosition'.
        // Since we offset the camera position by 'right', if we just look at 'targetPosition', 
        // it will look slightly off-center (which is what we want for over-the-shoulder).

        // Update View Matrix
        this.viewMatrix.setLookAt(
            this.position.x, this.position.y, this.position.z,
            this.targetPosition.x, this.targetPosition.y, this.targetPosition.z,
            0, 1, 0
        );
    }
}
