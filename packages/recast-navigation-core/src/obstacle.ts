import type R from '@recast-navigation/wasm';
import type { Vector3 } from './utils';

export type ObstacleRef = R.dtObstacleRef;

export type BoxObstacle = {
  type: 'box';
  ref: ObstacleRef;
  position: Vector3;
  extent: Vector3;
  angle: number;
};

export type CylinderObstacle = {
  type: 'cylinder';
  ref: ObstacleRef;
  position: Vector3;
  radius: number;
  height: number;
};

export type Obstacle = BoxObstacle | CylinderObstacle;
