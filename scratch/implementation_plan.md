# Third Person Player & Camera Implementation

## Goal
Implement a third-person character controller where the player controls a textured sphere. The camera should follow the player in an "over-the-shoulder" view when moving, and allow for free orbiting when idle. Basic collision detection will prevent clipping through scene objects.

## Proposed Changes

### Primitives
#### [NEW] [Sphere.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/scene/primitives/Sphere.js)
- Implement a UV sphere mesh generator to represent the player.

### Player Logic
#### [NEW] [Player.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/scene/Player.js)
- **Properties**: Position, rotation, velocity, radius (collision).
- **Methods**:
    - `update(dt, inputVector)`: Handles movement with "Tank/Car" style controls.
        - **Left/Right**: Rotates `rotation` (Control Yaw).
        - **Up**: Moves forward along `rotation`. Visuals face forward.
        - **Down**: Moves backward along `rotation`. Visuals face camera (180 turn).
    - `draw(renderer, camera, light)`: Renders the player mesh.
- **Visuals**: Use `TextureGenerator` to create a unique texture (e.g., stripes or marble) to make it "attractively-textured".

### Camera Logic
#### [NEW] [ThirdPersonCamera.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/scene/ThirdPersonCamera.js)
- **Properties**: `target` (Player), `distance`, `pitch`, `yaw`, `offset`.
- **Logic**:
    - **State 1 (Moving)**: Camera yaw strictly follows player rotation to keep "over-the-shoulder" view aligned as they turn.
    - **State 2 (Idle)**: Loop input orbits the camera freely around the player.
    - **Offset**: Applied to keep the player slightly off-center (over-the-shoulder).

### Main Loop
#### [MODIFY] [main.js](file:///home/andrew/Projects/Code/web/webgl-sandcastle/src/main.js)
- Instantiate `Player` and add to scene (or manage separately if needed for collision).
- Replace default `Camera` usage with `ThirdPersonCamera`.
- Update `loop()` to pass input to Player and Camera.

### Collision
### Camera Collision
- Implement `checkLineOfSight(start, end, objects)` method in `ThirdPersonCamera.js`.
- **Logic**:
    - Iterate through all scene objects.
    - Treat objects as simplified bounding volumes (Sphere or AABB).
    - Raycast from Player Head (start) to Camera Desired Position (end).
    - If hit, clamp camera position to hit point.
    - **Optimization**: Check bounding sphere of object first.
    - `Vector3` needs helper for distance/subtract if not present (will add locally or update Vector3).

## Verification Plan
### Manual Verification
### Manual Verification
- **Movement**: Verify sphere moves with joystick/WASD.
- **Camera (Move)**: Verify camera follows player when moving.
- **Camera (Idle)**: Verify camera orbits player when stopped.
- **Collision**: Try to walk into the `keep` and `walls`. Player should stop sliding.
- **Camera Collision**: Rotate camera so a wall is between camera and player. Camera should zoom in to avoid being blocked by wall.
- **Robust Collision**:
    - Walk into a wall; should verify no entry.
    - Check that "Collidable" objects block.
    - (Optional) Verify "Non-collidable" objects allow pass-through (will add a test object for this).
### New Primitive: Torus
- Create `src/scene/primitives/Torus.js`.
- **Params**: `radius`, `tubeRadius`, `radialSegments`, `tubularSegments`.
- **Implementation**: Standard parametric torus generation.

### Power-up (Golden Torus)
- **Texture**: Gold (Yellow/Orange, low noise, high specularity).
- **Material**: `shininess = 64`, `specularIntensity = 2.0`.
- **Glow**: Add `uEmissive` uniform to `BasicFragmentShader` and `Mesh.js`.
    - Set emission for Torus to Golden.
- **Collision**: `isCollidable = false`.
- **Position**: Outside castle (e.g., `(5, 0.5, 8)`).

### Player Adjustments
- Move start position to `(0, 0.5, 10)` (Outside Castle, facing entrance).
