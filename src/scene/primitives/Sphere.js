import { Mesh } from '../Mesh.js';

export class Sphere extends Mesh {
    constructor(gl, radius = 1.0, latitudeBands = 30, longitudeBands = 30) {

        const vertices = [];
        const normals = [];
        const texCoords = [];
        const tangents = [];

        for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            const theta = latNumber * Math.PI / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                const phi = longNumber * 2 * Math.PI / longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                const u = 1 - (longNumber / longitudeBands);
                const v = 1 - (latNumber / latitudeBands);

                // Position
                vertices.push(radius * x);
                vertices.push(radius * y);
                vertices.push(radius * z);

                // Normal (Normalized position for sphere at origin)
                normals.push(x);
                normals.push(y);
                normals.push(z);

                // UV
                texCoords.push(u);
                texCoords.push(v);

                // Tangent (Tangent checks)
                // Tangent is perpendicular to Normal and Up?
                // Standard UV mapping: Tangent points along +U (horizontal)
                // Tangent = derivative of P with respect to phi (longitude)
                // dP/dphi = (-sinPhi*sinTheta, 0, cosPhi*sinTheta)
                // But simplified: (-sinPhi, 0, cosPhi) is usually good enough for spheres
                // unless at poles where sinTheta = 0.

                let tx = -sinPhi;
                let ty = 0;
                let tz = cosPhi;

                // Normalize
                const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
                if (tLen > 0.0001) {
                    tx /= tLen;
                    ty /= tLen;
                    tz /= tLen;
                } else {
                    // At poles, pick an arbitrary tangent
                    tx = 1; ty = 0; tz = 0;
                }

                tangents.push(tx);
                tangents.push(ty);
                tangents.push(tz);
            }
        }

        const indices = [];
        for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
                const first = (latNumber * (longitudeBands + 1)) + longNumber;
                const second = first + longitudeBands + 1;

                indices.push(first);
                indices.push(second);
                indices.push(first + 1);

                indices.push(second);
                indices.push(second + 1);
                indices.push(first + 1);
            }
        }

        super(gl, vertices, normals, texCoords, indices, tangents);
    }
}
