import { Mesh } from '../Mesh.js';

export class Plane extends Mesh {
    constructor(gl, size = 10.0, tiling = 1.0) {
        const s = size / 2;

        const vertices = [
            -s, 0, s,
            s, 0, s,
            s, 0, -s,
            -s, 0, -s
        ];

        const normals = [
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0
        ];

        const texCoords = [
            0, 0,
            tiling, 0,
            tiling, tiling,
            0, tiling
        ];

        // Tangent: +x for flat plane on XZ
        const tangents = [
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0
        ];

        const indices = [
            0, 1, 2,
            0, 2, 3
        ];

        super(gl, vertices, normals, texCoords, indices, tangents);
    }
}
