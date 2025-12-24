import { Mesh } from '../Mesh.js';

export class Cube extends Mesh {
    constructor(gl, size = 1.0) {
        const s = size / 2;

        // Positions
        const vertices = [
            // Front
            -s, -s, s, s, -s, s, s, s, s, -s, s, s,
            // Back
            -s, -s, -s, -s, s, -s, s, s, -s, s, -s, -s,
            // Top
            -s, s, -s, -s, s, s, s, s, s, s, s, -s,
            // Bottom
            -s, -s, -s, s, -s, -s, s, -s, s, -s, -s, s,
            // Right
            s, -s, -s, s, s, -s, s, s, s, s, -s, s,
            // Left
            -s, -s, -s, -s, -s, s, -s, s, s, -s, s, -s
        ];

        // Normals
        const normals = [
            // Front (0, 0, 1)
            0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
            // Back (0, 0, -1)
            0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
            // Top (0, 1, 0)
            0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
            // Bottom (0, -1, 0)
            0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
            // Right (1, 0, 0)
            1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
            // Left (-1, 0, 0)
            -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
        ];

        // UVs
        const texCoords = [
            // Front
            0, 0, 1, 0, 1, 1, 0, 1,
            // Back
            1, 0, 1, 1, 0, 1, 0, 0,
            // Top
            0, 1, 0, 0, 1, 0, 1, 1,
            // Bottom
            1, 1, 0, 1, 0, 0, 1, 0,
            // Right
            1, 0, 1, 1, 0, 1, 0, 0,
            // Left
            0, 0, 1, 0, 1, 1, 0, 1
        ];

        const indices = [
            0, 1, 2, 0, 2, 3,    // Front
            4, 5, 6, 4, 6, 7,    // Back
            8, 9, 10, 8, 10, 11,   // Top
            12, 13, 14, 12, 14, 15,   // Bottom
            16, 17, 18, 16, 18, 19,   // Right
            20, 21, 22, 20, 22, 23    // Left
        ];

        super(gl, vertices, normals, texCoords, indices);
    }
}
