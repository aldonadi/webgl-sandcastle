# Developer Guide

This document covers the technical architecture, file structure, and implementation details of the WebGL Sandcastle project.

## Tech Stack
- **Languages**: Vanilla JavaScript (ES Module syntax), HTML5, CSS3.
- **Build Tool**: Vite (used for dev server and bundling).
- **Libraries**: None. No Three.js, no gl-matrix. All math and WebGL boilerplate is hand-written to ensure educational value and low-level control.

## Architecture & Code Structure

The project follows a standard game-loop architecture where the `Renderer` drives the loop, and the `Scene` graph manages logical objects.

```
src/
├── input/
│   ├── InputManager.js   # Orchestrator for all inputs.
│   └── Joystick.js       # Logic for individual touch joystick zones.
├── math/
│   ├── MathUtils.js      # Helpers (degToRad, etc).
│   ├── Matrix4.js        # 4x4 homogenous transformation matrix engine.
│   └── Vector3.js        # 3D Vector implementation.
├── renderer/
│   ├── Renderer.js       # Encapsulates WebGL Context and Render Loop.
│   ├── ShaderProgram.js  # Wrapper for compiling/linking GLSL shaders.
│   └── Shaders.js        # String constants for vertex/fragment shader code.
├── scene/
│   ├── primitives/
│   │   ├── Cube.js       # Procedural Cube geometry.
│   │   └── Plane.js      # Procedural Plane geometry.
│   ├── Camera.js         # Manages View/Projection matrices and location.
│   ├── Mesh.js           # Base class for renderable objects (Buffers management).
│   └── Scene.js          # Simple container for objects to draw.
├── main.js               # Entry point, composition root, and game logic loop.
└── style.css             # Styles for full-screen canvas and UI overlay.
```

### Key Components

#### 1. The Renderer (`Renderer.js`)
Initialized with a canvas ID. It sets up the WebGL context (`this.gl`), handles window resizing events to keep the viewport correct, and exposes a `render()` method. It does **not** contain the game loop itself anymore; it simply renders the current state of a Scene from the perspective of a Camera when asked.

#### 2. The Math Library (`math/`)
A custom implementation of a column-major Matrix4 class. 
- **Important**: WebGL expects column-major matrices.
- Supports chaining basic operations: `translate`, `rotate`, `multiply`, `setLookAt`, `setPerspective`.

#### 3. The Input System (`input/`)
- **Joystick.js**: Listens to touch events on a specific DOM element (the "zone"). It calculates a normalized vector (x, y) ranging from -1 to 1 based on where the user drags the "knob" relative to the center.
- **InputManager.js**: Aggregates the left (Move) and right (Look) joysticks into a single queryable API.

#### 4. The Scene Graph
- **Mesh.js**: The base class for visible objects. It creates GL buffers for vertices, colors, and indices. It also holds its own `modelMatrix` (position/rotation/scale in the world).
- **Primitives**: `Cube.js` and `Plane.js` extend `Mesh` and simply generate the raw vertex arrays for those shapes in their constructors.

## How to Add a New Shape

To add a new shape (e.g., a Pyramid), follow these steps:

1. **Create a new file** `src/scene/primitives/Pyramid.js`.
2. **Extend the Mesh class**:
   ```javascript
   import { Mesh } from '../Mesh.js';
   
   export class Pyramid extends Mesh {
     constructor(gl, size = 1.0, color = [1, 1, 0]) {
       // Define vertices (Example: Base centered at Y=0, Tip at Y=size)
       const s = size / 2;
       const vertices = [
         // Base Triangle 1 ...
         // Base Triangle 2 ...
         // Side Triangle 1 ...
       ];
       
       // Define Indices (which vertices make up triangles)
       const indices = [ ... ];
       
       // Define Colors (one RGB triplet per vertex)
       const colors = [ ... ];

       // Call super
       super(gl, vertices, colors, indices);
     }
   }
   ```
3. **Import and Instance in `main.js`**:
   ```javascript
   import { Pyramid } from './scene/primitives/Pyramid.js';
   
   const pyramid = new Pyramid(renderer.gl, 1.0);
   pyramid.setPosition(2, 0.5, 0); // Move it to the right
   scene.add(pyramid);
   ```

## Future Improvements
- Add Texture support (UV coordinates in `Mesh` and Shaders).
- Add functionality for `gl.drawArrays` (currently assumes `gl.drawElements` with indices).
- Implement a hierarchical Scene Graph (parent/child relationships for transforms).
