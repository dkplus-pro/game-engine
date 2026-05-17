import {
  World, GameLoop, InputManager, System, type World as WType,
  Transform, createTransform, type TransformData,
  RigidBody, createRigidBody, BodyType, type RigidBodyData,
  CollisionBox, createCollisionBox,
  CollisionMatrix, LAYER_PLAYER, LAYER_ENVIRONMENT,
  PhysicsSystem, CollisionSystem, EventBus,
} from '@game-engine/core';
import {
  CanvasDriver, RenderSystem, CameraSystem,
  Sprite, createSprite,
  Camera, createCamera, type CameraData,
  TilemapRenderer, TilemapCollider, createTilemap, type TilemapData,
} from '@game-engine/renderer-canvas';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_W = 32;
const TILE_H = 32;

// --- Custom Systems ---
class PlayerInputSystem extends System {
  readonly query = [Transform, RigidBody];
  private input: InputManager;
  private speed = 300;
  private jumpForce = 420;

  constructor(input: InputManager) {
    super();
    this.input = input;
  }

  update(world: WType, _dt: number): void {
    const entities = world.query(this.query);

    for (const e of entities) {
      const rb = world.getComponent<RigidBodyData>(e, RigidBody)!;
      if (rb.type !== BodyType.Dynamic) continue;

      let dx = 0;
      if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('a')) dx -= 1;
      if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('d')) dx += 1;
      rb.vx = dx * this.speed;

      if ((this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed(' ') || this.input.isKeyPressed('w')) && rb.onGround) {
        rb.vy = -this.jumpForce;
      }
    }
  }
}

class TilemapRenderSystem extends System {
  readonly query = [];
  private driver: CanvasDriver;
  private renderer: TilemapRenderer;
  private tilemap: TilemapData;

  constructor(driver: CanvasDriver, renderer: TilemapRenderer, tilemap: TilemapData) {
    super();
    this.driver = driver;
    this.renderer = renderer;
    this.tilemap = tilemap;
  }

  update(world: WType, _dt: number): void {
    const ctx = this.driver.getContext();
    const cameras = world.query([Camera]);
    const camData = cameras.length > 0 ? world.getComponent<CameraData>(cameras[0], Camera) : null;

    const viewport = {
      x: camData ? camData.x - CANVAS_WIDTH / 2 : 0,
      y: camData ? camData.y - CANVAS_HEIGHT / 2 : 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    };

    this.renderer.draw(ctx, this.tilemap, viewport);
  }
}

// --- Tilemap Definition ---
const tiles = [
  { id: 0, color: '#2d4a22', solid: true },
  { id: 1, color: '#4a4a6a', solid: true },
  { id: 2, color: '#16213e', solid: false },
  { id: 3, color: '#e94560', solid: false },
];

const groundLayer: number[][] = [];
const decorLayer: number[][] = [];

for (let row = 0; row < 18; row++) {
  groundLayer[row] = [];
  decorLayer[row] = [];
  for (let col = 0; col < 25; col++) {
    if (row === 17) groundLayer[row][col] = 0;
    else if (row === 14 && col >= 3 && col <= 7) groundLayer[row][col] = 1;
    else if (row === 11 && col >= 10 && col <= 14) groundLayer[row][col] = 1;
    else if (row === 8 && col >= 5 && col <= 9) groundLayer[row][col] = 1;
    else if (row === 5 && col >= 15 && col <= 20) groundLayer[row][col] = 1;
    else groundLayer[row][col] = -1;

    decorLayer[row][col] = (row === 16 && col % 4 === 0) ? 3 : (row === 2 && col % 5 === 2 ? 2 : -1);
  }
}

const tilemap = createTilemap(TILE_W, TILE_H, tiles, [
  { name: 'background', data: decorLayer },
  { name: 'ground', data: groundLayer },
], 1);

// --- Setup ---
const driver = new CanvasDriver({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: '#1a1a2e' });
const input = new InputManager();
const eventBus = new EventBus();
const world = new World();

const collisionMatrix = new CollisionMatrix();
collisionMatrix.enableCollision(LAYER_PLAYER, LAYER_ENVIRONMENT);

// Systems
world.addSystem(new PhysicsSystem(980));
world.addSystem(new CollisionSystem(collisionMatrix, eventBus));
world.addSystem(new PlayerInputSystem(input));
world.addSystem(new CameraSystem());
world.addSystem(new TilemapRenderSystem(driver, new TilemapRenderer(), tilemap));
world.addSystem(new RenderSystem(driver));

// Create collision entities from tilemap
const tilemapCollider = new TilemapCollider();
const tileColliders = tilemapCollider.getColliders(tilemap);

for (const tc of tileColliders) {
  const e = world.createEntity();
  world.addComponent(e, Transform, createTransform(tc.x, tc.y));
  world.addComponent(e, CollisionBox, createCollisionBox(tc.width, tc.height, { layer: LAYER_ENVIRONMENT }));
  world.addComponent(e, RigidBody, createRigidBody({ type: BodyType.Static }));
}

// Player
const player = world.createEntity();
world.addComponent(player, Transform, createTransform(100, 500));
world.addComponent(player, Sprite, createSprite('#e94560', 28, 40));
world.addComponent(player, RigidBody, createRigidBody({ type: BodyType.Dynamic, gravityScale: 1 }));
world.addComponent(player, CollisionBox, createCollisionBox(28, 40, { layer: LAYER_PLAYER }));

// Camera
const cam = world.createEntity();
world.addComponent(cam, Camera, createCamera({ followEntity: player, followMode: 'lerp', lerpSpeed: 4 }));

const loop = new GameLoop(world, { fps: 60 });
loop.start();

console.log('Tilemap demo running!');