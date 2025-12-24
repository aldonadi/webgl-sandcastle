import { Matrix4 } from '../math/Matrix4.js';
import { Vector3 } from '../math/Vector3.js';
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
        this.emissive = [0, 0, 0]; // Default no emission

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

        // Bounding Sphere (Local)
        this.boundingSphere = this.computeBoundingSphere(vertices);
    }

    computeBoundingSphere(vertices) {
        // Simple approximation: AABB Center + Radius
        // Or Min/Max extents
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }

        const center = {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            z: (minZ + maxZ) / 2
        };

        // Radius: Distance to furthest point (or just box corner)
        // Corner approximation is safer for Box
        const dx = (maxX - minX) / 2;
        const dy = (maxY - minY) / 2;
        const dz = (maxZ - minZ) / 2;
        const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);

        return { center, radius };
    }

    getWorldBoundingSphere() {
        // Apply Model Matrix transformations to sphere
        // Since we handle R, T, S separately:

        // 1. Scale
        const sx = this.scale ? this.scale.x : 1.0;
        const sy = this.scale ? this.scale.y : 1.0;
        const sz = this.scale ? this.scale.z : 1.0;
        const maxScale = Math.max(Math.abs(sx), Math.max(Math.abs(sy), Math.abs(sz)));

        // 2. Rotate (Center handles it if relative to origin of mesh?)
        // Mesh center is usually (0,0,0) locally, but 'computeBoundingSphere' finds the geometric center.
        // We need to rotate the Local Geometric Center.

        // Let's rely on updateMatrices logic for T * R * S
        // Center_World = Model * Center_Local

        const c = this.boundingSphere.center;
        // Optimization: if c is (0,0,0) (common for centered primitives), we skip rotation/scale on center.
        // But CastleBuilder builds complex meshes where center != 0.

        // Manual Transform (Model Matrix)
        // P' = T * R * S * P

        // Scale
        let x = c.x * sx;
        let y = c.y * sy;
        let z = c.z * sz;

        // Rotate
        if (this.rotation) {
            const rx = this.rotation.x * Math.PI / 180;
            const ry = this.rotation.y * Math.PI / 180;
            const rz = this.rotation.z * Math.PI / 180;

            // X
            let dy = y; let dz = z;
            y = dy * Math.cos(rx) - dz * Math.sin(rx);
            z = dy * Math.sin(rx) + dz * Math.cos(rx);

            // Y
            let dx = x; dz = z;
            x = dx * Math.cos(ry) + dz * Math.sin(ry);
            z = -dx * Math.sin(ry) + dz * Math.cos(ry);

            // Z
            dx = x; dy = y;
            x = dx * Math.cos(rz) - dy * Math.sin(rz);
            y = dx * Math.sin(rz) + dy * Math.cos(rz);
        }

        // Translate
        x += this.position.x;
        y += this.position.y;
        z += this.position.z;

        return {
            center: { x, y, z },
            radius: this.boundingSphere.radius * maxScale
        };
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

    resolveCollision(player) {
        if (!this.isCollidable) return null; // Pass-through

        // 1. Transform Player World Position to Local Space
        // Model = T * R * S
        // Inverse = S^-1 * R^-1 * T^-1

        const localPos = new Vector3(player.position.x, player.position.y, player.position.z);

        // T^-1
        localPos.x -= this.position.x;
        localPos.y -= this.position.y;
        localPos.z -= this.position.z;

        // R^-1 (Transpose Rotation Matrix constructed from Euler)
        // We need to support the order. normalize Rotation: Z * Y * X usually?
        // In updateMatrices: rotate X, then Y, then Z.
        // So M_rot = Rz * Ry * Rx.
        // Inverse = Rx^T * Ry^T * Rz^T.

        // To avoid Matrix Math complexity without a full library, let's reverse the rotations manually.
        // Rotate -Z (around Z)
        // Rotate -Y (around Y)
        // Rotate -X (around X)

        const radX = (this.rotation ? this.rotation.x : 0) * Math.PI / 180;
        const radY = (this.rotation ? this.rotation.y : 0) * Math.PI / 180;
        const radZ = (this.rotation ? this.rotation.z : 0) * Math.PI / 180;

        // Rotate -Z
        let dx = localPos.x, dy = localPos.y; // Z axis rotation affects X,Y
        localPos.x = dx * Math.cos(-radZ) - dy * Math.sin(-radZ);
        localPos.y = dx * Math.sin(-radZ) + dy * Math.cos(-radZ);

        // Rotate -Y (affects X, Z)
        dx = localPos.x; let dz = localPos.z;
        localPos.x = dx * Math.cos(-radY) + dz * Math.sin(-radY); // Note: standard rotation sign
        localPos.z = -dx * Math.sin(-radY) + dz * Math.cos(-radY);

        // Rotate -X (affects Y, Z)
        dy = localPos.y; dz = localPos.z;
        localPos.y = dy * Math.cos(-radX) - dz * Math.sin(-radX);
        localPos.z = dy * Math.sin(-radX) + dz * Math.cos(-radX);

        // S^-1
        // For collision, we want to check against Unit Box (-0.5 to 0.5)..
        // BUT if we scale the player position down, we must also scale the player radius? 
        // Scaling a sphere defines an ellipsoid.
        // A better approach is: Keep scaling applied to the Object Dimensions, work in "Unrotated" World Space?
        // No, Local Space AABB (-0.5 to 0.5) is easier if we scale space.

        const sx = this.scale ? this.scale.x : 1.0;
        const sy = this.scale ? this.scale.y : 1.0;
        const sz = this.scale ? this.scale.z : 1.0;

        localPos.x /= sx;
        localPos.y /= sy;
        localPos.z /= sz;

        // Now we are in Unit Local Space (approximating uniform scale validity for Sphere)
        // Player is a sphere. In non-uniform scaled space, it's an ellipsoid.
        // We approximation: Use smallest scale factor to scale radius? 
        // Or just check Axis Aligned Box distance.

        // Box Bounds: -0.5 to 0.5 (since we scaled by full scale, assuming base Cube is 1x1x1)
        // Note: Torus/Cylinder might differ. Assume Cube logic for "Walls".

        const half = 0.5;
        const min = new Vector3(-half, -half, -half);
        const max = new Vector3(half, half, half);

        // Closest Point on Box to Point
        const closest = new Vector3(
            Math.max(min.x, Math.min(max.x, localPos.x)),
            Math.max(min.y, Math.min(max.y, localPos.y)),
            Math.max(min.z, Math.min(max.z, localPos.z))
        );

        // Vector from Closest to Center
        const diff = new Vector3(localPos.x, localPos.y, localPos.z).subVectors(localPos, closest);
        const distSq = diff.elements[0] * diff.elements[0] + diff.elements[1] * diff.elements[1] + diff.elements[2] * diff.elements[2];

        // Scaled Radius Needed?
        // If we shrank space by S, we must shrink Radius by S?
        // Conservative: Scale radius by 1/max(scale) (safest) 
        // If scale is huge, radius is tiny. If scale is small, radius is huge.
        // Let's use 1.0 / min(scale) to be safe (detect collision earlier)?
        const minScale = Math.min(sx, Math.min(sy, sz));
        const localRadius = player.radius / minScale;

        if (distSq > localRadius * localRadius && distSq > 0.000001) return null; // No hit

        // Collision Detected
        // Need Normal and Depth in World Space

        let normalLocal = new Vector3(0, 1, 0);
        let penetrationLocal = 0;

        if (distSq > 0.000001) {
            // Outside box (touching face/edge/corner)
            const dist = Math.sqrt(distSq);
            normalLocal = diff.normalize();
            penetrationLocal = localRadius - dist;
        } else {
            // Inside box! (Center is inside)
            // Find closest wall to push out
            // Distances to faces
            const dX = half - Math.abs(localPos.x);
            const dY = half - Math.abs(localPos.y);
            const dZ = half - Math.abs(localPos.z);

            if (dX < dY && dX < dZ) {
                normalLocal.set(Math.sign(localPos.x), 0, 0);
                penetrationLocal = dX + localRadius; // Push out fully + radius check
            } else if (dY < dZ) {
                normalLocal.set(0, Math.sign(localPos.y), 0);
                penetrationLocal = dY + localRadius;
            } else {
                normalLocal.set(0, 0, Math.sign(localPos.z));
                penetrationLocal = dZ + localRadius;
            }
        }

        // Transform Normal to World
        // N_world = R * N_local (ignore scale for normal usually, or inverse transpose if non-uniform)
        // Simplest: Rotate by R
        const worldNormal = normalLocal.clone();
        // Rotate X
        dy = worldNormal.y; dz = worldNormal.z;
        worldNormal.y = dy * Math.cos(radX) - dz * Math.sin(radX);
        worldNormal.z = dy * Math.sin(radX) + dz * Math.cos(radX);
        // Rotate Y
        dx = worldNormal.x; dz = worldNormal.z;
        worldNormal.x = dx * Math.cos(radY) + dz * Math.sin(radY); // Check sign convention
        worldNormal.z = -dx * Math.sin(radY) + dz * Math.cos(radY);
        // Rotate Z
        dx = worldNormal.x; dy = worldNormal.y;
        worldNormal.x = dx * Math.cos(radZ) - dy * Math.sin(radZ);
        worldNormal.y = dx * Math.sin(radZ) + dy * Math.cos(radZ);

        worldNormal.normalize();

        // Transform Depth
        // Approximate: Scale by relevant axis scale?
        // Dot product normal with scale vector?
        const scaleVec = new Vector3(sx, sy, sz);
        // Project scale onto normal? 
        // Simple conservative: depth * minScale (if we shrank world, we must expand depth back)
        // Wait, we divided World by Scale to get Local.
        // So Depth_World = Depth_Local * Scale.
        const worldDepth = penetrationLocal * Math.max(sx, Math.max(sy, sz));

        return {
            normal: worldNormal,
            depth: worldDepth,
            localY: localPos.y + half // 0 to 1 relative height approx?
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

    draw(gl, camera, light, depthTexture) {
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
        const uEmissive = this.program.getUniformLocation('uEmissive');
        const uTexture = this.program.getUniformLocation('uTexture');
        const uDepthMap = this.program.getUniformLocation('uDepthMap');
        const uResolution = this.program.getUniformLocation('uResolution');
        const uNearFar = this.program.getUniformLocation('uNearFar'); // Near, Far

        // Normal Map Uniforms
        const uNormalMap = this.program.getUniformLocation('uNormalMap');
        const uHasNormalMap = this.program.getUniformLocation('uHasNormalMap');

        gl.uniform3fv(uBaseColor, this.baseColor);
        gl.uniform1f(uSpecular, this.specularIntensity);
        gl.uniform1f(uShininess, this.shininess);
        gl.uniform3fv(uEmissive, this.emissive);

        // Diffuse Texture Unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(uTexture, 0);

        // Normal Map Texture Unit 1
        if (this.normalMap) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.normalMap);
            gl.uniform1i(uNormalMap, 1);
            gl.uniform1i(uHasNormalMap, 1);
        } else {
            gl.uniform1i(uHasNormalMap, 0);
        }

        // Depth Texture Unit 2
        if (depthTexture) {
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, depthTexture);
            gl.uniform1i(uDepthMap, 2);
            gl.uniform2f(uResolution, gl.canvas.width, gl.canvas.height);
            // Hardcoding Near/Far for now or extract from camera?
            // Camera doesn't publicly expose Near/Far easily in Matrix4 helper...
            // Let's assume standard perspective: 0.1, 100.0
            gl.uniform2f(uNearFar, 0.1, 100.0);
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

    subdivide() {
        // Simple 1-to-4 Subdivision for Triangles
        // Iterate current indices
        if (!this.indicesCount) return;

        // We need to read back data from buffers? 
        // Or assume we still have the arrays if we store them. 
        // We didn't store raw arrays in "this"! We only sent to GPU.
        // Critical Flaw in current Mesh class: Data not retained.
        // We must modify Constructor to retain data or can't subdivide post-creation.
        // Actually, CastleBuilder creates meshes then adds to scene.
        // We can call subdivide BEFORE constructor? Or modify Mesh to store data.
        // Let's rely on the fact we usually create Mesh then modify, 
        // but current Mesh constructor sends to GPU immediately.

        // Workaround: We can't implement subdivide *inside* Mesh efficiently without refactoring Constructor.
        // Alternative: Implement a static helper `GeometryUtils.subdivide(vertices, indices...)` 
        // that returns new arrays, then pass to Mesh constructor.
        console.warn("Subdivision not supported on already uploaded Mesh without CPU retention.");
    }
}
