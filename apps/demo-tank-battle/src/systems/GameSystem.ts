import { System, type World } from '@game-engine/core';
import { Transform, Sprite } from '@game-engine/renderer-canvas';
import { Tank, TankData, BaseComponent, BaseData } from '../constants';

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onGameOver: (score: number) => void;
  onLevelComplete: (score: number) => void;
  onPlayerDeath: (livesLeft: number) => void;
}

export class GameSystem extends System {
  readonly query: any[] = [];
  score = 0;
  lives = 3;
  totalEnemies = 0;
  killedEnemies = 0;
  state: 'playing' | 'gameover' | 'levelcomplete' = 'playing';
  private callbacks: GameCallbacks;

  constructor(callbacks: GameCallbacks) {
    super();
    this.callbacks = callbacks;
  }

  startLevel(enemyCount: number, _playerCol: number, _playerRow: number): void {
    this.totalEnemies = enemyCount;
    this.killedEnemies = 0;
    this.state = 'playing';
  }

  update(world: World, _dt: number): void {
    if (this.state !== 'playing') return;

    const bases = world.query([BaseComponent, Transform, Sprite]);
    for (const base of bases) {
      const bd = world.getComponent<BaseData>(base, BaseComponent)!;
      if (!bd.alive) {
        this.state = 'gameover';
        this.callbacks.onGameOver(this.score);
        return;
      }
    }

    const tanks = world.query([Tank, Transform, Sprite]);

    for (const t of tanks) {
      const td = world.getComponent<TankData>(t, Tank)!;
      if (td.isPlayer) {
        if (td.health <= 0) {
          world.destroyEntity(t);
          this.lives--;
          this.callbacks.onLivesChange(this.lives);
          if (this.lives <= 0) {
            this.state = 'gameover';
            this.callbacks.onGameOver(this.score);
          } else {
            this.callbacks.onPlayerDeath(this.lives);
            this.state = 'gameover';
            this.callbacks.onGameOver(this.score);
          }
          return;
        }
      } else {
        if (td.health <= 0) {
          world.destroyEntity(t);
          this.killedEnemies++;
          this.score = this.killedEnemies * 100;
          this.callbacks.onScoreChange(this.score);
        }
      }
    }

    if (this.killedEnemies >= this.totalEnemies) {
      this.state = 'levelcomplete';
      this.callbacks.onLevelComplete(this.score);
    }
  }
}
