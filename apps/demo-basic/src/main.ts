import { World, GameLoop } from '@game-engine/core';
import { CanvasDriver, RenderSystem, Transform, Sprite, createTransform, createSprite } from '@game-engine/renderer-canvas';
import { Velocity, createVelocity, MovementSystem } from './MovementSystem';

// Initialize canvas driver
const driver = new CanvasDriver({
  width: 800,
  height: 600,
  backgroundColor: '#16213e',
});

// Create world
const world = new World();

// Add systems (order matters: movement before render)
world.addSystem(new MovementSystem({ width: driver.getWidth(), height: driver.getHeight() }));
world.addSystem(new RenderSystem(driver));

// Create bouncing rectangle entity
const rect = world.createEntity();
world.addComponent(rect, Transform, createTransform(100, 100));
world.addComponent(rect, Sprite, createSprite('#e94560', 50, 50));
world.addComponent(rect, Velocity, createVelocity(200, 150)); // pixels per second

// Start game loop
const loop = new GameLoop(world, { fps: 60 });
loop.start();

console.log('Game engine demo running! Entity ID:', rect);