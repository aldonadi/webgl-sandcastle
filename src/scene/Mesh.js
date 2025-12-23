import { Matrix4 } from '../math/Matrix4.js';
import { ShaderProgram } from '../renderer/ShaderProgram.js';
import { BasicVertexShader, BasicFragmentShader } from '../renderer/Shaders.js';

export class Mesh {
    constructor(gl, vertices, colors, indices) {
        this.gl = gl;
        this.modelMatrix = new Matrix4();
        this.position = { x: 0, y: 0, z: 0 };
        this.indicesCount = indices ? indices.length : 0;

        // Create Program
        this.program = new ShaderProgram(gl, BasicVertexShader, BasicFragmentShader);

        // Buffers
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        if (indices) {
            this.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        }
    }

    setPosition(x, y, z) {
        this.position = { x, y, z };
        this.modelMatrix.setTranslate(x, y, z);
    }

    draw(gl, camera) {
        this.program.use();

        // Attributes
        const aPosition = this.program.getAttributeLocation('aPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const aColor = this.program.getAttributeLocation('aColor');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aColor);

        // Uniforms
        const uModel = this.program.getUniformLocation('uModelMatrix');
        const uView = this.program.getUniformLocation('uViewMatrix');
        const uProjection = this.program.getUniformLocation('uProjectionMatrix');

        gl.uniformMatrix4fv(uModel, false, this.modelMatrix.elements);
        gl.uniformMatrix4fv(uView, false, camera.viewMatrix.elements);
        gl.uniformMatrix4fv(uProjection, false, camera.projectionMatrix.elements);

        // Draw
        if (this.indicesCount > 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.indicesCount, gl.UNSIGNED_SHORT, 0);
        } else {
            // Assume triangles if no indices (not implemented for simple Mesh constructor here)
        }
    }
}
