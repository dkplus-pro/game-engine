import { World, GameLoop, InputManager } from '@game-engine/core';
import {
  CanvasDriver, RenderSystem, AnimationSystem, CameraSystem,
  Transform, Sprite, Camera, Animation,
  createTransform, createSprite, createCamera, createAnimation,
} from '@game-engine/renderer-canvas';
import { Player, createPlayer } from './components/Player';
import { PlayerMovementSystem } from './systems/PlayerMovementSystem';
import { CollisionSystem } from './systems/CollisionSystem';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WORLD_WIDTH = 2500;
const GROUND_Y = 500;

const driver = new CanvasDriver({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: '#1a1a2e' });
const input = new InputManager();
const world = new World();

// --- Create world objects first so we have platform data ---
const platformDefs = [
  { x: 400, y: 380, w: 140, h: 20 },
  { x: 700, y: 320, w: 140, h: 20 },
  { x: 1050, y: 260, w: 140, h: 20 },
  { x: 1400, y: 330, w: 140, h: 20 },
  { x: 1800, y: 380, w: 140, h: 20 },
];

// Ground
const ground = world.createEntity();
world.addComponent(ground, Transform, createTransform(WORLD_WIDTH / 2, GROUND_Y));
world.addComponent(ground, Sprite, createSprite('#2d4a22', WORLD_WIDTH, 40));

// Platforms
for (const p of platformDefs) {
  const e = world.createEntity();
  world.addComponent(e, Transform, createTransform(p.x, p.y));
  world.addComponent(e, Sprite, createSprite('#4a4a6a', p.w, p.h));
}

// --- Collision system (with platform data) ---
const collisionSys = new CollisionSystem(GROUND_Y);
collisionSys.setPlatforms(platformDefs);

// --- Systems ---
world.addSystem(new PlayerMovementSystem(input, 980));
world.addSystem(collisionSys);
world.addSystem(new AnimationSystem());
world.addSystem(new CameraSystem());
world.addSystem(new RenderSystem(driver));

// --- Player ---
const player = world.createEntity();
world.addComponent(player, Transform, createTransform(200, GROUND_Y - 24));
world.addComponent(player, Sprite, createSprite('#e94560', 32, 48));
world.addComponent(player, Animation, createAnimation(
  [
    { x: 0, y: 0, width: 32, height: 48 },
    { x: 1, y: 0, width: 32, height: 48 },
    { x: 2, y: 0, width: 32, height: 48 },
    { x: 3, y: 0, width: 32, height: 48 },
  ],
  8,
));
world.addComponent(player, Player, createPlayer(300, 420, GROUND_Y));

// --- Camera ---
const cameraEntity = world.createEntity();
world.addComponent(cameraEntity, Camera, createCamera({
  followEntity: player, followMode: 'lerp', lerpSpeed: 4, zoom: 1,
}));

const loop = new GameLoop(world, { fps: 60 });
loop.start();

console.log('Platformer demo running!');