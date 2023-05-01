import type R from '@recast-navigation/wasm';
import { NavMesh } from './nav-mesh';
import {
  BoxObstacle,
  CylinderObstacle,
  Obstacle,
  ObstacleRef,
} from './obstacle';
import { vec3, Vector3 } from './utils';
import { Wasm } from './wasm';

export type TileCacheParams = {
  orig: ReadonlyArray<number>;
  cs: number;
  ch: number;
  width: number;
  height: number;
  walkableHeight: number;
  walkableRadius: number;
  walkableClimb: number;
  maxSimplificationError: number;
  maxTiles: number;
  maxObstacles: number;
};

export type TileCacheUpdateResult = {
  status: number;
  upToDate: boolean;
};

export class TileCache {
  raw: R.TileCache;

  obstacles: Map<ObstacleRef, Obstacle> = new Map();

  constructor(raw?: R.TileCache) {
    this.raw = raw ?? new Wasm.Recast.TileCache();
  }

  /**
   * Initialises the TileCache
   * @param params
   */
  init(params: TileCacheParams) {
    this.raw.init(params as never);
  }

  /**
   * Updates the tile cache by rebuilding tiles touched by unfinished obstacle requests.
   * This should be called after adding or removing obstacles.
   */
  update(navMesh: NavMesh): TileCacheUpdateResult {
    const { status, upToDate } = this.raw.update(navMesh.raw);

    return {
      status,
      upToDate,
    };
  }

  /**
   * Creates a cylinder obstacle and adds it to the navigation mesh.
   */
  addCylinderObstacle(
    position: Vector3,
    radius: number,
    height: number
  ): CylinderObstacle {
    const ref = this.raw.addCylinderObstacle(
      vec3.toRaw(position),
      radius,
      height
    );

    const obstacle: CylinderObstacle = {
      type: 'cylinder',
      ref,
      position,
      radius,
      height,
    };

    this.obstacles.set(ref, obstacle);

    return obstacle;
  }

  /**
   * Creates a box obstacle and adds it to the navigation mesh.
   */
  addBoxObstacle(
    position: Vector3,
    extent: Vector3,
    angle: number
  ): BoxObstacle {
    const ref = this.raw.addBoxObstacle(
      vec3.toRaw(position),
      vec3.toRaw(extent),
      angle
    );

    const obstacle: BoxObstacle = {
      type: 'box',
      ref,
      position,
      extent,
      angle,
    };

    this.obstacles.set(ref, obstacle);

    return obstacle;
  }

  /**
   * Removes an obstacle from the navigation mesh.
   */
  removeObstacle(obstacle: Obstacle | ObstacleRef): void {
    let ref: ObstacleRef;

    if (typeof obstacle === 'object') {
      ref = (obstacle as Obstacle).ref;
    } else {
      ref = obstacle;
    }

    this.obstacles.delete(ref);
    this.raw.removeObstacle(ref);
  }
}
