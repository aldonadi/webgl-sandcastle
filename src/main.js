import { Renderer } from './renderer/Renderer.js';
import { ThirdPersonCamera } from './scene/ThirdPersonCamera.js';
import { Scene } from './scene/Scene.js';
import { Cube } from './scene/primitives/Cube.js';
import { Plane } from './scene/primitives/Plane.js';
import { Cylinder } from './scene/primitives/Cylinder.js';
import { Cone } from './scene/primitives/Cone.js';
import { Torus } from './scene/primitives/Torus.js';
import { Player } from './scene/Player.js';
import { InputManager } from './input/InputManager.js';
import { DocumentationViewer } from './ui/DocumentationViewer.js';
import { TextureGenerator } from './renderer/TextureGenerator.js';

import { LensFlare } from './scene/effects/LensFlare.js';

const renderer = new Renderer('glCanvas');
// Sky Color: Summer Day Blue
renderer.setClearColor(0.53, 0.81, 0.92, 1.0);

const camera = new ThirdPersonCamera();
const scene = new Scene();
const input = new InputManager();
const docs = new DocumentationViewer();

const texGen = new TextureGenerator(renderer.gl);
const lensFlare = new LensFlare(renderer.gl, texGen);

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
// The castle sits on an island
const moat = new Plane(renderer.gl, 50, 10.0);
moat.setTexture(texWater);
moat.setNormalMap(texWaterNormal);
moat.specularIntensity = 1.0;
moat.shininess = 64.0;
moat.setPosition(0, 0.01, 0);
scene.add(moat);

// Collidables List
const collidables = [];

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
collidables.push(keep);

// Towers (4 Corners)
const dist = keepSize / 2 + towerRadius * 0.5;

function createTower(x, z) {
  // Cylinder Body
  const t = new Cylinder(renderer.gl, towerRadius, towerHeight, 32);
  setSandMaterial(t);
  t.setPosition(x, towerHeight / 2, z);
  scene.add(t);
  collidables.push(t);

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
const wallLen = keepSize;
const wallH = 2.0;

function createWall(x, z, rotY, len) {
  const w = new Cube(renderer.gl, 1.0);
  setSandMaterial(w);
  w.setPosition(x, wallH / 2, z);
  w.setRotation(0, rotY, 0);
  w.setScale(len, wallH, wallThick);
  scene.add(w);
  collidables.push(w);
}

createWall(0, dist, 0, keepSize); // Back
createWall(0, -dist, 0, keepSize); // Front
createWall(dist, 0, 90, keepSize); // Right
createWall(-dist, 0, 90, keepSize); // Left

// Drawbridge
const bridge = new Cube(renderer.gl, 1.0);
bridge.setTexture(texSand);
bridge.setNormalMap(texSandNormal);
bridge.baseColor = [0.6, 0.4, 0.2]; // Wood-ish tint
bridge.setPosition(0, 0.1, -dist - 2.0); // Outside front wall
bridge.setScale(1.5, 0.2, 3.0);
bridge.setRotation(10, 0, 0); // Slight angle
scene.add(bridge);
// Bridge is walkable, not collidable (or maybe it is? Let's ignore it for now)

// Ghost Cube (Pass-through test)
const ghost = new Cube(renderer.gl, 1.0);
ghost.setTexture(texSand);
ghost.setPosition(5, 1, 0); // To the right of entrance
ghost.isCollidable = false; // MAGIC FLAG
scene.add(ghost);
collidables.push(ghost); // Add to list, but flag should prevent collision

// -- Power-up (Golden Torus) --
// Diameter 0.5 (Radius ~0.25)
const texGold = texGen.createTexture(128, 128, {
  color: '#FFD700', // Gold
  noise: 0.05 // Low noise
});

const torus = new Torus(renderer.gl, 0.15, 0.05, 16, 32);
torus.setTexture(texGold); // Use gold texture
torus.baseColor = [1.0, 0.9, 0.4]; // Tint
torus.specularIntensity = 2.0; // Very shiny
torus.shininess = 64.0;
torus.emissive = [0.8, 0.6, 0.1]; // Golden Glow (simulated emission)
torus.setPosition(5, 0.5, 8); // Outside of castle
torus.isCollidable = false;

// Slightly tilt it for better look
torus.setRotation(45, 0, 0);

scene.add(torus);
collidables.push(torus); // Pass through enabled via flag

// -- Player --
const player = new Player(renderer.gl, texGen);
scene.add(player.mesh);

renderer.setScene(scene);
renderer.setCamera(camera);

// Main Loop
let lastTime = 0;

function loop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  // Update Input
  const move = input.getMoveVector(); // {x, y}
  const look = input.getLookVector(); // {x, y}

  const isPlayerMoving = (Math.abs(move.x) > 0.01 || Math.abs(move.y) > 0.01);

  // Update Player
  player.update(dt, move, collidables);

  // Resolve Collision (Handled in update now)

  // Update Camera
  camera.update(dt, player, look, isPlayerMoving, collidables);

  // Animate Light to show varying bump shadows
  const lightTime = time / 1000;
  // Move sun higher for "Summer Day"
  const sunX = Math.sin(lightTime * 0.2) * 20;
  const sunY = 15;
  const sunZ = Math.cos(lightTime * 0.2) * 20;

  const lightPos = {
    position: { elements: [sunX, sunY, sunZ] },
    color: [1, 0.95, 0.9], // Slightly warm sun
    ambient: [0.3, 0.3, 0.4] // Blue-ish ambient (sky)
  };

  renderer.render(lightPos);

  // Render Lens Flare on top
  lensFlare.update(lightPos, camera);
  lensFlare.draw(renderer.gl, camera);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
