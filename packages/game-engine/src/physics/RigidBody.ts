import { defineComponent, type ComponentType } from '../ecs/Component';

export enum BodyType {
  Static = 0,
  Dynamic = 1,
}

export interface RigidBodyData {
  type: BodyType;
  mass: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  gravityScale: number;
  friction: number;
  restitution: number;
  onGround: boolean;
}

export const RigidBody: ComponentType<RigidBodyData> = defineComponent<RigidBodyData>();

export function createRigidBody(options?: Partial<RigidBodyData>): RigidBodyData {
  return {
    type: options?.type ?? BodyType.Dynamic,
    mass: options?.mass ?? 1,
    vx: options?.vx ?? 0,
    vy: options?.vy ?? 0,
    ax: options?.ax ?? 0,
    ay: options?.ay ?? 0,
    gravityScale: options?.gravityScale ?? 1,
    friction: options?.friction ?? 0,
    restitution: options?.restitution ?? 0,
    onGround: options?.onGround ?? false,
  };
}