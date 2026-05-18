import { World, GameLoop, EventBus } from '@game-engine/core';
import {
  CanvasDriver,
  RenderSystem,
  Transform,
  Sprite,
  Camera,
  CameraSystem,
  createTransform,
  createSprite,
  createCamera,
  type TransformData,
  type SpriteData,
} from '@game-engine/renderer-canvas';
import {
  RigidBody,
  createRigidBody,
  BodyType,
  CollisionBox,
  createCollisionBox,
  PhysicsSystem,
  CollisionSystem,
  CollisionMatrix,
  LAYER_PLAYER,
  LAYER_ENVIRONMENT,
  LAYER_ENEMY,
  type RigidBodyData,
  type SpriteData,
  type CollisionEvent,
} from '@game-engine/core';
import { BehaviorSystem, type Behavior } from '@game-engine/core';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WORLD_WIDTH = 2500;
const GROUND_Y = 500;

// Initialize canvas driver
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const driver = new CanvasDriver({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: '#1a1a2e' });
// Replace the auto-created canvas with our existing one
const driverCanvas = driver.getCanvas();
canvas.parentElement?.replaceChild(driverCanvas, canvas);
driverCanvas.id = 'gameCanvas';

// Create world with event bus
const eventBus = new EventBus();
const world = new World(eventBus);

// --- Platform definitions ---
const platformDefs = [
  { x: 400, y: 380, w: 140, h: 20 },
  { x: 700, y: 320, w: 140, h: 20 },
  { x: 1050, y: 260, w: 140, h: 20 },
  { x: 1400, y: 330, w: 140, h: 20 },
  { x: 1800, y: 380, w: 140, h: 20 },
];

// --- Create environment ---
const ground = world.createEntity();
world.addComponent(ground, Transform, createTransform(WORLD_WIDTH / 2, GROUND_Y));
world.addComponent(ground, Sprite, createSprite('#2d4a22', WORLD_WIDTH, 40));

// Platforms
for (const p of platformDefs) {
  const e = world.createEntity();
  world.addComponent(e, Transform, createTransform(p.x, p.y));
  world.addComponent(e, Sprite, createSprite('#4a4a6a', p.w, p.h));
}

// --- Create enemy ---
const enemy = world.createEntity();
world.addComponent(enemy, Transform, createTransform(1000, 300));
world.addComponent(enemy, Sprite, createSprite('#e94560', 40, 40));
world.addComponent(enemy, CollisionBox, createCollisionBox(40, 40));

// Enemy behavior - simple patrolling
class EnemyBehavior implements Behavior {
  private direction = 1;
  private speed = 50;
  private startX: number;

  constructor(startX: number) {
    this.startX = startX;
  }

  onUpdate(world: World, entity: number, dt: number): void {
    const t = world.getComponent<TransformData>(entity, Transform)!;
    t.x += this.direction * this.speed * dt;
    if (t.x > this.startX + 150) {
      this.direction = -1;
    } else if (t.x < this.startX - 150) {
      this.direction = 1;
    }
  }
}

world.addBehavior(enemy, 'patrol', new EnemyBehavior(1000));

// --- Create player with behaviors ---
const player = world.createEntity();
world.addComponent(player, Transform, createTransform(200, 300));
world.addComponent(player, Sprite, createSprite('#4dabf7', 32, 48));
world.addComponent(player, RigidBody, createRigidBody({ type: BodyType.Dynamic }));
world.addComponent(player, CollisionBox, createCollisionBox(32, 48));

// Player Controller Behavior
class PlayerController implements Behavior {
  private speed = 300;
  private jumpForce = 400;

  onUpdate(world: World, entity: number, dt: number): void {
    const input = world.getInputManager();
    const t = world.getComponent<TransformData>(entity, Transform)!;
    const rb = world.getComponent<RigidBodyData>(entity, RigidBody)!;
    let dx = 0;
    if (input.isKeyDown('ArrowLeft') || input.isKeyDown('a')) dx -= 1;
    if (input.isKeyDown('ArrowRight') || input.isKeyDown('d')) dx += 1;
    rb.vx = dx * this.speed;
    if ((input.isKeyPressed('ArrowUp') || input.isKeyPressed(' ') || input.isKeyPressed('w')) && rb.onGround) {
      rb.vy = -this.jumpForce;
    }
    if (t.x < 16) t.x = 16;
    if (t.x > WORLD_WIDTH - 16) t.x = WORLD_WIDTH - 16;
  }

  onCollision(world: World, entity: number, other: number, event: CollisionEvent): void {
    const otherSprite = world.getComponent<SpriteData>(other, Sprite);
    if (otherSprite?.color === '#e94560') {
      console.log('Player hit enemy!');
    }
  }
}

// Health Behavior
class HealthBehavior implements Behavior {
  private hp = 100;
  private maxHp = 100;

  onCollision(world: World, entity: number, other: number, event: CollisionEvent): void {
    const otherSprite = world.getComponent<SpriteData>(other, Sprite);
    if (otherSprite?.color === '#e94560') {
      this.hp -= 10;
      if (this.hp <= 0) {
        this.hp = 100;
        const t = world.getComponent<TransformData>(entity, Transform)!;
        t.x = 200;
        t.y = 300;
      }
      const hpEl = document.getElementById('hp-value');
      const fillEl = document.getElementById('health-fill');
      if (hpEl) hpEl.textContent = this.hp.toString();
      if (fillEl) fillEl.style.width = ((this.hp / this.maxHp) * 100) + '%';
    }
  }
}

world.addBehavior(player, 'controller', new PlayerController());
world.addBehavior(player, 'health', new HealthBehavior());

// --- Collision system ---
const collisionMatrix = new CollisionMatrix();
collisionMatrix.enableCollision(LAYER_PLAYER, LAYER_ENVIRONMENT);
collisionMatrix.enableCollision(LAYER_PLAYER, LAYER_ENEMY);
const collisionSys = new CollisionSystem(collisionMatrix, eventBus);

// --- Camera ---
const cameraEntity = world.createEntity();
world.addComponent(cameraEntity, Camera, createCamera({
  followEntity: player,
  followMode: 'lerp',
  lerpSpeed: 4,
  zoom: 1,
}));

// --- Systems ---
world.addSystem(new PhysicsSystem());
world.addSystem(collisionSys);
world.addSystem(new BehaviorSystem(eventBus));
world.addSystem(new RenderSystem(driver));
const cameraSys = new CameraSystem();
world.addSystem(cameraSys);

// --- Game loop ---
const loop = new GameLoop(world, { fps: 60 });
loop.start();
console.log('Behavior System Demo running!');
console.log('Use arrow keys / WASD to move, SPACE to jump');
console.log('Avoid the red enemy, try the platformer gameplay with Behavior scripting!');
