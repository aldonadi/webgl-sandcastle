# Implementation Plan - Particle System

## Goal Description
Implement a robust particle system with configurable emitters and custom shaders. Create three showcase effects: Fire, Electrical Sparks, and Walking Dust.

## User Review Required
None.

## Proposed Changes

### Core System
#### [NEW] [src/renderer/ParticleShader.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/renderer/ParticleShader.js)
- Vertex Shader: Billboarding logic (view-aligned quads), vertex color support.
- Fragment Shader: Texture * Color, unlit, alpha blending.

#### [NEW] [src/scene/effects/ParticleSystem.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/scene/effects/ParticleSystem.js)
- `ParticleSystem`: Main container, handles updating and drawing multiple emitters.
- `ParticleEmitter`: Manages a specific effect (configuration, texture, list of active particles).
    - **Properties**:
        - `source`: { type: 'point'|'line'|'plane'|'box', params... }
        - `rate`: Particles/sec.
        - `maxParticles`: Limit.
        - `life`: { min, max }
        - `velocity`: { min, max } (vec3) or { speedMin, speedMax, directionFunc }
        - `color`: { start, end } (Gradient interpolation)
        - `size`: { start, end }
        - `texture`: WebGLTexture
        - `collision`: Boolean.
    - **Methods**:
        - `update(dt, sceneObjects)`: Simulation step (Gravity, Collision, Age).
        - `draw(gl, camera)`: Rebuilds dynamic mesh and renders.

#### [NEW] [src/renderer/TextureGenerator.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/renderer/TextureGenerator.js) (Update)
- Add methods to generate particle textures:
    - `createFireTexture()`: Soft Gaussian blob / noise.
    - `createSparkTexture()`: Sharp bright cross/star.
    - `createDustTexture()`: Smoky noise.

### Integration
#### [MODIFY] [src/main.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/main.js)
- Instantiate `ParticleSystem`.
- Create the 3 showcase emitters:
    1.  **Fire**: Near the Torch/Keep. Plane source.
    2.  **Sparks**: Near the Power-up (Torus). Point source, bouncing.
    3.  **Dust**: Attached to Player position (or separate line source as requested).
        - *Request says "Walking on dusty ground effect (line source)"*. I will place a static line source for demo, or attach to player trails? "Showcase... place them in the world". I will place them in the world statically for inspection as requested.

## Verification Plan

### Manual Verification
- **Visual Inspection**:
    - **Fire**: Check for billboarded flames, upward movement, color fade (Orange->Red), alpha fade.
    - **Sparks**: Check for explosive radial movement, gravity, and **bouncing** on floor.
    - **Dust**: Check for line emission, slow movement, rotation, fading.
- **Performance**: Monitor frame rate with hundreds of particles.
- **Collisions**: Verify sparks bounce off ground.
