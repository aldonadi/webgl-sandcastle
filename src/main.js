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
import { ParticleSystem, ParticleEmitter } from './scene/effects/ParticleSystem.js';

const renderer = new Renderer('glCanvas');
// Sky Color: Summer Day Blue
renderer.setClearColor(0.53, 0.81, 0.92, 1.0);

const camera = new ThirdPersonCamera();
const scene = new Scene();
const input = new InputManager();
const docs = new DocumentationViewer();

const texGen = new TextureGenerator(renderer.gl);
const lensFlare = new LensFlare(renderer.gl, texGen);
const particleSystem = new ParticleSystem(renderer.gl);

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

// 4. Particle Textures
const texFire = texGen.createFireTexture(64, 64);
const texSpark = texGen.createSparkTexture(64, 64);
const texDust = texGen.createDustTexture(64, 64);

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
import { CastleBuilder } from './scene/CastleBuilder.js';

const builder = new CastleBuilder(renderer.gl, texGen, setSandMaterial);
builder.build(scene, collidables);


// -- Power-up (Golden Torus) --
// Diameter 0.5 -> 1.0 (Radius ~0.5)
const texGold = texGen.createTexture(128, 128, {
  color: '#FFD700', // Gold
  noise: 0.05 // Low noise
});

// Double Size: Radius 0.3, Tube 0.1 (total width approx 0.8)
const torus = new Torus(renderer.gl, 0.3, 0.1, 16, 32);
torus.setTexture(texGold); // Use gold texture
torus.baseColor = [1.0, 0.9, 0.4]; // Tint
torus.specularIntensity = 2.0; // Very shiny
torus.shininess = 64.0;
torus.emissive = [0.8, 0.6, 0.1]; // Golden Glow (simulated emission)
torus.setPosition(25, 2.0, 30); // Far Outside
torus.isCollidable = false;

// Initial Rotation
torus.setRotation(45, 0, 0);

scene.add(torus);
collidables.push(torus); // Pass through enabled via flag

// -- Particle Emitters --

// 1. Fire (Plane Source, near main Keep gate?)
const fireEmitter = new ParticleEmitter({
  texture: texFire,
  rate: 50,
  maxParticles: 200,
  life: { min: 1.0, max: 2.0 },
  velocity: { speedMin: 2.0, speedMax: 4.0, dirMode: 'up' }, // Custom up mode logic in Emitter
  gravity: 3.0, // Rising
  color: { start: [1.0, 1.0, 1.0, 1.0], end: [1.0, 0.2, 0.0, 0.0] },
  size: { start: 1.0, end: 0.2 },
  source: {
    type: 'plane',
    params: { x: 0, y: 0.1, z: 25, width: 2.0, depth: 1.0 } // Near bridge?
  },
  rotation: { min: 0, max: 6.28, speedMin: -1, speedMax: 1 },
  collision: false
});
particleSystem.addEmitter(fireEmitter);

// 2. Electrical Sparks (Point Source, near Torus)
const sparkEmitter = new ParticleEmitter({
  texture: texSpark,
  rate: 10,
  maxParticles: 50,
  life: { min: 0.5, max: 1.5 },
  velocity: { speedMin: 5.0, speedMax: 10.0 },
  gravity: -15.0, // Falling
  color: { start: [1.0, 1.0, 0.5, 1.0], end: [1.0, 1.0, 0.0, 0.0] },
  size: { start: 0.4, end: 0.0 },
  source: {
    type: 'point',
    params: { x: 25, y: 2.0, z: 30 } // At Torus location
  },
  collision: true
});
particleSystem.addEmitter(sparkEmitter);

// 3. Dust (Line Source, "Walking on dusty ground", placed statically for demo)
const dustEmitter = new ParticleEmitter({
  texture: texDust,
  rate: 5,
  maxParticles: 100,
  life: { min: 2.0, max: 4.0 },
  velocity: { speedMin: 0.2, speedMax: 0.5 },
  gravity: 0.1, // Slight rise
  color: { start: [0.8, 0.7, 0.6, 0.4], end: [0.8, 0.7, 0.6, 0.0] },
  size: { start: 0.5, end: 2.0 },
  source: {
    type: 'line',
    params: { x1: -10, y1: 0.2, z1: 30, x2: 10, y2: 0.2, z2: 30 } // A dusty path outside
  },
  rotation: { min: 0, max: 6.28, speedMin: 0.5, speedMax: 1.0 },
  collision: false
});
particleSystem.addEmitter(dustEmitter);


// -- Player --
const player = new Player(renderer.gl, texGen);
player.position.z = 45; // Start way outside
player.position.x = 0;
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
  const actions = input.getActions(); // {jump}

  const isPlayerMoving = (Math.abs(move.x) > 0.01 || Math.abs(move.y) > 0.01);

  // Update Player
  player.update(dt, move, collidables, actions);

  // Update Particles
  particleSystem.update(dt, collidables);

  // Update Torus Animation
  // 1. Continual Rotation around Y axis (and maybe Z for fun?)
  const rotSpeed = 90; // degrees per second
  const bounceSpeed = 2.0;
  const bounceAmp = 0.2;
  const baseHeight = 0.8;

  const currentRot = torus.rotation ? torus.rotation : { x: 0, y: 0, z: 0 };
  torus.setRotation(45, (time / 1000 * rotSpeed) % 360, 0);

  // 2. Bounce Up and Down
  const newY = baseHeight + Math.sin(time / 1000 * bounceSpeed) * bounceAmp;
  torus.setPosition(torus.position.x, newY, torus.position.z);

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

  // Render Particles on top (blended)
  particleSystem.draw(camera);

  // Render Lens Flare on top
  lensFlare.update(lightPos, camera);
  lensFlare.draw(renderer.gl, camera);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
