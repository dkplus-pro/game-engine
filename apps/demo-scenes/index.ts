import { GameLoop, World, defineComponent, Transform, SpriteRenderer } from '../../packages/game-engine/src';
import { SceneManager, FadeTransition } from '../../packages/game-engine/src/scene';

// Create world
const world = new World();

// Create game loop
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const gameLoop = new GameLoop(world, {
  transition: new FadeTransition(),
});

// Create scene manager
const sceneManager = new SceneManager(world);

// Register menu scene
sceneManager.register('menu', {
  name: 'menu',
  onCreate: (world) => {
    // Create menu title
    const titleEntity = world.createEntity();
    world.addComponent(titleEntity, Transform, { x: 400, y: 300 });
    world.addComponent(titleEntity, SpriteRenderer, {
      text: 'MAIN MENU',
      fontSize: 48,
      color: '#ffffff'
    });

    // Create start button
    const startButton = world.createEntity();
    world.addComponent(startButton, Transform, { x: 400, y: 400 });
    world.addComponent(startButton, SpriteRenderer, {
      text: 'START GAME',
      fontSize: 24,
      color: '#00ff00'
    });
  },
  onDestroy: (world) => {
    world.clearEntities();
  },
});

// Register game scene
sceneManager.register('game', {
  name: 'game',
  onCreate: (world, data) => {
    const level = data?.level || 1;

    // Create player
    const player = world.createEntity();
    world.addComponent(player, Transform, { x: 100, y: 100 });
    world.addComponent(player, SpriteRenderer, {
      text: 'PLAYER',
      fontSize: 20,
      color: '#0000ff'
    });

    // Create platforms
    for (let i = 0; i < 5; i++) {
      const platform = world.createEntity();
      world.addComponent(platform, Transform, { x: i * 200, y: 500 });
      world.addComponent(platform, SpriteRenderer, {
        text: '---',
        fontSize: 12,
        color: '#808080'
      });
    }
  },
  onPause: (world) => {
    // Pause game logic
  },
  onResume: (world) => {
    // Resume game logic
  },
  onDestroy: (world) => {
    world.clearEntities();
  },
});

// Register pause scene
sceneManager.register('pause', {
  name: 'pause',
  onCreate: (world) => {
    const pauseText = world.createEntity();
    world.addComponent(pauseText, Transform, { x: 400, y: 300 });
    world.addComponent(pauseText, SpriteRenderer, {
      text: 'PAUSED',
      fontSize: 48,
      color: '#ffff00'
    });
  },
  onDestroy: (world) => {
    world.clearEntities();
  },
});

// Register result scene
sceneManager.register('result', {
  name: 'result',
  onCreate: (world, data) => {
    const scoreText = world.createEntity();
    world.addComponent(scoreText, Transform, { x: 400, y: 250 });
    world.addComponent(scoreText, SpriteRenderer, {
      text: `GAME OVER - Score: ${data?.score || 0}`,
      fontSize: 36,
      color: '#ff0000'
    });

    const restartButton = world.createEntity();
    world.addComponent(restartButton, Transform, { x: 400, y: 400 });
    world.addComponent(restartButton, SpriteRenderer, {
      text: 'RESTART',
      fontSize: 24,
      color: '#00ff00'
    });
  },
  onDestroy: (world) => {
    world.clearEntities();
  },
});

// Start the game with menu scene
sceneManager.load('menu');

// Example of scene transitions
setTimeout(() => {
  sceneManager.push('pause');
}, 5000);

setTimeout(() => {
  sceneManager.pop();
}, 7000);

setTimeout(() => {
  sceneManager.load('game', { level: 1 });
}, 10000);

setTimeout(() => {
  sceneManager.load('result', { score: 1000 });
}, 15000);

setTimeout(() => {
  sceneManager.load('menu');
}, 20000);