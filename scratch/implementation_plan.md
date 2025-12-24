# Epic Sandcastle & Graphics Upgrade

## Goal Description
Expand the scene into a massive, elaborate procedural sandcastle and improve visual fidelity by implementing "Soft Seams" (Depth-based blending) and Mesh Subdivision ("geometry smoothing").

## User Review Required
> [!IMPORTANT]
> "Geometry smoothing in the fragment shader by doing vertex dividing" is technically contradictory.
> **Interpretation**: 
> 1. **Vertex Dividing**: Implement CPU-side Mesh Subdivision (increasing polygon count) to smooth silhouettes.
> 2. **Fragment Shader Smoothing**: Implement **Depth-Based Edge Softening** (reading a Depth Texture) to visually blend intersecting objects (eliminating hard clipping lines).

## Proposed Changes

### Renderer Engine
#### [MODIFY] [Renderer.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/renderer/Renderer.js)
- Implement **Depth Pre-Pass**:
    - Create Framebuffer Object (FBO) with Depth Texture.
    - Add `renderDepth(scene)` method.
    - Bind Depth Texture to slot 2 for Main Pass.
    - Update `render` to call `renderDepth` first.

### Shaders
#### [MODIFY] [Shaders.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/renderer/Shaders.js)
- **BasicFragmentShader**:
    - Add `uniform sampler2D uDepthMap;`
    - Add `uniform vec2 uResolution;`
    - Calculate **Linear Depth** from `gl_FragCoord.z` and `texture2D(uDepthMap)`.
    - Calculate `float softness = clamp((sceneDepth - fragDepth) * hardness, 0.0, 1.0);`
    - Use `softness` to blend `vNormal` (fake bevel) or modify `gl_FragColor` (fog/AO effect) to smooth the seam.

### Geometry
#### [MODIFY] [Mesh.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/scene/Mesh.js)
- Add `subdivide()` method:
    - Iterate `this.indices` (triangles).
    - Split each triangle into 4 smaller triangles (midpoints).
    - Update `vertices`, `normals`, `texCoords`, `indices`.
    - "Average" new vertices to smooth geometry (Loop-style approximation for spheres, linear for cubes).

### Scene Generation
#### [NEW] [CastleBuilder.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/scene/CastleBuilder.js)
- Class `CastleBuilder`
- Method `build(scene, collidables)`:
    - Procedurally generate a large layout:
        - **Outer Walls**: Large perimeter.
        - **Towers**: Height variation, conical roofs.
        - **Keep**: Massive central structure complex.
        - **Details**: Merlons (crenellations), arches, buttresses.
    - Apply `subdivide()` to critical meshes for quality.

#### [MODIFY] [main.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/main.js)
- Replace hardcoded castle with `CastleBuilder`.
- Pass `uDepthMap` uniforms (Resolution, Near, Far).

## Verification Plan
### Automated Tests
- None (Visual).

### Manual Verification
- **Visual Check**:
    - Intersecting look (sand piling) should be soft, not hard lines.
    - Shadows/Depth should look correct.
    - Framerate check (massive geometry might be heavy).
- **Gameplay**:
    - Collision should still work (using low-poly bounds or high-poly mesh? `Mesh.resolveCollision` uses AABB/OBB checks which might be expensive if many objects. Will optimize by keeping collision shapes simple if needed).
