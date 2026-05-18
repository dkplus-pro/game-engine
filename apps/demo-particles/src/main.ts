import { World, GameLoop } from '@game-engine/core';
import {
  CanvasDriver,
  RenderSystem,
  Transform,
  createTransform,
  Camera,
  createCamera,
} from '@game-engine/renderer-canvas';
import {
  ParticleEmitter,
  createEmitter,
  ParticleSystem,
  PRESETS,
  type PresetName,
} from '@game-engine/renderer-canvas';

// Initialize canvas driver
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const driver = new CanvasDriver({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0a0a0a',
});
// Replace the auto-created canvas with our existing one
const driverCanvas = driver.getCanvas();
canvas.parentElement?.replaceChild(driverCanvas, canvas);
driverCanvas.id = 'gameCanvas';

// Create world
const world = new World();

// Add camera
const cameraEntity = world.createEntity();
world.addComponent(cameraEntity, Camera, createCamera({ x: 0, y: 0 }));

// Add systems
const particleSystem = new ParticleSystem(10000);
world.addSystem(new RenderSystem(driver));
world.addSystem(particleSystem);

// Active emitters tracking
const activeEmitters = new Set<number>();

// Create particle emitter at position
function createParticleEmitter(
  presetName: PresetName,
  x: number,
  y: number,
  burstOnly = false
): number {
  const preset = { ...PRESETS[presetName] } as any;

  const entity = world.createEntity();
  world.addComponent(entity, Transform, createTransform(x, y));

  // For continuous emitters, keep rate; for burst, set rate to 0
  if (burstOnly && preset.burst) {
    preset.rate = 0;
    preset.burst = preset.burst;
  }

  preset.active = true;
  preset.elapsed = 0;

  world.addComponent(entity, ParticleEmitter, preset);
  activeEmitters.add(entity);

  return entity;
}

// Remove emitter
function removeEmitter(entity: number): void {
  if (activeEmitters.has(entity)) {
    world.destroyEntity(entity);
    activeEmitters.delete(entity);
  }
}

// Clear all emitters
function clearAllEmitters(): void {
  for (const entity of activeEmitters) {
    world.destroyEntity(entity);
  }
  activeEmitters.clear();
}

// Setup UI controls
const fireBtn = document.getElementById('btn-fire') as HTMLButtonElement;
const smokeBtn = document.getElementById('btn-smoke') as HTMLButtonElement;
const explosionBtn = document.getElementById('btn-explosion') as HTMLButtonElement;
const magicBtn = document.getElementById('btn-magic') as HTMLButtonElement;
const sparkBtn = document.getElementById('btn-spark') as HTMLButtonElement;
const snowBtn = document.getElementById('btn-snow') as HTMLButtonElement;
const clearBtn = document.getElementById('btn-clear') as HTMLButtonElement;

let currentPreset: PresetName | null = 'fire';

function setActiveButton(btn: HTMLButtonElement) {
  document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

fireBtn.addEventListener('click', () => {
  currentPreset = 'fire';
  setActiveButton(fireBtn);
});

smokeBtn.addEventListener('click', () => {
  currentPreset = 'smoke';
  setActiveButton(smokeBtn);
});

explosionBtn.addEventListener('click', () => {
  currentPreset = 'explosion';
  setActiveButton(explosionBtn);
});

magicBtn.addEventListener('click', () => {
  currentPreset = 'magic';
  setActiveButton(magicBtn);
});

sparkBtn.addEventListener('click', () => {
  currentPreset = 'spark';
  setActiveButton(sparkBtn);
});

snowBtn.addEventListener('click', () => {
  currentPreset = 'snow';
  setActiveButton(snowBtn);
});

clearBtn.addEventListener('click', () => {
  clearAllEmitters();
});

// Click to create emitters
(driverCanvas as HTMLCanvasElement).addEventListener('click', (e) => {
  const rect = driverCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (currentPreset) {
    if (currentPreset === 'explosion' || currentPreset === 'spark') {
      createParticleEmitter(currentPreset, x, y, true);
    } else {
      createParticleEmitter(currentPreset, x, y, false);
    }
  }
});

// Mouse move to create continuous emitters for fire/smoke
let lastEmitTime = 0;
driverCanvas.addEventListener('mousemove', (e) => {
  if (currentPreset !== 'fire' && currentPreset !== 'smoke' && currentPreset !== 'snow' && currentPreset !== 'magic') {
    return;
  }
  const now = Date.now();
  if (now - lastEmitTime < 100) return;
  lastEmitTime = now;

  const rect = driverCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const entity = createParticleEmitter(currentPreset, x, y, false);
  setTimeout(() => {
    removeEmitter(entity);
  }, 200);
});

// Handle resize
window.addEventListener('resize', () => {
  driver.resize(window.innerWidth, window.innerHeight);
});

// Create game loop
const loop = new GameLoop(world, { fps: 60 });

// Inject custom render into game loop
const originalUpdate = (loop as any).update;
(loop as any).update = (dt: number) => {
  if (originalUpdate) {
    originalUpdate.call(loop, dt);
  }
  // Custom render pass for particles
  particleSystem.render(driver.getContext(), { x: 0, y: 0, zoom: 1 });
};

loop.start();

console.log('Particle System Demo running! Click anywhere to create emitters.');
