import { Renderer } from './renderer/Renderer.js';
import { Camera } from './scene/Camera.js';
import { Scene } from './scene/Scene.js';
import { Cube } from './scene/primitives/Cube.js';
import { Plane } from './scene/primitives/Plane.js';
import { InputManager } from './input/InputManager.js';
import { DocumentationViewer } from './ui/DocumentationViewer.js';

const renderer = new Renderer('glCanvas');
const camera = new Camera();
const scene = new Scene();
const input = new InputManager();
const docs = new DocumentationViewer();

import { TextureGenerator } from './renderer/TextureGenerator.js';

const texGen = new TextureGenerator(renderer.gl);

// -- Textures --

// Floor: Concrete-like noise
const texFloor = texGen.createTexture(512, 512, {
  color: '#333333',
  noise: 0.1
});

// Grid pattern for floor (overlaying noise not easy with single method, let's just do noisy gray for now)
// Actually let's try a gradient on the cubes

// Red Cube: Red gradient with noise
const texRed = texGen.createTexture(256, 256, {
  gradient: { start: '#ffaaaa', end: '#660000', dir: 'v' },
  noise: 0.2
});

// Blue Cube: Blue with heavy noise
const texBlue = texGen.createTexture(256, 256, {
  color: '#0000ff',
  noise: 0.5
});


// -- Scene Objects --

const floor = new Plane(renderer.gl, 20, 4.0);
floor.setTexture(texFloor);
floor.baseColor = [1, 1, 1];
floor.specularIntensity = 0.1;
scene.add(floor);

const cube = new Cube(renderer.gl, 1.0);
cube.setPosition(0, 0.5, 0);
cube.setTexture(texRed);
cube.baseColor = [1, 1, 1]; // Use texture color mostly
cube.specularIntensity = 1.0;
cube.shininess = 64.0;
scene.add(cube);

const cube2 = new Cube(renderer.gl, 1.0);
cube2.setPosition(-2, 0.5, -2);
cube2.setTexture(texBlue);
cube2.baseColor = [1, 1, 1];
cube2.specularIntensity = 0.8;
cube2.shininess = 32.0;
scene.add(cube2);

// Position camera initially
camera.position.set(0, 2, 5);
camera.yaw = -90;
camera.pitch = -20;
camera.updateViewMatrix();

renderer.setScene(scene);
renderer.setCamera(camera);

// Main Loop
let lastTime = 0;

function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  // Update Input
  const move = input.getMoveVector();
  const look = input.getLookVector();

  // Move speed (units per second)
  const moveSpeed = 5.0 * (dt || 0.016);
  const lookSpeed = 2.0;

  if (Math.abs(move.x) > 0.01 || Math.abs(move.y) > 0.01) {
    camera.move(-move.y * moveSpeed, move.x * moveSpeed);
  }

  if (Math.abs(look.x) > 0.01 || Math.abs(look.y) > 0.01) {
    camera.rotate(look.x * lookSpeed, look.y * lookSpeed); // Yaw, Pitch
  }

  // Animate Light
  const lightTime = time / 1000;
  const lightPos = {
    position: { elements: [Math.sin(lightTime) * 4, 4, Math.cos(lightTime) * 4] },
    color: [1, 1, 1],
    ambient: [0.2, 0.2, 0.2]
  };

  // Render

  // We need to pass light to draw, but our Renderer loop calls scene.draw(gl, camera).
  // Let's modify Renderer.js render to accept light or pass it somehow?
  // Actually our Scene.draw calls child.draw(gl, camera). We need to pass light down.
  // Quick fix: Loop manually here or update scene.draw signature.

  // Better: Update Renderer.render to take extra args or set light on renderer.
  // For now, let's cheat and pass it into renderer.render which passes it to scene.
  renderer.render(lightPos);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
