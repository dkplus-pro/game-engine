import {
  World, GameLoop, InputManager, System, Stats, DebugOverlay, ResourceManager,
  Transform, createTransform, type TransformData,
  RigidBody, createRigidBody, BodyType, type RigidBodyData,
  CollisionBox, createCollisionBox,
  CollisionMatrix, LAYER_PLAYER, LAYER_ENVIRONMENT,
  PhysicsSystem, CollisionSystem, EventBus,
} from '@game-engine/core';
import {
  CanvasDriver, RenderSystem, CameraSystem,
  Sprite, createSprite, type SpriteData,
  Camera, createCamera, type CameraData,
  TilemapRenderer, TilemapCollider, createTilemap, type TilemapData,
  ImageResourceLoader,
} from '@game-engine/renderer-canvas';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_W = 32;
const TILE_H = 32;

class PlayerInputSystem extends System {
  readonly query = [Transform, RigidBody];
  private input: InputManager;
  private speed = 300;
  private jumpForce = 420;

  constructor(input: InputManager) {
    super();
    this.input = input;
  }

  update(world: World, _dt: number): void {
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

  update(world: World, _dt: number): void {
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

class StatsUpdateSystem extends System {
  readonly query = [];
  private stats: Stats;
  private world: World;

  constructor(stats: Stats, world: World) {
    super();
    this.stats = stats;
    this.world = world;
  }

  update(_world: World, _dt: number): void {
    this.stats.entityCount = (this.world as any).entities?.size ?? 0;
    this.stats.systemCount = (this.world as any).systems?.length ?? 0;
    let compCount = 0;
    const stores = (this.world as any).stores as Map<number, any>;
    if (stores) {
      for (const store of stores.values()) {
        compCount += store.size;
      }
    }
    this.stats.componentCount = compCount;
  }
}

const tiles = [
  { id: 0, color: '#2d4a22', solid: true },
  { id: 1, color: '#4a4a6a', solid: true },
  { id: 2, color: '#16213e', solid: false },
  { id: 3, color: '#e94560', solid: false },
  { id: 4, color: '#0f3460', solid: true },
  { id: 5, color: '#533483', solid: false },
];

const MAP_COLS = 50;
const MAP_ROWS = 20;

const groundLayer: number[][] = [];
const decorLayer: number[][] = [];

for (let row = 0; row < MAP_ROWS; row++) {
  groundLayer[row] = [];
  decorLayer[row] = [];
  for (let col = 0; col < MAP_COLS; col++) {
    if (row === MAP_ROWS - 1) {
      groundLayer[row][col] = 0;
    } else if (row === MAP_ROWS - 4 && col >= 3 && col <= 8) {
      groundLayer[row][col] = 1;
    } else if (row === MAP_ROWS - 7 && col >= 12 && col <= 18) {
      groundLayer[row][col] = 1;
    } else if (row === MAP_ROWS - 10 && col >= 6 && col <= 11) {
      groundLayer[row][col] = 4;
    } else if (row === MAP_ROWS - 13 && col >= 20 && col <= 28) {
      groundLayer[row][col] = 1;
    } else if (row === MAP_ROWS - 16 && col >= 32 && col <= 40) {
      groundLayer[row][col] = 4;
    } else {
      groundLayer[row][col] = -1;
    }

    decorLayer[row][col] = (row === MAP_ROWS - 2 && col % 4 === 0) ? 3
      : (row === 2 && col % 5 === 2) ? 2
      : (row === 5 && col % 7 === 3) ? 5
      : -1;
  }
}

const tilemap = createTilemap(TILE_W, TILE_H, tiles, [
  { name: 'background', data: decorLayer },
  { name: 'ground', data: groundLayer },
], 1);

const driver = new CanvasDriver({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: '#1a1a2e' });
const input = new InputManager();
const eventBus = new EventBus();
const world = new World();
const stats = new Stats();

const resourceManager = new ResourceManager();
resourceManager.registerLoader('image', new ImageResourceLoader());

const collisionMatrix = new CollisionMatrix();
collisionMatrix.enableCollision(LAYER_PLAYER, LAYER_ENVIRONMENT);

world.addSystem(new PhysicsSystem(980));
world.addSystem(new CollisionSystem(collisionMatrix, eventBus));
world.addSystem(new PlayerInputSystem(input));
world.addSystem(new CameraSystem());
world.addSystem(new TilemapRenderSystem(driver, new TilemapRenderer(), tilemap));
world.addSystem(new RenderSystem(driver));
world.addSystem(new StatsUpdateSystem(stats, world));

const tilemapCollider = new TilemapCollider();
const tileColliders = tilemapCollider.getColliders(tilemap);

for (const tc of tileColliders) {
  const e = world.createEntity();
  world.addComponent(e, Transform, createTransform(tc.x, tc.y));
  world.addComponent(e, CollisionBox, createCollisionBox(tc.width, tc.height, { layer: LAYER_ENVIRONMENT }));
  world.addComponent(e, RigidBody, createRigidBody({ type: BodyType.Static }));
}

for (let i = 0; i < 200; i++) {
  const x = Math.random() * MAP_COLS * TILE_W;
  const y = Math.random() * (MAP_ROWS - 5) * TILE_H;
  const e = world.createEntity();
  world.addComponent(e, Transform, createTransform(x, y));
  const colors = ['#e94560', '#0f3460', '#533483', '#16213e', '#4a4a6a'];
  world.addComponent(e, Sprite, createSprite(colors[i % colors.length], 16, 16));
}

const player = world.createEntity();
world.addComponent(player, Transform, createTransform(100, 500));
world.addComponent(player, Sprite, createSprite('#e94560', 28, 40));
world.addComponent(player, RigidBody, createRigidBody({ type: BodyType.Dynamic, gravityScale: 1 }));
world.addComponent(player, CollisionBox, createCollisionBox(28, 40, { layer: LAYER_PLAYER }));

const cam = world.createEntity();
world.addComponent(cam, Camera, createCamera({ followEntity: player, followMode: 'lerp', lerpSpeed: 4 }));

const debugOverlay = new DebugOverlay(driver.getCanvas(), stats);
debugOverlay.registerComponentTypes({
  collisionBox: CollisionBox,
  transform: Transform,
  sprite: Sprite,
});
debugOverlay.showCollisionBoxes = true;
debugOverlay.showEntityBounds = true;
debugOverlay.showStats = true;

class DebugOverlaySystem extends System {
  readonly query = [];
  private overlay: DebugOverlay;

  constructor(overlay: DebugOverlay) {
    super();
    this.overlay = overlay;
  }

  update(world: World, _dt: number): void {
    this.overlay.render(world);
  }
}
world.addSystem(new DebugOverlaySystem(debugOverlay));

window.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') {
    debugOverlay.showStats = !debugOverlay.showStats;
    debugOverlay.showCollisionBoxes = !debugOverlay.showCollisionBoxes;
    debugOverlay.showEntityBounds = !debugOverlay.showEntityBounds;
  }
});

const loop = new GameLoop(world, { fps: 60, stats });
loop.start();

console.log('Optimized demo running! Press D to toggle debug overlay.');
