import type R from '@recast-navigation/wasm';
import { NavMesh } from './nav-mesh';
import { navPath, NavPath, vec3, Vector3 } from './utils';
import { Wasm } from './wasm';

export type NavMeshQueryParams = {
  navMesh: NavMesh;

  /**
   * @default 2048
   */
  maxNodes?: number;
};

export class NavMeshQuery {
  raw: R.NavMeshQuery;

  constructor({ navMesh, maxNodes = 2048 }: NavMeshQueryParams) {
    this.raw = new Wasm.Recast.NavMeshQuery(navMesh.raw, maxNodes);
  }

  /**
   * Returns the closest point on the NavMesh to the given position.
   */
  getClosestPoint(position: Vector3): Vector3 {
    const positionRaw = vec3.toRaw(position);
    const closestPoint = this.raw.getClosestPoint(positionRaw);

    return vec3.fromRaw(closestPoint);
  }

  /**
   * Returns a random point on the NavMesh within the given radius of the given position.
   */
  getRandomPointAround(position: Vector3, radius: number): Vector3 {
    const positionRaw = vec3.toRaw(position);
    const randomPoint = this.raw.getRandomPointAround(positionRaw, radius);

    return vec3.fromRaw(randomPoint);
  }

  /**
   * Compute the final position from a segment made of destination-position
   */
  moveAlong(position: Vector3, destination: Vector3): Vector3 {
    const positionRaw = vec3.toRaw(position);
    const destinationRaw = vec3.toRaw(destination);
    const movedPosition = this.raw.moveAlong(positionRaw, destinationRaw);

    return { x: movedPosition.x, y: movedPosition.y, z: movedPosition.z };
  }

  /**
   * Finds a path from the start position to the end position.
   *g
   * @returns an array of Vector3 positions that make up the path, or an empty array if no path was found.
   */
  computePath(start: Vector3, end: Vector3): NavPath {
    const startRaw = vec3.toRaw(start);
    const endRaw = vec3.toRaw(end);
    const pathRaw = this.raw.computePath(startRaw, endRaw);

    return navPath.fromRaw(pathRaw);
  }

  /**
   * Gets the Bounding box extent specified by setDefaultQueryExtent
   */
  getDefaultQueryExtent(): Vector3 {
    const extentRaw = this.raw.getDefaultQueryExtent();

    return { x: extentRaw.x, y: extentRaw.y, z: extentRaw.z };
  }

  /**
   * Sets the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
   * The queries will try to find a solution within those bounds.
   * The default is (1,1,1)
   */
  setDefaultQueryExtent(extent: Vector3): void {
    const extentRaw = vec3.toRaw(extent);
    this.raw.setDefaultQueryExtent(extentRaw);
  }

  /**
   * Destroys the NavMeshQuery instance
   */
  destroy(): void {
    this.raw.destroy();
  }
}
