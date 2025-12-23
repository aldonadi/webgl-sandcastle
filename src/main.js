import { Renderer } from './renderer/Renderer.js';
import { Camera } from './scene/Camera.js';
import { Scene } from './scene/Scene.js';
import { Cube } from './scene/primitives/Cube.js';
import { Plane } from './scene/primitives/Plane.js';
import { InputManager } from './input/InputManager.js';

const renderer = new Renderer('glCanvas');
const camera = new Camera();
const scene = new Scene();
const input = new InputManager();

// Setup Scene
const floor = new Plane(renderer.gl, 20, [0.4, 0.4, 0.4]);
scene.add(floor);

const cube = new Cube(renderer.gl, 1.0, [1.0, 0.0, 0.0]); // Red cube
cube.setPosition(0, 0.5, 0);
scene.add(cube);

const cube2 = new Cube(renderer.gl, 1.0, [0.0, 0.0, 1.0]); // Blue cube
cube2.setPosition(-2, 0.5, -2);
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
    // Forward is -y in joystick (up)
    camera.move(-move.y * moveSpeed, move.x * moveSpeed);
  }

  if (Math.abs(look.x) > 0.01 || Math.abs(look.y) > 0.01) {
    camera.rotate(look.x * lookSpeed, look.y * lookSpeed); // Yaw, Pitch
  }

  // Render
  renderer.render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
