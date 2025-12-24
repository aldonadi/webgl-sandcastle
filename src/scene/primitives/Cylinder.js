import { Mesh } from '../Mesh.js';

export class Cylinder extends Mesh {
    constructor(gl, radius = 0.5, height = 1.0, segments = 16) {
        const vertices = [];
        const normals = [];
        const texCoords = [];
        const tangents = [];
        const indices = [];

        // We will build the cylinder as a single strip for the side, 
        // and separate caps? Or just the side for now? 
        // Towers need side primarily. Let's do Side + Top + Bottom.

        // Side
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = Math.cos(theta);
            const z = Math.sin(theta);
            const u = i / segments;

            // Top edge
            vertices.push(x * radius, height / 2, z * radius);
            normals.push(x, 0, z); // Normal points out
            texCoords.push(u, 0);
            tangents.push(-z, 0, x); // Tangent is derivative of Circle: (-sin, 0, cos)

            // Bottom edge
            vertices.push(x * radius, -height / 2, z * radius);
            normals.push(x, 0, z);
            texCoords.push(u, 1);
            tangents.push(-z, 0, x);
        }

        // Indices for Side
        // each segment has 2 vertices added above (top, bottom).
        // vertices are 0,1, 2,3, 4,5 ...
        // Quad i is: 2*i, 2*i+1, 2*i+2, 2*i+3
        for (let i = 0; i < segments; i++) {
            const a = i * 2;
            const b = a + 1;
            const c = a + 2;
            const d = a + 3;

            indices.push(a, b, c);
            indices.push(b, d, c);
        }

        // TODO: Caps (Top/Bottom) if needed. 
        // For sandcastle towers, maybe just the top cap?
        // Let's add simple flat top cap.

        const baseIndex = vertices.length / 3;
        // Center top
        vertices.push(0, height / 2, 0);
        normals.push(0, 1, 0);
        texCoords.push(0.5, 0.5);
        tangents.push(1, 0, 0);
        const centerIndex = baseIndex;

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = Math.cos(theta);
            const z = Math.sin(theta);

            vertices.push(x * radius, height / 2, z * radius);
            normals.push(0, 1, 0);
            texCoords.push(x * 0.5 + 0.5, z * 0.5 + 0.5);
            tangents.push(1, 0, 0);
        }

        for (let i = 0; i < segments; i++) {
            indices.push(centerIndex, baseIndex + 1 + i, baseIndex + 1 + i + 1);
        }

        super(gl, vertices, normals, texCoords, indices, tangents);
    }
}
