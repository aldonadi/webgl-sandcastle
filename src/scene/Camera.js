import { Matrix4 } from '../math/Matrix4.js';
import { Vector3 } from '../math/Vector3.js';
import { MathUtils } from '../math/MathUtils.js';

export class Camera {
    constructor(fov = 60, aspect = 1.0, near = 0.1, far = 100.0) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.projectionMatrix = new Matrix4();
        this.viewMatrix = new Matrix4();

        this.position = new Vector3(0, 2, 5);
        this.target = new Vector3(0, 0, 0); // Where we are looking
        this.up = new Vector3(0, 1, 0);

        // Euler angles for free look
        this.yaw = -90; // Facing negative Z
        this.pitch = 0;

        this.updateProjectionMatrix();
        this.updateViewMatrix();
    }

    updateProjectionMatrix() {
        this.projectionMatrix.setPerspective(this.fov, this.aspect, this.near, this.far);
    }

    updateViewMatrix() {
        // Calculate direction from yaw and pitch
        const radYaw = MathUtils.degToRad(this.yaw);
        const radPitch = MathUtils.degToRad(this.pitch);

        const x = Math.cos(radYaw) * Math.cos(radPitch);
        const y = Math.sin(radPitch);
        const z = Math.sin(radYaw) * Math.cos(radPitch);

        const direction = new Vector3(x, y, z).normalize();

        // Target is position + direction
        this.target.set(
            this.position.x + direction.x,
            this.position.y + direction.y,
            this.position.z + direction.z
        );

        this.viewMatrix.setLookAt(
            this.position.x, this.position.y, this.position.z,
            this.target.x, this.target.y, this.target.z,
            this.up.x, this.up.y, this.up.z
        );
    }

    // Delta inputs (e.g. from joystick)
    rotate(dYaw, dPitch) {
        this.yaw += dYaw;
        this.pitch += dPitch;

        // Constrain pitch
        if (this.pitch > 89.0) this.pitch = 89.0;
        if (this.pitch < -89.0) this.pitch = -89.0;

        this.updateViewMatrix();
    }

    move(dForward, dRight) {
        // Forward vector (projected on XZ plane to avoid flying)
        const radYaw = MathUtils.degToRad(this.yaw);

        const forwardX = Math.cos(radYaw);
        const forwardZ = Math.sin(radYaw);

        const rightX = Math.cos(radYaw + MathUtils.degToRad(90)); // Or -sin(yaw)
        // Actually right vector is cross(forward, up).
        // Simple 2D rotation for movement on XZ plane:

        const fwd = new Vector3(Math.cos(radYaw), 0, Math.sin(radYaw)).normalize();
        const right = new Vector3().crossVectors(fwd, this.up).normalize();

        // Scale by input
        // position += fwd * dForward + right * dRight
        this.position.x += fwd.x * dForward + right.x * dRight;
        this.position.y += fwd.y * dForward + right.y * dRight; // Ideally 0 if we don't want to fly with forward key
        this.position.z += fwd.z * dForward + right.z * dRight;

        this.updateViewMatrix();
    }
}
