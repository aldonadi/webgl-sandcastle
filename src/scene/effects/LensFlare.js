import { Plane } from '../primitives/Plane.js';
import { Matrix4 } from '../../math/Matrix4.js';

/**
 * Manages the Lens Flare effect.
 * It renders a set of 2D sprites (Planes) in screen space or 
 * simply billboards in world space that track the light.
 * 
 * Screen Space approach is best for "Lens" artifacts.
 * 
 * Simplified Approach for WebGL 1.0 without custom Ortho shader setup just yet:
 * We will create a list of Flare Sprites (Planes).
 * We will position them in World Space but essentially "locked" to the camera-light vector.
 * Actually, true lens flares are 2D screen space. 
 * 
 * If we use 3D planes, they might intersect geometry or rotate weirdly.
 * BUT, since we have a full 3D engine, we can just calculate the 3D position 
 * of the flares along the ray from Light to Camera Position.
 * 
 * Ray L -> C.
 * Flare 1 is at L.
 * Flare 2 is at L + (C-L)*0.2
 * Flare 3 is at L + (C-L)*0.5
 * etc.
 * 
 * And we make them Billboard (always face camera).
 */
export class LensFlare {
    constructor(gl, texGen) {
        this.gl = gl;
        this.flares = [];
        this.lightPos = { x: 0, y: 0, z: 0 };

        // Create Textures
        this.texSun = texGen.createFlareTexture(256, 256, { color: '255, 255, 200', core: 0.2 });
        this.texFlare1 = texGen.createFlareTexture(128, 128, { color: '255, 200, 200', core: 0.0 }); // Reddish
        this.texFlare2 = texGen.createFlareTexture(64, 64, { color: '200, 255, 200', core: 0.0 }); // Greenish
        this.texFlare3 = texGen.createFlareTexture(128, 128, { color: '200, 200, 255', core: 0.0 }); // Bluish

        // Create Sprites
        // Sun - Large, at source
        this.addFlare(this.texSun, 20.0, 0.0);
        // Artifacts - smaller, along the path
        this.addFlare(this.texFlare1, 1.0, 0.4);
        this.addFlare(this.texFlare2, 0.5, 0.6);
        this.addFlare(this.texFlare3, 0.8, 0.8);
        this.addFlare(this.texFlare2, 0.4, 1.2); // Anamorphic-ish? 
    }

    addFlare(texture, size, distanceFactor) {
        // We use a Plane for the sprite.
        const mesh = new Plane(this.gl, 1.0); // Base size 1
        mesh.setTexture(texture);
        // Disable lighting for flares? They should be emissive.
        // Our shader uses uBaseColor * Texture. 
        // If we set uSpecular/Diffuse to 0, it relies on Ambient?
        // Actually our shader isn't designed for "Unlit" / "Emissive".
        // Hack: Set huge ambient or BaseColor + Light.
        // Or set uLightColor to ensure it's bright.
        // We will just set shininess 0, specular 0.
        mesh.baseColor = [1, 1, 1];
        mesh.specularIntensity = 0.0;

        // Custom prop to track placement
        mesh.flareSize = size;
        mesh.distFactor = distanceFactor; // 0 = at light, 1 = at camera (bad), >1 = behind camera?

        this.flares.push(mesh);
    }

    update(lightPos, camera) {
        // Calculate vector from Light to Camera
        const lx = lightPos.position.elements[0];
        const ly = lightPos.position.elements[1];
        const lz = lightPos.position.elements[2];

        const cx = camera.position.x;
        const cy = camera.position.y;
        const cz = camera.position.z;

        // Vector L -> C
        const dx = cx - lx;
        const dy = cy - ly;
        const dz = cz - lz;

        // Update positions
        for (const flare of this.flares) {
            // Pos = L + (L->C) * factor
            // Actually, lens flares usually appear symmetrically around the screen center, 
            // relative to the light's screen position. 
            // 3D positioning along the view ray is a "volumetric" approximation.
            // Let's try the 3D line approach first.

            // Factor 0 = Sun. Factor 0.5 = Halfway.
            const t = flare.distFactor;

            // Allow flares to "pass" the camera? 
            // If we just place them in 3D, if the sun is behind a wall, the flare might be in front of the wall?
            // Yes, that's a problem with 3D billboards. Real flares are post-process.
            // But for this simplified engine, 3D billboards are the only easy way without Framebuffers.
            // Checking occlusion is hard without reading depth buffer.
            // We will ignore occlusion (Lens flare shines through walls!) - "God Mode" sun.

            // Actually, let's keep them close to the light source to minimize wall clipping?
            // Or just put them really far away?
            // "Sun" should be infinitely far away.
            // If we treat L as a point in the scene (which it is), we place flares between L and C.

            // Move Flare
            const fx = lx + dx * t;
            const fy = ly + dy * t;
            const fz = lz + dz * t;

            flare.setPosition(fx, fy, fz);

            // Billboard Rotation: Face Camera
            // Ideally: Matrix LookAt(Flare, Camera, Up).
            // Our Mesh only supports Euler rotation.
            // Simple approach: Use Camera's Yaw/Pitch?
            // A billboard plane should have the same rotation as the camera (inverse view).
            // Camera View Matrix rotates World->View.
            // If we apply the inverse of View Rotation to the object, it faces the camera.
            // Camera stores yaw/pitch.
            // Plane defaults to facing Up (0,1,0). 
            // If we rotate Plane 90 on X, it faces Z (Forward).
            // Then apply Camera Yaw/Pitch.

            // Let's simplify: Rotate plane to look at camera?
            // Too much math for `update`.
            // Hack: Just set rotation to match camera.yaw, camera.pitch?
            // Camera yaw is rotation around Y. Pitch is X.
            // We want the plane normal to point to camera.

            // Let's just blindly copy camera yaw/pitch and see.
            // Camera looks at -Z.
            // Plane normal is +Y.
            // Rotate Plane 90 on X -> Normal is +Z.
            // Rotate Plane 180 on Y -> Normal is -Z.
            // Now it matches Camera forward. 
            // So if we rotate Plane by Camera Yaw/Pitch, it should stay aligned?

            // Wait, Camera rotates the WORLD locally. 
            // Object needs to rotate to match Camera frame.
            flare.setRotation(-camera.pitch, -camera.yaw, 0);
            // Note: Camera pitch/yaw signs might need flipping.
            // Also need to pre-rotate plane to face Forward.
            // Plane base handles: Plane is XZ. Normal Y.
            // We want it vertical.

            // We'll update the Mesh rotation logic or manually billboarding in updateMatrices?
            // Since Mesh.setRotation is Euler, let's just use that.
            // Trial and error for alignment :)

            flare.setScale(flare.flareSize, 1.0, flare.flareSize); // XZ scaling for Plane
        }
    }

    draw(gl, camera) {
        // Disable Depth Write? So flares don't occlude each other weirdly?
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending

        for (const flare of this.flares) {
            // Hack: manually rotate plane to be billboard?
            // Actually, easier hack:
            // Just assume we calculated rotation in update().

            // We need to rotate the "Vertical Plane" to face camera.
            // Plane is horizontal.
            // Rotate 90 X first.
            // Then rotate by -Yaw.
            // Then rotate by -Pitch.

            // We can compose this in mesh.rotation? 
            // Mesh applies R_x, R_y, R_z.
            // This is order dependent.

            const rPitch = -camera.pitch;
            const rYaw = -camera.yaw;

            // Plane (Y-up) -> 90 X -> (Z-up/forward) -> Yaw -> Pitch.
            // Mesh.js does X then Y then Z.
            // So: X = 90 + Pitch?
            // Y = Yaw?

            flare.setRotation(90 + rPitch, rYaw, 0);

            flare.draw(gl, camera, null); // No light needed
        }

        gl.disable(gl.BLEND);
        gl.depthMask(true);
    }
}
