export const ParticleVertexShader = `
  attribute vec3 aPosition;
  attribute vec2 aTexCoord; // Standard quad UVs
  attribute vec4 aColor;    // Per-instance/vertex color
  attribute float aSize;    // Per-instance size
  attribute float aRotation; // Per-instance rotation (radians)

  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  // We don't use ModelMatrix because particles are in World Space usually, 
  // or we build them in buffer in World Space.

  varying vec2 vTexCoord;
  varying vec4 vColor;

  void main() {
    vTexCoord = aTexCoord;
    vColor = aColor;

    // Billboarding Logic
    // 1. Get Center Position (aPosition)
    vec3 center = aPosition;
    
    // 2. View-Aligned Offset
    // Extract Right and Up from View Matrix
    // ViewMatrix = [ Right, Up, Forward, Pos ] (Inverted?)
    // Usually ViewMatrix transforms World -> Camera.
    // Inverse ViewMatrix (Camera World Matrix) has Right/Up vectors in columns 0 and 1.
    // If ViewMatrix is orthogonal:
    vec3 cameraRight = vec3(uViewMatrix[0][0], uViewMatrix[1][0], uViewMatrix[2][0]);
    vec3 cameraUp = vec3(uViewMatrix[0][1], uViewMatrix[1][1], uViewMatrix[2][1]);

    // Rotation
    float c = cos(aRotation);
    float s = sin(aRotation);
    
    // Standard Quad is -0.5 to 0.5 usually?
    // Let's assume aTexCoord is 0..1, so we map to -0.5..0.5
    float offX = (aTexCoord.x - 0.5) * aSize;
    float offY = (aTexCoord.y - 0.5) * aSize;

    // Rotate Offset
    float rX = offX * c - offY * s;
    float rY = offX * s + offY * c;

    // Calculate final vertex position
    vec3 pos = center + (cameraRight * rX) + (cameraUp * rY);

    gl_Position = uProjectionMatrix * uViewMatrix * vec4(pos, 1.0);
  }
`;

export const ParticleFragmentShader = `
  precision mediump float;

  varying vec2 vTexCoord;
  varying vec4 vColor;

  uniform sampler2D uTexture;

  void main() {
    vec4 texColor = texture2D(uTexture, vTexCoord);
    
    // Modulate by vertex color (allows fading alpha and tinting)
    vec4 finalColor = texColor * vColor;
    
    // Alpha Test? Or premultiplied?
    // For now simple alpha blending
    if (finalColor.a < 0.01) discard;

    gl_FragColor = finalColor;
  }
`;

export class ParticleShader {
    constructor(gl) {
        this.gl = gl;
        this.program = this.createProgram(ParticleVertexShader, ParticleFragmentShader);

        this.attribs = {
            position: gl.getAttribLocation(this.program, 'aPosition'),
            texCoord: gl.getAttribLocation(this.program, 'aTexCoord'),
            color: gl.getAttribLocation(this.program, 'aColor'),
            size: gl.getAttribLocation(this.program, 'aSize'),
            rotation: gl.getAttribLocation(this.program, 'aRotation'),
        };

        this.uniforms = {
            viewMatrix: gl.getUniformLocation(this.program, 'uViewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            texture: gl.getUniformLocation(this.program, 'uTexture'),
        };
    }

    createProgram(vSource, fSource) {
        const gl = this.gl;
        const vs = this.compileShader(gl.VERTEX_SHADER, vSource);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fSource);

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error('Particle Shader Link Error:', gl.getProgramInfoLog(prog));
            return null;
        }
        return prog;
    }

    compileShader(type, source) {
        const gl = this.gl;
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error('Particle Shader Compile Error:', gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    use() {
        this.gl.useProgram(this.program);
    }
}
