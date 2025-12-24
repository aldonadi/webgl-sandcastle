import { Mesh } from '../Mesh.js';

export class Torus extends Mesh {
    constructor(gl, radius = 0.5, tube = 0.2, radialSegments = 16, tubularSegments = 32) {
        const vertices = [];
        const normals = [];
        const texCoords = [];
        const indices = [];

        for (let j = 0; j <= radialSegments; j++) {
            for (let i = 0; i <= tubularSegments; i++) {
                const u = i / tubularSegments * Math.PI * 2;
                const v = j / radialSegments * Math.PI * 2;

                const cx = radius + tube * Math.cos(v);
                const cy = tube * Math.sin(v);

                // Position (Y-up axis)
                // x = (R + r cos v) cos u
                // z = (R + r cos v) sin u
                // y = r sin v
                const x = cx * Math.cos(u);
                const z = cx * Math.sin(u);
                const y = cy;

                vertices.push(x, y, z);

                // Normal
                // Center of tube cross section at this u is:
                // cx_center = R * cos u
                // cz_center = R * sin u
                // cy_center = 0
                const centerX = radius * Math.cos(u);
                const centerZ = radius * Math.sin(u);
                const centerY = 0;

                // Normal is direction from center of tube to point
                // But better: use parametric derivatives or just simple vector subtraction
                const nx = x - centerX;
                const ny = y - centerY;
                const nz = z - centerZ;

                // Manual normalize
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                normals.push(nx / len, ny / len, nz / len);

                // UV
                texCoords.push(i / tubularSegments, j / radialSegments);
            }
        }

        for (let j = 1; j <= radialSegments; j++) {
            for (let i = 1; i <= tubularSegments; i++) {
                // Vertex indices
                const a = (tubularSegments + 1) * j + i - 1;
                const b = (tubularSegments + 1) * (j - 1) + i - 1;
                const c = (tubularSegments + 1) * (j - 1) + i;
                const d = (tubularSegments + 1) * j + i;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        super(gl, vertices, normals, texCoords, indices);
    }
}
