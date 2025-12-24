import { Matrix4 } from '../math/Matrix4.js';
import { MathUtils } from '../math/MathUtils.js';

export class Scene {
    constructor() {
        this.children = [];
    }

    add(object) {
        this.children.push(object);
    }

    draw(gl, camera, light, depthTexture) {
        // 1. Calculate View-Projection Matrix
        // We need a temp matrix to avoid mutating camera matrices permanently if we did that.
        // But Camera has separated matrices.
        // VP = P * V
        const vpMatrix = new Matrix4();
        vpMatrix.multiplyMatrices(camera.projectionMatrix, camera.viewMatrix);

        // 2. Extract Frustum Planes
        const planes = MathUtils.getFrustumPlanes(vpMatrix);

        // 3. Cull & Collect Visible Objects
        const visibleObjects = [];
        const camPos = camera.position;

        for (const child of this.children) {
            // Check Bounding Sphere
            if (child.getWorldBoundingSphere) {
                const sphere = child.getWorldBoundingSphere();
                if (!MathUtils.isSphereInFrustum(sphere, planes)) {
                    continue; // Culled
                }

                // Calculate Distance for Sorting
                const dx = sphere.center.x - camPos.x;
                const dy = sphere.center.y - camPos.y;
                const dz = sphere.center.z - camPos.z;
                child._distSq = dx * dx + dy * dy + dz * dz;
            } else {
                // If no bounding sphere (e.g. infinite plane?), assume visible
                // Or if it's a special object.
                child._distSq = 0;
            }
            visibleObjects.push(child);
        }

        // 4. Sort Front-to-Back (for Early-Z efficiency)
        // Ascending distance
        visibleObjects.sort((a, b) => a._distSq - b._distSq);

        // 5. Draw
        for (const child of visibleObjects) {
            child.draw(gl, camera, light, depthTexture);
        }
    }
}
