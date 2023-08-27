import { finalizer } from './finalizer';
import { NavMesh } from './nav-mesh';
import { Raw } from './raw';
import type R from './raw-module';
import { array, vec3, Vector3 } from './utils';

export type NavMeshQueryParams = {
  navMesh: NavMesh;

  /**
   * @default 2048
   */
  maxNodes?: number;
};

export class NavMeshQuery {
  raw: R.NavMeshQuery;

  defaultFilter: R.dtQueryFilter;

  defaultQueryHalfExtents = { x: 1, y: 1, z: 1 };

  constructor(value: R.NavMeshQuery | NavMeshQueryParams) {
    if (value instanceof Raw.Module.NavMeshQuery) {
      this.raw = value;
    } else {
      this.raw = new Raw.Module.NavMeshQuery();
      this.raw.init(value.navMesh.raw, value.maxNodes ?? 2048);
      finalizer.register(this);
    }

    this.defaultFilter = new Raw.Module.dtQueryFilter();
    this.defaultFilter.setIncludeFlags(0xffff);
    this.defaultFilter.setExcludeFlags(0);
  }

  findNearestPoly(
    position: Vector3,
    halfExtents: Vector3,
    filter?: R.dtQueryFilter
  ) {
    const result = this.raw.findNearestPoly(
      vec3.toArray(position),
      vec3.toArray(halfExtents),
      filter ?? this.defaultFilter
    );

    const { status, nearestRef, isOverPoly } = result;

    return {
      status,
      nearestRef,
      nearestPoint: vec3.fromArray(array((i) => result.get_nearestPt(i), 3)),
      isOverPoly,
    };
  }

  /**
   * Returns the closest point on the NavMesh to the given position.
   */
  getClosestPoint(position: Vector3, filter?: R.dtQueryFilter): Vector3 {
    const closestPointRaw = this.raw.getClosestPoint(
      vec3.toArray(position),
      vec3.toArray(this.defaultQueryHalfExtents),
      filter ?? this.defaultFilter
    );

    return vec3.fromRaw(closestPointRaw);
  }

  /**
   * Returns a random point on the NavMesh within the given radius of the given position.
   */
  getRandomPointAround(
    position: Vector3,
    radius: number,
    filter?: R.dtQueryFilter
  ): Vector3 {
    const randomPointRaw = this.raw.getRandomPointAround(
      vec3.toArray(position),
      radius,
      vec3.toArray(this.defaultQueryHalfExtents),
      filter ?? this.defaultFilter
    );

    return vec3.fromRaw(randomPointRaw);
  }

  /**
   * Compute the final position from a segment made of destination-position
   */
  moveAlong(
    position: Vector3,
    destination: Vector3,
    filter?: R.dtQueryFilter
  ): Vector3 {
    return vec3.fromRaw(
      this.raw.moveAlong(
        vec3.toArray(position),
        vec3.toArray(destination),
        vec3.toArray(this.defaultQueryHalfExtents),
        filter ?? this.defaultFilter
      ),
      true
    );
  }

  /**
   * Finds a path from the start position to the end position.
   *
   * @returns an array of Vector3 positions that make up the path, or an empty array if no path was found.
   */
  computePath(
    start: Vector3,
    end: Vector3,
    filter?: R.dtQueryFilter
  ): Vector3[] {
    const pathRaw = this.raw.computePath(
      vec3.toArray(start),
      vec3.toArray(end),
      vec3.toArray(this.defaultQueryHalfExtents),
      filter ?? this.defaultFilter
    );

    return array((i) => pathRaw.getPoint(i), pathRaw.getPointCount()).map(
      (vec) => vec3.fromRaw(vec)
    );
  }

  /**
   * Destroys the NavMeshQuery instance
   */
  destroy(): void {
    finalizer.unregister(this);
    this.raw.destroy();
  }
}
