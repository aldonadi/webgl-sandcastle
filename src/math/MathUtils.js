export class MathUtils {
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    static getFrustumPlanes(vpMatrix) {
        const m = vpMatrix.elements;
        const planes = [];

        // Left
        planes.push({ x: m[3] + m[0], y: m[7] + m[4], z: m[11] + m[8], w: m[15] + m[12] });
        // Right
        planes.push({ x: m[3] - m[0], y: m[7] - m[4], z: m[11] - m[8], w: m[15] - m[12] });
        // Bottom
        planes.push({ x: m[3] + m[1], y: m[7] + m[5], z: m[11] + m[9], w: m[15] + m[13] });
        // Top
        planes.push({ x: m[3] - m[1], y: m[7] - m[5], z: m[11] - m[9], w: m[15] - m[13] });
        // Near
        planes.push({ x: m[3] + m[2], y: m[7] + m[6], z: m[11] + m[10], w: m[15] + m[14] });
        // Far
        planes.push({ x: m[3] - m[2], y: m[7] - m[6], z: m[11] - m[10], w: m[15] - m[14] });

        // Normalize
        for (let i = 0; i < 6; i++) {
            const p = planes[i];
            const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
            if (len > 0) {
                p.x /= len;
                p.y /= len;
                p.z /= len;
                p.w /= len;
            }
        }

        return planes;
    }

    static isSphereInFrustum(sphere, planes) {
        // center: {x,y,z}, radius
        const c = sphere.center;
        const r = sphere.radius;

        for (let i = 0; i < 6; i++) {
            const p = planes[i];
            const dist = p.x * c.x + p.y * c.y + p.z * c.z + p.w;
            if (dist < -r) {
                return false; // Outside this plane
            }
        }
        return true;
    }
}
