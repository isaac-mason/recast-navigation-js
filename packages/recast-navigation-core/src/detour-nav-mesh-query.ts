import type R from '@recast-navigation/wasm';
import { finalizer } from './finalizer';
import { NavMesh } from './detour-nav-mesh';
import { array, vec3, Vector3 } from './utils';
import { Raw } from './raw';

export type NavMeshQueryParams = {
  navMesh: NavMesh;

  /**
   * @default 2048
   */
  maxNodes?: number;
};

export class NavMeshQuery {
  raw: R.NavMeshQuery;

  private tmpVec1 = new Raw.Module.Vec3();
  private tmpVec2 = new Raw.Module.Vec3();

  constructor({ navMesh, maxNodes = 2048 }: NavMeshQueryParams) {
    this.raw = new Raw.Module.NavMeshQuery(navMesh.raw, maxNodes);

    finalizer.register(this);
  }

  /**
   * Returns the closest point on the NavMesh to the given position.
   */
  getClosestPoint(position: Vector3): Vector3 {
    const positionRaw = vec3.toRaw(position, this.tmpVec1);
    const closestPointRaw = this.raw.getClosestPoint(positionRaw)

    return vec3.fromRaw(closestPointRaw, true);
  }

  /**
   * Returns a random point on the NavMesh within the given radius of the given position.
   */
  getRandomPointAround(position: Vector3, radius: number): Vector3 {
    const positionRaw = vec3.toRaw(position, this.tmpVec1);

    return vec3.fromRaw(
      this.raw.getRandomPointAround(positionRaw, radius),
      true
    );
  }

  /**
   * Compute the final position from a segment made of destination-position
   */
  moveAlong(position: Vector3, destination: Vector3): Vector3 {
    const positionRaw = vec3.toRaw(position, this.tmpVec1);
    const destinationRaw = vec3.toRaw(destination, this.tmpVec2);

    return vec3.fromRaw(this.raw.moveAlong(positionRaw, destinationRaw), true);
  }

  /**
   * Finds a path from the start position to the end position.
   *
   * @returns an array of Vector3 positions that make up the path, or an empty array if no path was found.
   */
  computePath(start: Vector3, end: Vector3): Vector3[] {
    const startRaw = vec3.toRaw(start, this.tmpVec1);
    const endRaw = vec3.toRaw(end, this.tmpVec2);
    const pathRaw = this.raw.computePath(startRaw, endRaw);

    return array((i) => pathRaw.getPoint(i), pathRaw.getPointCount()).map(
      (vec) => vec3.fromRaw(vec)
    );
  }

  /**
   * Gets the Bounding box extent specified by setDefaultQueryExtent
   */
  getDefaultQueryExtent(): Vector3 {
    return vec3.fromRaw(this.raw.getDefaultQueryExtent(), true);
  }

  /**
   * Sets the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
   * The queries will try to find a solution within those bounds.
   * The default is (1,1,1)
   */
  setDefaultQueryExtent(extent: Vector3): void {
    const extentRaw = vec3.toRaw(extent, this.tmpVec1);
    this.raw.setDefaultQueryExtent(extentRaw);
  }

  /**
   * Destroys the NavMeshQuery instance
   */
  destroy(): void {
    finalizer.unregister(this);
    this.raw.destroy();
  }
}
