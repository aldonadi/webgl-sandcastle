# WebGL Sandcastle

A "from scratch" vanilla WebGL 3D environment designed for mobile touch controls. This project serves as a clean slate for experimenting with WebGL primitives, shaders, and 3D math without the overhead of heavy engines like Three.js or Babylon.js.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- git

### Installation & Running
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd webgl-sandcastle
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   The terminal will output a local URL (usually `http://localhost:5173`). Open this link in your web browser. 
   
   > **Note**: For mobile testing, ensure your phone is on the same Wi-Fi network and access the "Network" IP address shown in the terminal.

## UI & Controls

The interface is designed for touch interaction but works with mouse simulation as well.

### Visual Layout
- **Canvas**: The entire background is a WebGL rendering context displaying the 3D scene (currently a floor plane and cubes).
- **Controls Layer**: An HTML overlay sitting on top of the canvas containing two virtual joystick zones.

### Controls
The control scheme mimics standard dual-stick mobile game controls:

1. **Movement (Left Stick)**:
   - Located at the **Bottom Left** of the screen.
   - **Action**: Drag your thumb/mouse inside the circle.
   - **Effect**: Moves the camera position in the world.
     - **Up/Down**: Move Forward/Backward.
     - **Left/Right**: Strafe Left/Right.

2. **Look (Right Stick)**:
   - Located at the **Bottom Right** of the screen.
   - **Action**: Drag your thumb/mouse inside the circle.
   - **Effect**: Rotates the camera view.
     - **Up/Down**: Pitch (Look Up/Down). 
     - **Left/Right**: Yaw (Look Left/Right).

## Documentation Index
- [Developer Guide](./DEVELOPER.md): Architecture, File Structure, and Extension tutorials.
- [Theory Guide](./THEORY.md): Deep dive into the Linear Algebra, Matrices, and Graphics Pipeline developed in this project.
