import { Mesh } from '../Mesh.js';

export class Cube extends Mesh {
    constructor(gl, size = 1.0, color = [1, 1, 1]) {
        const s = size / 2;

        // 8 vertices, but we need 24 for distinct normals/colors per face if we wanted lighting
        // For simple solid color, 8 is enough with indices, or duplicate for distinct face colors.
        // Let's do distinct face colors to see 3D effect.

        const vertices = [
            // Front
            -s, -s, s,
            s, -s, s,
            s, s, s,
            -s, s, s,
            // Back
            -s, -s, -s,
            -s, s, -s,
            s, s, -s,
            s, -s, -s,
            // Top
            -s, s, -s,
            -s, s, s,
            s, s, s,
            s, s, -s,
            // Bottom
            -s, -s, -s,
            s, -s, -s,
            s, -s, s,
            -s, -s, s,
            // Right
            s, -s, -s,
            s, s, -s,
            s, s, s,
            s, -s, s,
            // Left
            -s, -s, -s,
            -s, -s, s,
            -s, s, s,
            -s, s, -s
        ];

        const indices = [
            0, 1, 2, 0, 2, 3,    // Front
            4, 5, 6, 4, 6, 7,    // Back
            8, 9, 10, 8, 10, 11,   // Top
            12, 13, 14, 12, 14, 15,   // Bottom
            16, 17, 18, 16, 18, 19,   // Right
            20, 21, 22, 20, 22, 23    // Left
        ];

        // Face colors
        const colors = [];
        const faceColors = [
            [color[0], color[1], color[2]], // Front
            [color[0] * 0.9, color[1] * 0.9, color[2] * 0.9], // Back
            [color[0] * 0.8, color[1] * 0.8, color[2] * 0.8], // Top
            [color[0] * 0.7, color[1] * 0.7, color[2] * 0.7], // Bot
            [color[0] * 0.6, color[1] * 0.6, color[2] * 0.6], // Right
            [color[0] * 0.5, color[1] * 0.5, color[2] * 0.5], // Left
        ];

        for (let j = 0; j < 6; j++) {
            const c = faceColors[j];
            for (let i = 0; i < 4; i++) {
                colors.push(c[0], c[1], c[2]);
            }
        }

        super(gl, vertices, colors, indices);
    }
}
