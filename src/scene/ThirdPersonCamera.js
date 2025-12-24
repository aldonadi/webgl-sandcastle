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

        this.targetPostion = new Vector3(0, 0, 0); // Player position
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
            // If player is moving, we want the camera to slowly align behind the player
            // UNLESS the user is actively using the look stick (lookInput != 0)

            if (Math.abs(lookInput.x) < 0.01 && Math.abs(lookInput.y) < 0.01) {
                // Player Rotation is in Rads, Convert to Degs
                // Player faces 'rotation'. Camera should face 'rotation'.
                // Actually Camera is 'behind', so Camera Yaw should equal Player Yaw (if looking forward).
                // Player.rotation is standard atan2(x, z). 0 is +Z? 
                // In JS Math.atan2(x, z): 0 is +Z? No, atan2(y, x).
                // Player logic: atan2(dx, dz). 
                // If moving +Z (dz=1, dx=0), rot = 0.
                // Camera Yaw 0 -> +X (in standard math?) No, let's check Camera.js
                // Camera.js: x=cos(yaw)*cos(pitch), z=sin(yaw)*cos(pitch).
                // Yaw 0 -> x=1, z=0 (+X).
                // Yaw 90 -> x=0, z=1 (+Z).
                // So if Player moves +Z, rot is 0 (from atan2(dx, dz)?? wait atan2(x,y) -> atan2(dx, dz) is usually (x,y) args order).
                // Math.atan2(y, x). I used atan2(dx, dz). So y=dx, x=dz.
                // If dz=1, dx=0 (move +Z), atan2(0, 1) = 0.
                // So Player Rot 0 is +Z.
                // Camera Yaw for +Z is 90 degs. 
                // So Target Yaw = PlayerRot(deg) + 90? Or something.

                // Let's rely on visual feedback and tweak offset.
                // Target Yaw = Player Rotation converted to Degrees.
                // But we need to map conventions. 

                // Let's implement a "Soft Following"
                // Ideally calculate the angle of movement vector and align to that.

                // For now, let's implement the orbit and shoulder offset. 
                // The "auto-align" can be annoying if implemented wrong. 
                // User said: "Camera should generally try to be looking in the same direction that the character is looking"

                const playerRotDeg = player.rotation * 180 / Math.PI;
                // Conversion: Player 0 (+Z). Camera 90 (+Z). Offset 90.
                // Player atan2(dx, dz): +X(1,0)->90. 
                // Camera: 0->+X. 
                // So PlayerRot == CameraYaw.

                // If user is NOT controlling camera, lerp towards player rot
                // But wait, "Over the shoulder". 
                // We apply offset later.

                // Lerp
                const targetYaw = playerRotDeg;
                // Shortest angle interpolation
                let delta = targetYaw - this.yaw;
                while (delta > 180) delta -= 360;
                while (delta < -180) delta += 360;

                this.yaw += delta * 2.0 * dt; // speed 2.0
            }
        }

        // 3. Update Position based on Spherical Coords around Target
        this.updateCameraPosition(player);
    }

    updateCameraPosition(player) {
        const radYaw = MathUtils.degToRad(this.yaw);
        const radPitch = MathUtils.degToRad(this.pitch);

        // 1. Calculate Orbit Position (relative to target center)
        // x = r * cos(pitch) * cos(yaw)
        // y = r * sin(pitch)
        // z = r * cos(pitch) * sin(yaw)
        // NOTE: Math.sin(pitch) for Y is OK.
        // BUT: We want "behind" to be determined by Yaw. 
        // If Yaw is direction camera is LOOKING reduced by 180?
        // No, Camera.js `updateViewMatrix` calculates "direction" from yaw/pitch.
        // If we want Camera to LOOK at player from a distance:
        // CameraPos = Target - Direction * Distance

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
        this.targetPostion.set(player.position.x, player.position.y + this.offsetUp, player.position.z);

        this.position.x = this.targetPostion.x - direction.x * this.distance + right.x * this.offsetRight;
        this.position.y = this.targetPostion.y - direction.y * this.distance + right.y * this.offsetRight;
        this.position.z = this.targetPostion.z - direction.z * this.distance + right.z * this.offsetRight;

        // Look At Target (with offset offset? No, look at target point)
        // We essentially orbit 'targetPosition'.
        // Since we offset the camera position by 'right', if we just look at 'targetPosition', 
        // it will look slightly off-center (which is what we want for over-the-shoulder).

        // Update View Matrix
        this.viewMatrix.setLookAt(
            this.position.x, this.position.y, this.position.z,
            this.targetPostion.x, this.targetPostion.y, this.targetPostion.z,
            0, 1, 0
        );
    }
}
