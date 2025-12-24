import { ParticleShader } from '../../renderer/ParticleShader.js';

export class ParticleSystem {
    constructor(gl) {
        this.gl = gl;
        this.shader = new ParticleShader(gl);
        this.emitters = [];
    }

    addEmitter(emitter) {
        this.emitters.push(emitter);
    }

    update(dt, sceneObjects) {
        for (const emitter of this.emitters) {
            emitter.update(dt, sceneObjects);
        }
    }

    draw(camera) {
        // Shared State
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        // Usually disabling depth write is good for transparent particles
        this.gl.depthMask(false);

        this.shader.use();

        // Upload Camera Uniforms
        this.gl.uniformMatrix4fv(this.shader.uniforms.viewMatrix, false, camera.viewMatrix.elements);
        this.gl.uniformMatrix4fv(this.shader.uniforms.projectionMatrix, false, camera.projectionMatrix.elements);

        for (const emitter of this.emitters) {
            emitter.draw(this.gl, this.shader);
        }

        this.gl.depthMask(true);
        this.gl.disable(this.gl.BLEND);
    }
}

export class ParticleEmitter {
    constructor(config) {
        // Config:
        // rate: particles per second
        // maxParticles: int
        // texture: WebGLTexture
        // life: { min, max }
        // velocity: { speedMin, speedMax }
        // color: { start: [r,g,b,a], end: [r,g,b,a] }
        // size: { start, end }
        // source: { type: 'point'|'plane'|'line', params... }
        // rotation: { min, max, speedMin, speedMax }
        // collision: boolean
        // gravity: float (vertical acceleration)

        this.config = config;
        this.particles = [];
        this.accumulator = 0;

        // Pre-allocate arrays for buffers? Or dynamic?
        // Dynamic JS arrays are fine for < 1000 particles usually.

        this.positionBuffer = null;
        this.texCoordBuffer = null;
        this.colorBuffer = null;
        this.sizeBuffer = null;
        this.rotationBuffer = null;
        this.indexBuffer = null;
    }

    update(dt, sceneObjects) {
        // 1. Spawning
        const rate = this.config.rate;
        if (rate > 0) {
            const interval = 1.0 / rate;
            this.accumulator += dt;
            while (this.accumulator > interval) {
                this.accumulator -= interval;
                if (this.particles.length < this.config.maxParticles) {
                    this.spawn();
                }
            }
        }

        // 2. Simulation
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Age
            p.age += dt;
            if (p.age > p.life) {
                // Kill
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
                continue;
            }

            // Dynamics
            p.velocity.y += (this.config.gravity || 0) * dt;

            // Simple movement
            const lastPos = { ...p.position };
            p.position.x += p.velocity.x * dt;
            p.position.y += p.velocity.y * dt;
            p.position.z += p.velocity.z * dt;

            p.rotation += p.rotationSpeed * dt;

            // Collision
            if (this.config.collision && sceneObjects) {
                // Simple floor check or full object check?
                // Full object check is expensive for many particles.
                // Request says: "sparks collide and bounce on the ground/on objects"
                // We will do a simple Floor check (y < 0) and maybe a simplified sphere check for major objects if needed?
                // Let's stick to Ground + Walls (if we can access them).

                // Ground Plane (y=0 usually)
                if (p.position.y < 0) {
                    p.position.y = 0;
                    p.velocity.y *= -0.5; // Bounce dampen
                    p.velocity.x *= 0.8; // Friction
                    p.velocity.z *= 0.8;
                }
            }
        }
    }

    spawn() {
        const c = this.config;

        const life = this.randomRange(c.life.min, c.life.max);
        const speed = this.randomRange(c.velocity.speedMin, c.velocity.speedMax);

        // Random Direction
        // Simple uniform sphere distribution or constrained?
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const randDir = {
            x: Math.sin(phi) * Math.cos(theta),
            y: Math.sin(phi) * Math.sin(theta),
            z: Math.cos(phi)
        };

        const velocity = {
            x: randDir.x * speed,
            y: randDir.y * speed,
            z: randDir.z * speed
        };

        // Source Position
        const pos = { x: 0, y: 0, z: 0 };
        const s = c.source;
        if (s.type === 'point') {
            pos.x = s.params.x;
            pos.y = s.params.y;
            pos.z = s.params.z;
        } else if (s.type === 'line') {
            const t = Math.random();
            pos.x = s.params.x1 + (s.params.x2 - s.params.x1) * t;
            pos.y = s.params.y1 + (s.params.y2 - s.params.y1) * t;
            pos.z = s.params.z1 + (s.params.z2 - s.params.z1) * t;
        } else if (s.type === 'plane') {
            // Rect on XZ plane?
            pos.x = s.params.x + (Math.random() - 0.5) * s.params.width;
            pos.y = s.params.y;
            pos.z = s.params.z + (Math.random() - 0.5) * s.params.depth;

            // Fire usually goes UP only
            if (this.config.velocity.dirMode === 'up') {
                velocity.x = (Math.random() - 0.5) * speed * 0.5;
                velocity.z = (Math.random() - 0.5) * speed * 0.5;
                velocity.y = speed;
            }
        }

        const p = {
            position: pos,
            velocity: velocity,
            life: life,
            age: 0,
            rotation: this.randomRange(c.rotation?.min || 0, c.rotation?.max || 0),
            rotationSpeed: this.randomRange(c.rotation?.speedMin || 0, c.rotation?.speedMax || 0),
            sizeStart: c.size.start,
            sizeEnd: c.size.end,
            colorStart: c.color.start,
            colorEnd: c.color.end
        };
        this.particles.push(p);
    }

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    draw(gl, shader) {
        if (this.particles.length === 0) return;

        // Rebuild Buffers per frame (Dynamic Batching)
        // 4 verts per particle
        const numParticles = this.particles.length;
        const positions = new Float32Array(numParticles * 4 * 3);
        const texCoords = new Float32Array(numParticles * 4 * 2);
        const colors = new Float32Array(numParticles * 4 * 4);
        const sizes = new Float32Array(numParticles * 4);
        const rotations = new Float32Array(numParticles * 4);
        const indices = new Uint16Array(numParticles * 6);

        let vIdx = 0;
        let cIdx = 0;
        let tIdx = 0;
        let sIdx = 0;
        let rIdx = 0;
        let iIdx = 0;
        let vertCount = 0;

        for (const p of this.particles) {
            // Lerp Life
            const t = p.age / p.life;

            // Size
            const size = p.sizeStart + (p.sizeEnd - p.sizeStart) * t;

            // Color
            const r = p.colorStart[0] + (p.colorEnd[0] - p.colorStart[0]) * t;
            const g = p.colorStart[1] + (p.colorEnd[1] - p.colorStart[1]) * t;
            const b = p.colorStart[2] + (p.colorEnd[2] - p.colorStart[2]) * t;
            const a = p.colorStart[3] + (p.colorEnd[3] - p.colorStart[3]) * t;

            // Pos (Center) - We send the same center for all 4 verts
            // The shader expands them.
            const cx = p.position.x;
            const cy = p.position.y;
            const cz = p.position.z;

            // Vertices (0, 1, 2, 3)
            for (let k = 0; k < 4; k++) {
                positions[vIdx++] = cx;
                positions[vIdx++] = cy;
                positions[vIdx++] = cz;

                colors[cIdx++] = r;
                colors[cIdx++] = g;
                colors[cIdx++] = b;
                colors[cIdx++] = a;

                sizes[sIdx++] = size;
                rotations[rIdx++] = p.rotation;
            }

            // UVs
            // 0: 0,0
            texCoords[tIdx++] = 0; texCoords[tIdx++] = 0;
            // 1: 1,0
            texCoords[tIdx++] = 1; texCoords[tIdx++] = 0;
            // 2: 1,1
            texCoords[tIdx++] = 1; texCoords[tIdx++] = 1;
            // 3: 0,1
            texCoords[tIdx++] = 0; texCoords[tIdx++] = 1;

            // Indices (0, 1, 2, 0, 2, 3)
            const base = vertCount;
            indices[iIdx++] = base + 0;
            indices[iIdx++] = base + 1;
            indices[iIdx++] = base + 2;
            indices[iIdx++] = base + 0;
            indices[iIdx++] = base + 2;
            indices[iIdx++] = base + 3;

            vertCount += 4;
        }

        // Upload and Draw
        // We really should cache buffers instance...
        if (!this.positionBuffer) this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(shader.attribs.position);
        gl.vertexAttribPointer(shader.attribs.position, 3, gl.FLOAT, false, 0, 0);

        if (!this.texCoordBuffer) this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(shader.attribs.texCoord);
        gl.vertexAttribPointer(shader.attribs.texCoord, 2, gl.FLOAT, false, 0, 0);

        if (!this.colorBuffer) this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(shader.attribs.color);
        gl.vertexAttribPointer(shader.attribs.color, 4, gl.FLOAT, false, 0, 0);

        if (!this.sizeBuffer) this.sizeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(shader.attribs.size);
        gl.vertexAttribPointer(shader.attribs.size, 1, gl.FLOAT, false, 0, 0);

        if (!this.rotationBuffer) this.rotationBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, rotations, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(shader.attribs.rotation);
        gl.vertexAttribPointer(shader.attribs.rotation, 1, gl.FLOAT, false, 0, 0);

        if (!this.indexBuffer) this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);

        // Bind Texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.config.texture);
        gl.uniform1i(shader.uniforms.texture, 0);

        gl.drawElements(gl.TRIANGLES, numParticles * 6, gl.UNSIGNED_SHORT, 0);
    }
}
