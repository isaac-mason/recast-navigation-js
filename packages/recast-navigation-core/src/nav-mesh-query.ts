import { NavMesh } from './nav-mesh';
import { Arrays, Raw } from './raw';
import type R from './raw-module';
import { array, vec3, Vector3 } from './utils';

export class QueryFilter {
  raw: R.dtQueryFilter;

  get includeFlags(): number {
    return this.raw.getIncludeFlags();
  }

  set includeFlags(flags: number) {
    this.raw.setIncludeFlags(flags);
  }

  get excludeFlags(): number {
    return this.raw.getExcludeFlags();
  }

  set excludeFlags(flags: number) {
    this.raw.setExcludeFlags(flags);
  }

  constructor(raw?: R.dtQueryFilter) {
    this.raw = raw ?? new Raw.Module.dtQueryFilter();
  }

  getAreaCost(i: number): number {
    return this.raw.getAreaCost(i);
  }

  setAreaCost(i: number, cost: number): void {
    return this.raw.setAreaCost(i, cost);
  }
}

export type NavMeshQueryParams = {
  navMesh: NavMesh;

  /**
   * @default 2048
   */
  maxNodes?: number;
};

export class NavMeshQuery {
  raw: R.NavMeshQuery;

  defaultFilter: QueryFilter;

  defaultQueryHalfExtents = { x: 1, y: 1, z: 1 };

  constructor(value: R.NavMeshQuery | NavMeshQueryParams) {
    if (value instanceof Raw.Module.NavMeshQuery) {
      this.raw = value;
    } else {
      this.raw = new Raw.Module.NavMeshQuery();
      this.raw.init(value.navMesh.raw, value.maxNodes ?? 2048);
    }

    this.defaultFilter = new QueryFilter();
    this.defaultFilter.includeFlags = 0xffff;
    this.defaultFilter.excludeFlags = 0;
  }

  /**
   * Finds the polygon nearest to the given position.
   */
  findNearestPoly(
    position: Vector3,
    options?: { filter?: QueryFilter; halfExtents?: Vector3 }
  ) {
    const nearestRef = new Raw.UnsignedIntRef();
    const nearestPoint = new Raw.Vec3();
    const isOverPoly = new Raw.BoolRef();

    const status = this.raw.findNearestPoly(
      vec3.toArray(position),
      vec3.toArray(options?.halfExtents ?? this.defaultQueryHalfExtents),
      options?.filter?.raw ?? this.defaultFilter.raw,
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

  /**
   * Finds the polygons along the navigation graph that touch the specified circle.
   * @param startRef Reference of polygon to start search from
   * @param centerPos Center of circle
   * @param radius Radius of circle
   * @param filter The polygon filter to apply to the query
   * @param maxResult The maximum number of polygons the result arrays can hold
   */
	findPolysAroundCircle(
    startRef: number,
    centerPos: Vector3,
    radius: number,
    filter = this.defaultFilter,
    maxResult = 256,
  ) {
    const resultRef = new Arrays.UnsignedIntArray();
    const resultParent = new Arrays.UnsignedIntArray();;
    resultRef.resize(maxResult);
    resultParent.resize(maxResult);
    const resultCostRef = new Raw.FloatRef();
    const resultCountRef = new Raw.IntRef();

    const status = this.raw.findPolysAroundCircle(
      startRef,
      vec3.toArray(centerPos),
      radius,
      filter.raw,
      resultRef,
      resultParent,
      resultCostRef,
      resultCountRef,
      maxResult,
    );

    const resultCost = resultCostRef.value;
    const resultCount = resultCountRef.value;

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      resultRefs: array((i) => resultRef.get(i), resultCount),
      resultParents: array((i) => resultParent.get(i), resultCount),
      resultCost,
      resultCount,
    };
  }

  /**
   * Finds polygons that overlap the search box.
   * @param center The center of the search box
   * @param halfExtents The search distance along each axis
   * @param filter The polygon filter to apply to the query
   * @param maxPolys The maximum number of polygons the search result can hold
   */
  queryPolygons(
    center: Vector3,
    halfExtents: Vector3,
    filter = this.defaultFilter,
    maxPolys = 256,
  ){
    const polysRef = new Arrays.UnsignedIntArray();
    polysRef.resize(maxPolys);
    const polyCountRef = new Raw.IntRef();
      
    const status = this.raw.queryPolygons(
      vec3.toArray(center),
      vec3.toArray(halfExtents),
      filter.raw,
      polysRef,
      polyCountRef,
      maxPolys,
    );

    const polyCount = polyCountRef.value;

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      polyRefs: array((i) => polysRef.get(i), polyCount),
      polyCount,
    };
  }

  /**
   * Returns the closest point on the given polygon to the given position.
   */
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
    options?: { filter?: QueryFilter; halfExtents?: Vector3 }
  ): Vector3 {
    const closestPointRaw = this.raw.getClosestPoint(
      vec3.toArray(position),
      vec3.toArray(options?.halfExtents ?? this.defaultQueryHalfExtents),
      options?.filter?.raw ?? this.defaultFilter.raw
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
      filter?: QueryFilter;
      halfExtents?: Vector3;
    }
  ): Vector3 {
    const randomPointRaw = this.raw.getRandomPointAround(
      vec3.toArray(position),
      radius,
      vec3.toArray(options?.halfExtents ?? this.defaultQueryHalfExtents),
      options?.filter?.raw ?? this.defaultFilter.raw
    );

    return vec3.fromRaw(randomPointRaw);
  }

  /**
   * Moves from the start to the end position constrained to the navigation mesh.
   */
  moveAlongSurface(
    startRef: number,
    startPosition: Vector3,
    endPosition: Vector3,
    options?: {
      filter?: QueryFilter;
      maxVisitedSize?: number;
    }
  ) {
    const resultPosition = new Raw.Vec3();
    const visited = new Arrays.UnsignedIntArray();

    const filter = options?.filter?.raw ?? this.defaultFilter.raw;

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
      filter?: QueryFilter;
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
      filter.raw,
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
    this.raw.destroy();
  }
}
