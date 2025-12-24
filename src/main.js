import { Renderer } from './renderer/Renderer.js';
import { Camera } from './scene/Camera.js';
import { Scene } from './scene/Scene.js';
import { Cube } from './scene/primitives/Cube.js';
import { Plane } from './scene/primitives/Plane.js';
import { Cylinder } from './scene/primitives/Cylinder.js';
import { Cone } from './scene/primitives/Cone.js';
import { InputManager } from './input/InputManager.js';
import { DocumentationViewer } from './ui/DocumentationViewer.js';
import { TextureGenerator } from './renderer/TextureGenerator.js';

const renderer = new Renderer('glCanvas');
const camera = new Camera();
const scene = new Scene();
const input = new InputManager();
const docs = new DocumentationViewer();

const texGen = new TextureGenerator(renderer.gl);

// -- Textures --
// 1. Sand Diffuse
const texSand = texGen.createTexture(512, 512, { sand: true });
// 2. Sand Normal Map
const texSandNormal = texGen.createNormalMap(512, 512, 5.0); // High strength for visibility

// 3. Water/Moat Texture
const texWater = texGen.createTexture(256, 256, {
  color: '#004488',
  noise: 0.2
});
const texWaterNormal = texGen.createNormalMap(256, 256, 0.5);

// -- Scene Construction --

// helper to apply material
function setSandMaterial(mesh) {
  mesh.setTexture(texSand);
  mesh.setNormalMap(texSandNormal);
  mesh.baseColor = [1.0, 1.0, 1.0]; // Tint is backed into texture
  mesh.specularIntensity = 0.1; // Sand is dull
  mesh.shininess = 10.0;
}

// 1. Ground (Beach)
const ground = new Plane(renderer.gl, 50, 10.0);
setSandMaterial(ground);
ground.setPosition(0, 0, 0); // Base level 0
scene.add(ground);

// 2. Moat (Water)
// We'll place a blue plane slightly above ground but confined? 
// Simpler: The castle sits on an island (raised platform), moat is the ground level?
// Let's make the "Ground" be the moat water, and build an island.
const moat = new Plane(renderer.gl, 50, 10.0);
moat.setTexture(texWater);
moat.setNormalMap(texWaterNormal);
moat.specularIntensity = 1.0;
moat.shininess = 64.0;
moat.setPosition(0, 0.01, 0); // Just above infinite sand? 
// Actually let's make the infinite plane "Sand", and the moat is a ring? 
// Too complex for primitives. 
// Let's just make the Castle sit on a raised sand platform.
scene.add(moat); // Let's pretend the whole floor is water for a challenge, or just sand. 
// Let's stick to Sand Ground.
ground.setPosition(0, 0, 0);
// Remove moat plane for now to avoid z-fighting if I changed my mind.
// Re-add Ground as Sand.
scene.children = []; // Clear
scene.add(ground);


// --- Build Castle ---

const keepSize = 4.0;
const keepHeight = 3.0;
const wallThick = 0.5;
const towerRadius = 0.8;
const towerHeight = 5.0;

// Central Keep
const keep = new Cube(renderer.gl, 1.0); // Size 1, scaled
setSandMaterial(keep);
keep.setPosition(0, keepHeight / 2, 0); // Center
keep.setScale(keepSize, keepHeight, keepSize);
scene.add(keep);

// Towers (4 Corners)
const dist = keepSize / 2 + towerRadius * 0.5;

function createTower(x, z) {
  // Cylinder Body
  const t = new Cylinder(renderer.gl, towerRadius, towerHeight, 32);
  setSandMaterial(t);
  t.setPosition(x, towerHeight / 2, z);
  scene.add(t);

  // Cone Roof
  const roofHeight = 2.0;
  const roof = new Cone(renderer.gl, towerRadius + 0.2, roofHeight, 32);
  setSandMaterial(roof);
  roof.setPosition(x, towerHeight + 0.01, z); // 0.01 gap
  scene.add(roof);
}

createTower(dist, dist);
createTower(dist, -dist);
createTower(-dist, dist);
createTower(-dist, -dist);

// Walls
// Connect towers.
// Front Wall
const wallLen = keepSize;
const wallH = 2.0;

function createWall(x, z, rotY, len) {
  const w = new Cube(renderer.gl, 1.0);
  setSandMaterial(w);
  // Position needs to be careful if rotated.
  // Cube center is 0. 
  w.setPosition(x, wallH / 2, z);
  w.setRotation(0, rotY, 0);
  w.setScale(len, wallH, wallThick);
  scene.add(w);
}

// Positions slightly outward from keep? 
// The keep is size 4. The towers are at ~2.4.
// Let's put walls between towers.
// Distance between tower centers is 2 * dist = ~4.8.
// Wall length should be roughly 4.0?
createWall(0, dist, 0, keepSize); // Back
createWall(0, -dist, 0, keepSize); // Front
createWall(dist, 0, 90, keepSize); // Right
createWall(-dist, 0, 90, keepSize); // Left

// Drawbridge (Front, -Z)
// Rotated plank
const bridge = new Cube(renderer.gl, 1.0);
// Texture wood? Or Sand? Let's use darker sand or maybe noise color.
// Re-use texSand but tint it? 
// We can change baseColor on instance!
bridge.setTexture(texSand);
bridge.setNormalMap(texSandNormal);
bridge.baseColor = [0.6, 0.4, 0.2]; // Wood-ish tint
bridge.setPosition(0, 0.1, -dist - 2.0); // Outside front wall
bridge.setScale(1.5, 0.2, 3.0);
bridge.setRotation(10, 0, 0); // Slight angle
scene.add(bridge);


// Position camera initially
// "Miniature person walk around" -> Eye level? 
// If Keep is 3 units tall, eye level might be 0.5 or 1.0?
camera.position.set(0, 2, 8); // Start further back
camera.yaw = -90;
camera.pitch = -15;
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

  // Animate Light to show varying bump shadows
  const lightTime = time / 1000;
  const lightPos = {
    position: { elements: [Math.sin(lightTime * 0.5) * 10, 6, Math.cos(lightTime * 0.5) * 10] },
    color: [1, 1, 1],
    ambient: [0.3, 0.3, 0.3] // Higher ambient for sand
  };

  renderer.render(lightPos);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
