import { Mesh } from '../Mesh.js';

export class Cone extends Mesh {
    constructor(gl, radius = 0.5, height = 1.0, segments = 16) {
        const vertices = [];
        const normals = [];
        const texCoords = [];
        const tangents = [];
        const indices = [];

        // Cone Tip
        // Tip normal: technically undefined or average of faces. 
        // Let's use Up for simplicity, or interpolate. 
        // Actually, for lighting to look smooth on cone side, we need normal perpendicular to slope.
        // Slope vector: (radius, -height). Normal: (height, radius). Normalized.
        const slopeLen = Math.sqrt(radius * radius + height * height);
        const ny = radius / slopeLen;
        const nxz = height / slopeLen; // Scale x,z by this

        // We build loose triangles for the side to handle different normals at the tip?
        // Or shared tip vertex? Shared tip vertex causes smooth shading at tip which is weird for a sharp point?
        // Usually Cone tip has different normals for each face if flat shaded, but we want smooth round cone.
        // So shared tip vertex with Up normal is bad. Shared tip with "average"?
        // Let's do it by segments.

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = Math.cos(theta);
            const z = Math.sin(theta);
            const u = i / segments;

            // Tip Vertex (duplicated to allow different UVs / wrapping, though pos is same)
            // But what about normal?
            // If we want smooth shading, the normal at the tip should conceptually be... up? 
            // Or average of all sides?
            // A "perfect" cone tip has a singularity. 
            // Let's treat the tip as having the same normal as the base of that segment, but position is top.

            const nx = x * nxz;
            const nz = z * nxz;

            // Top (Tip)
            vertices.push(0, height, 0);
            normals.push(nx, ny, nz);
            texCoords.push(u, 0);
            // Tangent: (-sin, 0, cos)
            tangents.push(-z, 0, x);

            // Bottom Edge
            vertices.push(x * radius, 0, z * radius);
            normals.push(nx, ny, nz);
            texCoords.push(u, 1);
            tangents.push(-z, 0, x);
        }

        // Indices
        // i -> i+1
        // Tip is 2*i, Bottom is 2*i+1
        // Actually I added Tip, Bottom, Tip, Bottom...
        for (let i = 0; i < segments; i++) {
            const tip1 = i * 2;
            const bot1 = tip1 + 1;
            const tip2 = tip1 + 2;
            const bot2 = tip1 + 3;

            // Triangle: Tip1, Bot1, Bot2? No, Tip1 and Tip2 are same pos.
            // We can just use one tip?
            // Triangle: Tip1, Bot1, Bot2.
            indices.push(tip1, bot1, bot2);
        }

        super(gl, vertices, normals, texCoords, indices, tangents);
    }
}
