import { Mesh } from '../Mesh.js';

export class Plane extends Mesh {
    constructor(gl, size = 10.0, color = [0.5, 0.5, 0.5]) {
        const s = size / 2;

        // Just a flat quad on XZ plane
        const vertices = [
            -s, 0, s,
            s, 0, s,
            s, 0, -s,
            -s, 0, -s
        ];

        const indices = [
            0, 1, 2,
            0, 2, 3
        ];

        const colors = [];
        for (let i = 0; i < 4; i++) {
            colors.push(color[0], color[1], color[2]); // Vertex colors
        }

        super(gl, vertices, colors, indices);
    }
}
