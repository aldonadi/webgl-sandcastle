import { Matrix4 } from '../math/Matrix4.js';
import { ShaderProgram } from '../renderer/ShaderProgram.js';
import { BasicVertexShader, BasicFragmentShader } from '../renderer/Shaders.js';

export class Mesh {
    constructor(gl, vertices, normals, texCoords, indices) {
        this.gl = gl;
        this.modelMatrix = new Matrix4();
        this.normalMatrix = new Matrix4(); // Inverse transpose of model
        this.position = { x: 0, y: 0, z: 0 };

        // Default Material Props
        this.texture = null;
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

        if (indices) {
            this.indexBuffer = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices));
        }
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

    setPosition(x, y, z) {
        this.position = { x, y, z };
        this.updateMatrices();
    }

    updateMatrices() {
        this.modelMatrix.setTranslate(this.position.x, this.position.y, this.position.z);

        // For simple translation, normal matrix is identity (rotation/scale needed only)
        // If we add rotation, we need to invert/transpose.
        // Since our Matrix4 class is basic, and we only translate currently, 
        // Identity is fine for now, OR we just copy rotation part if we had one.
        // TODO: Implement Matrix4.inverse() and Matrix4.transpose() for full support.
        this.normalMatrix.identity();
    }

    draw(gl, camera, light) {
        this.program.use();

        // Attributes
        this.bindAttribute('aPosition', this.vertexBuffer, 3);
        this.bindAttribute('aNormal', this.normalBuffer, 3);
        this.bindAttribute('aTexCoord', this.texCoordBuffer, 2);

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

        gl.uniform3fv(uBaseColor, this.baseColor);
        gl.uniform1f(uSpecular, this.specularIntensity);
        gl.uniform1f(uShininess, this.shininess);

        // Texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(uTexture, 0);

        // Uniforms - Lighting / Camera
        // Assuming light and camera objects passed have properties
        const uLightPos = this.program.getUniformLocation('uLightPos');
        const uLightColor = this.program.getUniformLocation('uLightColor');
        const uAmbient = this.program.getUniformLocation('uAmbientColor');
        const uViewPos = this.program.getUniformLocation('uViewPos');

        if (light) {
            gl.uniform3fv(uLightPos, light.position.elements);
            gl.uniform3fv(uLightColor, light.color);
            gl.uniform3fv(uAmbient, light.ambient);
        } else {
            // Fallback default light
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
