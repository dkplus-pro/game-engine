import { World, GameLoop } from '@game-engine/core';
import {
  CanvasDriver, RenderSystem, Transform, Sprite,
  createTransform, createSprite,
} from '@game-engine/renderer-canvas';
import {
  CANVAS_W, CANVAS_H, CELL, COLS,
  OFFSET_X, OFFSET_Y, TANK_SIZE, WALL_W, WALL_H,
  PLAYER_COLOR, ENEMY_COLOR, BRICK_COLOR, STEEL_COLOR, BASE_COLOR, BG_COLOR,
  Dir, Tank, TankData, WallComponent, WallData, BaseComponent, BaseData,
  PLAYER_SPEED, ENEMY_SPEED,
} from './constants';
import { PlayerSystem } from './systems/PlayerSystem';
import { EnemySystem } from './systems/EnemySystem';
import { BulletSystem } from './systems/BulletSystem';
import { BarrelRenderSystem } from './systems/BarrelRenderSystem';
import { GameSystem } from './systems/GameSystem';
import { LEVELS, type LevelConfig } from './maps';

const driver = new CanvasDriver({
  width: CANVAS_W,
  height: CANVAS_H,
  backgroundColor: BG_COLOR,
});

const canvasEl = driver.getCanvas();
const existingCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (existingCanvas && existingCanvas.parentElement) {
  existingCanvas.parentElement.replaceChild(canvasEl, existingCanvas);
}
canvasEl.id = 'gameCanvas';

let world: World;
let gameSystem: GameSystem;
let loop: GameLoop;
let currentLevel = 0;
let score = 0;

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function updateUI(): void {
  $('score').textContent = score.toString().padStart(6, '0');
  $('lives').textContent = gameSystem.lives.toString();
  $('level-display').textContent = (currentLevel + 1).toString();
}

function brickCenter(col: number, row: number) {
  return {
    x: OFFSET_X + col * CELL + WALL_W / 2,
    y: OFFSET_Y + row * CELL + WALL_H / 2,
  };
}

function centerAt(col: number, row: number) {
  return {
    x: OFFSET_X + col * CELL + CELL,
    y: OFFSET_Y + row * CELL + CELL,
  };
}

function addWall(list: { col: number; row: number }[], brick: boolean): void {
  for (const w of list) {
    const e = world.createEntity();
    const { x, y } = brickCenter(w.col, w.row);
    world.addComponent(e, Transform, createTransform(x, y));
    world.addComponent(e, Sprite, createSprite(brick ? BRICK_COLOR : STEEL_COLOR, WALL_W, WALL_H));
    world.addComponent(e, WallComponent, { brick });
  }
}

function spawnTank(col: number, row: number, color: string, isPlayer: boolean, dir: Dir): number {
  const { x, y } = centerAt(col, row);
  const e = world.createEntity();
  world.addComponent(e, Transform, createTransform(x, y));
  world.addComponent(e, Sprite, createSprite(color, TANK_SIZE, TANK_SIZE));
  world.addComponent(e, Tank, {
    direction: dir,
    health: isPlayer ? 3 : 1,
    speed: isPlayer ? PLAYER_SPEED : ENEMY_SPEED,
    fireCooldown: isPlayer ? 0 : Math.random() * 3,
    fireRate: isPlayer ? 3 : 1,
    isPlayer,
  });
  return e;
}

function buildLevel(levelIndex: number): void {
  const level = LEVELS[levelIndex];
  if (!level) return;

  addWall(level.bricks, true);
  addWall(level.steels, false);

  const bp = centerAt(12, 21);
  const baseEntity = world.createEntity();
  world.addComponent(baseEntity, Transform, createTransform(bp.x, bp.y));
  world.addComponent(baseEntity, Sprite, createSprite(BASE_COLOR, TANK_SIZE, TANK_SIZE));
  world.addComponent(baseEntity, BaseComponent, { alive: true });

  spawnTank(level.playerCol, level.playerRow, PLAYER_COLOR, true, Dir.Up);

  const count = Math.min(level.enemyCount, 6);
  for (let i = 0; i < count; i++) {
    spawnTank(4 + i * 4, 0, ENEMY_COLOR, false, Dir.Down);
  }

  gameSystem.startLevel(level.enemyCount, level.playerCol, level.playerRow);
}

function showOverlay(id: string, show: boolean): void {
  $(id).classList.toggle('visible', show);
}

function startGame(): void {
  world = new World();

  gameSystem = new GameSystem({
    onScoreChange: (s) => { score = s; updateUI(); },
    onLivesChange: () => { updateUI(); },
    onGameOver: (s) => {
      loop.stop();
      $('final-score').textContent = `Score: ${s}`;
      showOverlay('game-over-screen', true);
    },
    onLevelComplete: (s) => {
      loop.stop();
      $('level-complete-score').textContent = `Score: ${s}`;
      showOverlay('level-up-screen', true);
    },
    onPlayerDeath: () => {},
  });

  world.addSystem(new PlayerSystem());
  world.addSystem(new EnemySystem());
  world.addSystem(new BulletSystem());
  world.addSystem(gameSystem);
  world.addSystem(new RenderSystem(driver));
  world.addSystem(new BarrelRenderSystem(driver.getContext()));

  buildLevel(0);
  updateUI();
  loop = new GameLoop(world, { fps: 60 });
  loop.start();

  $('restart-btn').onclick = () => {
    showOverlay('game-over-screen', false);
    currentLevel = 0;
    score = 0;
    gameSystem.lives = 3;
    gameSystem.score = 0;
    gameSystem.killedEnemies = 0;
    gameSystem.state = 'playing';
    world.clearEntities();
    buildLevel(currentLevel);
    updateUI();
    loop.start();
  };

  $('next-level-btn').onclick = () => {
    showOverlay('level-up-screen', false);
    currentLevel++;
    if (currentLevel >= LEVELS.length) currentLevel = 0;
    gameSystem.killedEnemies = 0;
    gameSystem.state = 'playing';
    world.clearEntities();
    buildLevel(currentLevel);
    updateUI();
    loop.start();
  };
}

startGame();
