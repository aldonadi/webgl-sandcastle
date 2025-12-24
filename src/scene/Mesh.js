import { Matrix4 } from '../math/Matrix4.js';
import { ShaderProgram } from '../renderer/ShaderProgram.js';
import { BasicVertexShader, BasicFragmentShader } from '../renderer/Shaders.js';

export class Mesh {
    // Add tangents to constructor params
    constructor(gl, vertices, normals, texCoords, indices, tangents) {
        this.gl = gl;
        this.modelMatrix = new Matrix4();
        this.normalMatrix = new Matrix4(); // Inverse transpose of model
        this.position = { x: 0, y: 0, z: 0 };

        // Default Material Props
        this.texture = null;
        this.normalMap = null; // New Normal Map
        this.baseColor = [1, 1, 1];
        this.specularIntensity = 0.5;
        this.shininess = 32.0;

        this.indicesCount = indices ? indices.length : 0;

        // Create Program
        this.program = new ShaderProgram(gl, BasicVertexShader, BasicFragmentShader);

        // Buffers
        this.vertexBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(vertices));
        this.normalBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(normals));
        this.texCoordBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(texCoords));

        // Tangent Buffer
        if (tangents) {
            this.tangentBuffer = this.createBuffer(gl.ARRAY_BUFFER, new Float32Array(tangents));
        } else {
            // Create dummy tangents if missing, to prevent errors? 
            // Better: Just don't bind if not present, but shader expects it.
            // For now let's assume primitives will provide it, or we fill with (1,0,0)
            const count = vertices.length;
            const dummyTangents = new Float32Array(count);
            // simple default tangent (1,0,0)
            for (let i = 0; i < count; i += 3) { dummyTangents[i] = 1; dummyTangents[i + 1] = 0; dummyTangents[i + 2] = 0; }
            this.tangentBuffer = this.createBuffer(gl.ARRAY_BUFFER, dummyTangents);
        }

        if (indices) {
            this.indexBuffer = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));
        }

        // Collision
        this.isCollidable = true;
    }

    createBuffer(type, data) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
        return buffer;
    }

    setTexture(texture) {
        this.texture = texture;
    }

    setNormalMap(texture) {
        this.normalMap = texture;
    }

    setPosition(x, y, z) {
        this.position = { x, y, z };
        this.updateMatrices();
    }

    setRotation(x, y, z) {
        this.rotation = { x, y, z }; // Euler angles in degrees
        this.updateMatrices();
    }

    setScale(x, y, z) {
        this.scale = { x, y, z };
        this.updateMatrices();
    }

    getAABB() {
        // Simple AABB based on Position and Scale
        // Assumes unit/centered primitive which is common for generated spheres/cubes
        // Position is center.
        // Scale is radius or half-width.

        const x = this.position.x;
        const y = this.position.y;
        const z = this.position.z;

        // Default scale 1
        const sx = this.scale ? this.scale.x : 1.0;
        const sy = this.scale ? this.scale.y : 1.0;
        const sz = this.scale ? this.scale.z : 1.0;

        // Assuming base size 1.0 (radius 0.5 for sphere, half-width 0.5 for cube)
        // Actually Cube creates vertices from -0.5 to 0.5.
        // Sphere creates Radius passed in. But here Mesh doesn't know.
        // But we pass scale to Cube/Sphere usually to resize them.
        // Let's assume the "base" size is radius/extent 0.5 (diameter 1) effectively.
        // Except for Sphere where we explicitly passed 0.5...
        // Let's use a "radius" of 0.5 * scale as a safe bet for generic Mesh/Cube.

        const extentX = 0.5 * sx;
        const extentY = 0.5 * sy;
        const extentZ = 0.5 * sz;

        return {
            min: { x: x - extentX, y: y - extentY, z: z - extentZ },
            max: { x: x + extentX, y: y + extentY, z: z + extentZ }
        };
    }

    updateMatrices() {
        this.modelMatrix.identity();

        // T * R * S
        this.modelMatrix.translate(this.position.x, this.position.y, this.position.z);

        if (this.rotation) {
            this.modelMatrix.rotate(this.rotation.x * Math.PI / 180, 1, 0, 0);
            this.modelMatrix.rotate(this.rotation.y * Math.PI / 180, 0, 1, 0);
            this.modelMatrix.rotate(this.rotation.z * Math.PI / 180, 0, 0, 1);
        }

        if (this.scale) {
            this.modelMatrix.scale(this.scale.x, this.scale.y, this.scale.z);
        }

        // Normal Matrix: Inverse Transpose of Model Matrix (upper 3x3)
        // Since we don't have full inverse/transpose support yet, we approximate:
        // For Rotation: R^-1 = R^T.
        // For Scale: S^-1 = 1/S.
        // If Uniform Scale: Normal Matrix = Model Matrix (rotation part). Scale cancels out if we normalize?
        // Actually, if we have non-uniform scale, normals get distorted.
        // We MUST inverse-transpose.

        // Since I can't easily invert a full 4x4 with the current class without writing a lot of code,
        // I will re-compose the normal matrix: T_norm * R_norm * S_norm
        // Normal Matrix should be (M^-1)^T.
        // M = T * R * S
        // M^-1 = S^-1 * R^-1 * T^-1
        // (M^-1)^T = (T^-1)^T * (R^-1)^T * (S^-1)^T
        // Translation doesn't affect normals (w=0).
        // So we only care about R and S.
        // N = R * S^-1

        this.normalMatrix.identity();
        if (this.rotation) {
            this.normalMatrix.rotate(this.rotation.x * Math.PI / 180, 1, 0, 0);
            this.normalMatrix.rotate(this.rotation.y * Math.PI / 180, 0, 1, 0);
            this.normalMatrix.rotate(this.rotation.z * Math.PI / 180, 0, 0, 1);
        }
        if (this.scale) {
            // S^-1
            this.normalMatrix.scale(1 / this.scale.x, 1 / this.scale.y, 1 / this.scale.z);
        }
    }

    draw(gl, camera, light) {
        this.program.use();

        // Attributes
        this.bindAttribute('aPosition', this.vertexBuffer, 3);
        this.bindAttribute('aNormal', this.normalBuffer, 3);
        this.bindAttribute('aTexCoord', this.texCoordBuffer, 2);
        this.bindAttribute('aTangent', this.tangentBuffer, 3);

        // Uniforms - Matrices
        const uModel = this.program.getUniformLocation('uModelMatrix');
        const uView = this.program.getUniformLocation('uViewMatrix');
        const uProjection = this.program.getUniformLocation('uProjectionMatrix');
        const uNormalMat = this.program.getUniformLocation('uNormalMatrix');

        gl.uniformMatrix4fv(uModel, false, this.modelMatrix.elements);
        gl.uniformMatrix4fv(uView, false, camera.viewMatrix.elements);
        gl.uniformMatrix4fv(uProjection, false, camera.projectionMatrix.elements);
        gl.uniformMatrix4fv(uNormalMat, false, this.normalMatrix.elements);

        // Uniforms - Material
        const uBaseColor = this.program.getUniformLocation('uBaseColor');
        const uSpecular = this.program.getUniformLocation('uSpecularIntensity');
        const uShininess = this.program.getUniformLocation('uShininess');
        const uTexture = this.program.getUniformLocation('uTexture');

        // Normal Map Uniforms
        const uNormalMap = this.program.getUniformLocation('uNormalMap');
        const uHasNormalMap = this.program.getUniformLocation('uHasNormalMap');

        gl.uniform3fv(uBaseColor, this.baseColor);
        gl.uniform1f(uSpecular, this.specularIntensity);
        gl.uniform1f(uShininess, this.shininess);

        // Diffuse Texture Unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(uTexture, 0);

        // Normal Map Texture Unit 1
        if (this.normalMap) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.normalMap);
            gl.uniform1i(uNormalMap, 1);
            gl.uniform1i(uHasNormalMap, 1); // True
        } else {
            gl.uniform1i(uHasNormalMap, 0); // False
        }

        // Uniforms - Lighting / Camera
        const uLightPos = this.program.getUniformLocation('uLightPos');
        const uLightColor = this.program.getUniformLocation('uLightColor');
        const uAmbient = this.program.getUniformLocation('uAmbientColor');
        const uViewPos = this.program.getUniformLocation('uViewPos');

        if (light) {
            gl.uniform3fv(uLightPos, light.position.elements);
            gl.uniform3fv(uLightColor, light.color);
            gl.uniform3fv(uAmbient, light.ambient);
        } else {
            gl.uniform3f(uLightPos, 0, 5, 0);
            gl.uniform3f(uLightColor, 1, 1, 1);
            gl.uniform3f(uAmbient, 0.2, 0.2, 0.2);
        }

        gl.uniform3fv(uViewPos, camera.position.elements);

        // Draw
        if (this.indicesCount > 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.indicesCount, gl.UNSIGNED_SHORT, 0);
        }
    }

    bindAttribute(name, buffer, size) {
        const location = this.program.getAttributeLocation(name);
        if (location !== -1) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
            this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(location);
        }
    }
}
