import { finalizer } from './finalizer';
import { NavMesh } from './nav-mesh';
import { Arrays, Raw } from './raw';
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
    options?: { filter?: R.dtQueryFilter; halfExtents?: Vector3 }
  ) {
    const nearestRef = new Raw.UnsignedIntRef();
    const nearestPoint = new Raw.Vec3();
    const isOverPoly = new Raw.BoolRef();

    const status = this.raw.findNearestPoly(
      vec3.toArray(position),
      vec3.toArray(options?.halfExtents ?? this.defaultQueryHalfExtents),
      options?.filter ?? this.defaultFilter,
      nearestRef,
      nearestPoint,
      isOverPoly
    );

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      nearestRef: nearestRef.value,
      nearestPoint: vec3.fromRaw(nearestPoint),
      isOverPoly: isOverPoly.value,
    };
  }

  closestPointOnPoly(polyRef: number, position: Vector3) {
    const closestPoint = new Raw.Vec3();
    const positionOverPoly = new Raw.BoolRef();

    const status = this.raw.closestPointOnPoly(
      polyRef,
      vec3.toArray(position),
      closestPoint,
      positionOverPoly
    );

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      closestPoint: vec3.fromRaw(closestPoint),
      posOverPoly: positionOverPoly.value,
    };
  }

  /**
   * Returns the closest point on the NavMesh to the given position.
   */
  getClosestPoint(
    position: Vector3,
    options?: { filter?: R.dtQueryFilter }
  ): Vector3 {
    const closestPointRaw = this.raw.getClosestPoint(
      vec3.toArray(position),
      vec3.toArray(this.defaultQueryHalfExtents),
      options?.filter ?? this.defaultFilter
    );

    return vec3.fromRaw(closestPointRaw);
  }

  /**
   * Returns a random point on the NavMesh within the given radius of the given position.
   */
  getRandomPointAround(
    position: Vector3,
    radius: number,
    options?: {
      filter?: R.dtQueryFilter;
    }
  ): Vector3 {
    const randomPointRaw = this.raw.getRandomPointAround(
      vec3.toArray(position),
      radius,
      vec3.toArray(this.defaultQueryHalfExtents),
      options?.filter ?? this.defaultFilter
    );

    return vec3.fromRaw(randomPointRaw);
  }

  /**
   * Moves from the start to the end position constrained to the navigation mesh.
   * @param startRef 
   * @param startPosition 
   * @param endPosition 
   * @param options 
   * @returns 
   */
  moveAlongSurface(
    startRef: number,
    startPosition: Vector3,
    endPosition: Vector3,
    options?: {
      filter?: R.dtQueryFilter;
      maxVisitedSize?: number;
    }
  ) {
    const resultPosition = new Raw.Vec3();
    const visited = new Arrays.UnsignedIntArray();

    const filter = options?.filter ?? this.defaultFilter;

    const status = this.raw.moveAlongSurface(
      startRef,
      vec3.toArray(startPosition),
      vec3.toArray(endPosition),
      filter,
      resultPosition,
      visited,
      options?.maxVisitedSize ?? 256
    );

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      resultPosition: vec3.fromRaw(resultPosition),
      visited: array((i) => visited.get(i), visited.size),
    };
  }

  /**
   * Gets the height of the polygon at the provided position using the height detail
   * @param polyRef
   * @param position
   * @returns
   */
  getPolyHeight(polyRef: number, position: Vector3) {
    const floatRef = new Raw.FloatRef();
    const status = this.raw.getPolyHeight(
      polyRef,
      vec3.toArray(position),
      floatRef
    );

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      height: floatRef.value,
    };
  }

  /**
   * Finds a straight path from the start position to the end position.
   *
   * @returns an array of Vector3 positions that make up the path, or an empty array if no path was found.
   */
  computePath(
    start: Vector3,
    end: Vector3,
    options?: {
      filter?: R.dtQueryFilter;
      maxPolyPathLength?: number;
    }
  ): Vector3[] {
    const filter = options?.filter ?? this.defaultFilter;

    const startArray = vec3.toArray(start);
    const endArray = vec3.toArray(end);

    const { nearestRef: startRef } = this.findNearestPoly(start, { filter });
    const { nearestRef: endRef } = this.findNearestPoly(end, { filter });

    const maxPolyPathLength = options?.maxPolyPathLength ?? 256;

    const polys = new Arrays.UnsignedIntArray();

    this.raw.findPath(
      startRef,
      endRef,
      startArray,
      endArray,
      filter,
      polys,
      maxPolyPathLength
    );

    if (polys.size <= 0) {
      return [];
    }

    const lastPoly = polys.get(polys.size - 1);
    let closestEnd = { x: end.x, y: end.y, z: end.z };

    if (lastPoly !== endRef) {
      const { closestPoint } = this.closestPointOnPoly(lastPoly, end);
      closestEnd = closestPoint;
    }

    const maxStraightPathPolys = 256;

    const straightPath = new Arrays.FloatArray();
    straightPath.resize(maxStraightPathPolys * 3);

    const straightPathFlags = new Arrays.UnsignedCharArray();
    straightPathFlags.resize(maxStraightPathPolys);

    const straightPathRefs = new Arrays.UnsignedIntArray();
    straightPathRefs.resize(maxStraightPathPolys);

    const straightPathCount = new Raw.IntRef();
    const straightPathOptions = 0;

    this.raw.findStraightPath(
      startArray,
      vec3.toArray(closestEnd),
      polys,
      straightPath,
      straightPathFlags,
      straightPathRefs,
      straightPathCount,
      maxStraightPathPolys,
      straightPathOptions
    );

    const points: Vector3[] = [];

    for (let i = 0; i < straightPathCount.value; i++) {
      points.push({
        x: straightPath.get(i * 3),
        y: straightPath.get(i * 3 + 1),
        z: straightPath.get(i * 3 + 2),
      });
    }

    return points;
  }

  /**
   * Destroys the NavMeshQuery instance
   */
  destroy(): void {
    finalizer.unregister(this);
    this.raw.destroy();
  }
}
