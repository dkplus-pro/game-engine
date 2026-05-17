import { System, type World } from '@game-engine/core';
import { Transform, type TransformData } from '@game-engine/renderer-canvas';
import { Player, type PlayerData } from '../components/Player';
import { InputManager } from '@game-engine/core';

export class PlayerMovementSystem extends System {
  readonly query = [Transform, Player];
  private input: InputManager;
  private gravity: number;

  constructor(input: InputManager, gravity: number) {
    super();
    this.input = input;
    this.gravity = gravity;
  }

  update(world: World, dt: number): void {
    const entities = world.query(this.query);

    for (const entity of entities) {
      const t = world.getComponent<TransformData>(entity, Transform)!;
      const p = world.getComponent<PlayerData>(entity, Player)!;

      // Horizontal movement
      let dx = 0;
      if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('a')) dx -= 1;
      if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('d')) dx += 1;
      t.x += dx * p.speed * dt;

      // Jump
      if ((this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed(' ') || this.input.isKeyPressed('w')) && p.onGround) {
        p.vy = -p.jumpForce;
        p.onGround = false;
      }

      // Apply gravity
      p.vy += this.gravity * dt;
      t.y += p.vy * dt;

      // World bounds
      if (t.x < 16) t.x = 16;
      if (t.x > 2500 - 16) t.x = 2500 - 16;
    }
  }
}