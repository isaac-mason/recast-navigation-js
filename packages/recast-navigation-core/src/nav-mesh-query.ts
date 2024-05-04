import { FloatArray, UnsignedCharArray, UnsignedIntArray } from './arrays';
import { NavMesh } from './nav-mesh';
import { Raw } from './raw';
import type R from './raw-module';
import { Vector3, array, vec3 } from './utils';

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

  /**
   * Constructs a new query filter object.
   */
  constructor();

  /**
   * Constructs a query filter wrapper for a raw dtQueryFilter object.
   * @param raw
   */
  constructor(raw: R.dtQueryFilter);

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
  /**
   * @default 2048
   */
  maxNodes?: number;

  /**
   * Default query filter.
   *
   * If omitted, the default filter will include all flags and exclude none.
   *
   * ```ts
   * this.defaultFilter = new QueryFilter();
   * this.defaultFilter.includeFlags = 0xffff;
   * this.defaultFilter.excludeFlags = 0;
   * ```
   */
  defaultQueryFilter?: QueryFilter;
};

export class NavMeshQuery {
  raw: R.NavMeshQuery;

  /**
   * Default query filter.
   */
  defaultFilter: QueryFilter;

  /**
   * Default search distance along each axis.
   */
  defaultQueryHalfExtents = { x: 1, y: 1, z: 1 };

  /**
   * Constructs a new navigation mesh query object.
   * @param navMesh the navigation mesh to use for the query
   * @param params optional additional parameters
   *
   * @example
   * ```ts
   * const query = new NavMeshQuery(navMesh);
   * ```
   *
   * @example
   * ```ts
   * const query = new NavMeshQuery(navMesh, { maxNodes: 2048 });
   * ```
   */
  constructor(navMesh: NavMesh, params?: NavMeshQueryParams);

  /**
   * Constructs a navigation mesh query object from a raw object.
   * @param raw
   */
  constructor(raw: R.NavMeshQuery);

  constructor(value: R.NavMeshQuery | NavMesh, params?: NavMeshQueryParams) {
    if (value instanceof Raw.Module.NavMeshQuery) {
      this.raw = value;
    } else {
      this.raw = new Raw.Module.NavMeshQuery();
      this.raw.init(value.raw, params?.maxNodes ?? 2048);
    }

    if (params?.defaultQueryFilter) {
      this.defaultFilter = params.defaultQueryFilter;
    } else {
      this.defaultFilter = new QueryFilter();
      this.defaultFilter.includeFlags = 0xffff;
      this.defaultFilter.excludeFlags = 0;
    }
  }

  /**
   * Finds the polygon nearest to the given position.
   */
  findNearestPoly(
    position: Vector3,
    options?: {
      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * The search distance along each axis. [(x, y, z)]
       * @default this.defaultQueryHalfExtents
       */
      halfExtents?: Vector3;
    }
  ) {
    const nearestRefRaw = new Raw.UnsignedIntRef();
    const nearestPointRaw = new Raw.Vec3();
    const isOverPolyRaw = new Raw.BoolRef();

    const status = this.raw.findNearestPoly(
      vec3.toArray(position),
      vec3.toArray(options?.halfExtents ?? this.defaultQueryHalfExtents),
      options?.filter?.raw ?? this.defaultFilter.raw,
      nearestRefRaw,
      nearestPointRaw,
      isOverPolyRaw
    );

    const nearestPoint = vec3.fromRaw(nearestPointRaw);
    Raw.destroy(nearestPointRaw);

    const nearestRef = nearestRefRaw.value;
    Raw.destroy(nearestRefRaw);

    const isOverPoly = isOverPolyRaw.value;
    Raw.destroy(isOverPolyRaw);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      nearestRef,
      nearestPoint,
      isOverPoly,
    };
  }

  /**
   * Finds the polygons along the navigation graph that touch the specified circle.
   * @param startRef Reference of polygon to start search from
   * @param centerPos Center of circle
   * @param radius Radius of circle
   * @param options
   */
  findPolysAroundCircle(
    startRef: number,
    centerPos: Vector3,
    radius: number,
    options?: {
      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * The maximum number of polygons the result arrays can hold.
       * @default 256
       */
      maxPolys?: number;
    }
  ) {
    const filter = options?.filter ?? this.defaultFilter;
    const maxPolys = options?.maxPolys ?? 256;

    const resultRefArray = new UnsignedIntArray();
    const resultParentArray = new UnsignedIntArray();
    const resultCostArray = new FloatArray();
    resultRefArray.resize(maxPolys);
    resultParentArray.resize(maxPolys);
    resultCostArray.resize(maxPolys);

    const resultCountRef = new Raw.IntRef();

    const status = this.raw.findPolysAroundCircle(
      startRef,
      vec3.toArray(centerPos),
      radius,
      filter.raw,
      resultRefArray.raw,
      resultParentArray.raw,
      resultCostArray.raw,
      resultCountRef,
      maxPolys
    );

    const resultRefs = [...resultRefArray.getHeapView()];
    resultRefArray.destroy();

    const resultParents = [...resultParentArray.getHeapView()];
    resultParentArray.destroy();

    const resultCost = [...resultCostArray.getHeapView()];
    resultCostArray.destroy();

    const resultCount = resultCountRef.value;
    Raw.destroy(resultCountRef);

    // todo: freeing resultCostRef and resultCountRef intermittently throws
    // memory related errors.
    // const resultCost = resultCostRef.value;
    // const resultCount = resultCountRef.value;

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      resultRefs,
      resultParents,
      resultCost,
      resultCount,
    };
  }

  /**
   * Finds polygons that overlap the search box.
   * @param center The center of the search box
   * @param halfExtents The search distance along each axis
   * @param options
   */
  queryPolygons(
    center: Vector3,
    halfExtents: Vector3,
    options?: {
      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * The maximum number of polygons the search result can hold.
       * @default 256
       */
      maxPolys?: number;
    }
  ) {
    const filter = options?.filter ?? this.defaultFilter;
    const maxPolys = options?.maxPolys ?? 256;

    const polysRefsArray = new UnsignedIntArray();
    polysRefsArray.resize(maxPolys);

    const polyCountRef = new Raw.IntRef();

    const status = this.raw.queryPolygons(
      vec3.toArray(center),
      vec3.toArray(halfExtents),
      filter.raw,
      polysRefsArray.raw,
      polyCountRef,
      maxPolys
    );

    const polyCount = polyCountRef.value;
    Raw.destroy(polyCountRef);

    const polyRefs = [...polysRefsArray.getHeapView()];
    polysRefsArray.destroy();

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      polyRefs,
      polyCount,
    };
  }

  /**
   * Returns the closest point on the given polygon to the given position.
   *
   * @param polyRef The reference of the polygon
   * @param position The position to find the closest point to
   */
  closestPointOnPoly(polyRef: number, position: Vector3) {
    const closestPointRaw = new Raw.Vec3();
    const positionOverPolyRaw = new Raw.BoolRef();

    const status = this.raw.closestPointOnPoly(
      polyRef,
      vec3.toArray(position),
      closestPointRaw,
      positionOverPolyRaw
    );

    const closestPoint = vec3.fromRaw(closestPointRaw);
    Raw.destroy(closestPointRaw);

    const isPointOverPoly = positionOverPolyRaw.value;
    Raw.destroy(positionOverPolyRaw);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      closestPoint,
      isPointOverPoly,
    };
  }

  /**
   * Finds the closest point on the NavMesh to the given position.
   * @param position the position to find the closest point to
   * @param options additional options
   * @returns the result of the find closest point operation
   */
  findClosestPoint(
    position: Vector3,
    options?: {
      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * The search distance along each axis. [(x, y, z)]
       * @default this.defaultQueryHalfExtents
       */
      halfExtents?: Vector3;
    }
  ) {
    const filter = options?.filter ?? this.defaultFilter;
    const halfExtents = options?.halfExtents ?? this.defaultQueryHalfExtents;

    const resultPolyRef = new Raw.UnsignedIntRef();
    const resultPoint = new Raw.Vec3();
    const resultPointOverPoly = new Raw.BoolRef();

    const status = this.raw.findClosestPoint(
      vec3.toArray(position),
      vec3.toArray(halfExtents),
      filter.raw,
      resultPolyRef,
      resultPoint,
      resultPointOverPoly
    );

    const polyRef = resultPolyRef.value;
    Raw.destroy(resultPolyRef);

    const point = vec3.fromRaw(resultPoint);
    Raw.destroy(resultPoint);

    const isPointOverPoly = resultPointOverPoly.value;
    Raw.destroy(resultPointOverPoly);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      polyRef,
      point,
      isPointOverPoly,
    };
  }

  /**
   * Returns a random point on the NavMesh within the given radius of the given position.
   *
   * @param position the center of the search circle
   * @param radius the radius of the search circle
   * @param options additional options
   */
  findRandomPointAroundCircle(
    position: Vector3,
    radius: number,
    options?: {
      /**
       * The reference id of the polygon to start the search from.
       * If not provided, the nearest polygon to the position will be used.
       */
      startRef?: number;

      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * The search distance along each axis. [(x, y, z)]
       * @default this.defaultQueryHalfExtents
       */
      halfExtents?: Vector3;
    }
  ): {
    success: boolean;
    status: number;
    randomPolyRef: number;
    randomPoint: Vector3;
  } {
    const filter = options?.filter ?? this.defaultFilter;
    const halfExtents = options?.halfExtents ?? this.defaultQueryHalfExtents;

    let startRef: number;

    if (options?.startRef) {
      startRef = options.startRef;
    } else {
      const nearestPoly = this.findNearestPoly(position, {
        filter,
        halfExtents,
      });

      if (!nearestPoly.success) {
        return {
          success: false,
          status: nearestPoly.status,
          randomPolyRef: 0,
          randomPoint: { x: 0, y: 0, z: 0 },
        };
      }

      startRef = nearestPoly.nearestRef;
    }

    const randomPolyRefRaw = new Raw.UnsignedIntRef();
    const randomPointRaw = new Raw.Vec3();

    const status = this.raw.findRandomPointAroundCircle(
      startRef,
      vec3.toArray(position),
      radius,
      filter.raw,
      randomPolyRefRaw,
      randomPointRaw
    );

    const randomPolyRef = randomPolyRefRaw.value;
    Raw.destroy(randomPolyRefRaw);

    const randomPoint = vec3.fromRaw(randomPointRaw);
    Raw.destroy(randomPointRaw);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      randomPolyRef,
      randomPoint,
    };
  }

  /**
   * Moves from the start to the end position constrained to the navigation mesh.
   *
   * @param startRef the reference id of the start polygon.
   * @param startPosition a position of the mover within the start polygon.
   * @param endPosition the desired end position of the mover.
   *
   * @returns The result of the move along surface operation.
   */
  moveAlongSurface(
    startRef: number,
    startPosition: Vector3,
    endPosition: Vector3,
    options?: {
      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * The maximum number of polygons the output visited array can hold.
       * @default 256
       */
      maxVisitedSize?: number;
    }
  ) {
    const maxVisitedSize = options?.maxVisitedSize ?? 256;

    const resultPositionRaw = new Raw.Vec3();
    const visitedArray = new UnsignedIntArray();

    const filter = options?.filter?.raw ?? this.defaultFilter.raw;

    const status = this.raw.moveAlongSurface(
      startRef,
      vec3.toArray(startPosition),
      vec3.toArray(endPosition),
      filter,
      resultPositionRaw,
      visitedArray.raw,
      maxVisitedSize
    );

    const resultPosition = vec3.fromRaw(resultPositionRaw);
    Raw.destroy(resultPositionRaw);

    const visited = [...visitedArray.getHeapView()];
    visitedArray.destroy();

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      resultPosition,
      visited,
    };
  }

  /**
   * Returns a random point on the navmesh.
   * @param options additional options
   * @returns a random point on the navmesh
   */
  findRandomPoint(options?: {
    /**
     * The polygon filter to apply to the query.
     * @default this.defaultFilter
     */
    filter?: QueryFilter;
  }) {
    const randomPolyRefRaw = new Raw.UnsignedIntRef();
    const randomPointRaw = new Raw.Vec3();

    const status = this.raw.findRandomPoint(
      options?.filter?.raw ?? this.defaultFilter.raw,
      randomPolyRefRaw,
      randomPointRaw
    );

    const randomPolyRef = randomPolyRefRaw.value;
    Raw.destroy(randomPolyRefRaw);

    const randomPoint = vec3.fromRaw(randomPointRaw);
    Raw.destroy(randomPointRaw);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      randomPolyRef,
      randomPoint,
    };
  }

  /**
   * Gets the height of the polygon at the provided position using the height detail.
   *
   * @param polyRef the reference id of the polygon.
   * @param position a position within the xz-bounds of the polygon.
   */
  getPolyHeight(polyRef: number, position: Vector3) {
    const floatRef = new Raw.FloatRef();

    const status = this.raw.getPolyHeight(
      polyRef,
      vec3.toArray(position),
      floatRef
    );

    const height = floatRef.value;
    Raw.destroy(floatRef);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      height,
    };
  }

  /**
   * Finds a straight path from the start position to the end position.
   *
   * @param start the start position
   * @param end the end position
   * @param options additional options
   *
   * @returns an array of Vector3 positions that make up the path, or an empty array if no path was found.
   */
  computePath(
    start: Vector3,
    end: Vector3,
    options?: {
      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * The maximum number of polygons the path array can hold. [Limit: >= 1]
       * @default 256
       */
      maxPathPolys?: number;

      /**
       * The maximum number of points the straight path arrays can hold. [Limit: > 0]
       * @default 256
       */
      maxStraightPathPoints?: number;
    }
  ): {
    /**
     * Whether a path was successfully computed.
     */
    success: boolean;

    /**
     * Error information if the path computation failed.
     */
    error?: {
      /**
       * Description of the error.
       */
      name: string;

      /**
       * A dtStatus status code if relevant.
       */
      status?: number;
    };

    /**
     * The result path.
     */
    path: Vector3[];
  } {
    const filter = options?.filter ?? this.defaultFilter;

    // find nearest polygons for start and end positions
    const startNearestPolyResult = this.findNearestPoly(start, { filter });

    if (!startNearestPolyResult.success) {
      return {
        success: false,
        error: {
          name: 'findNearestPoly for start position failed',
          status: startNearestPolyResult.status,
        },
        path: [],
      };
    }

    const endNearestPolyResult = this.findNearestPoly(end, { filter });

    if (!endNearestPolyResult.success) {
      return {
        success: false,
        error: {
          name: 'findNearestPoly for end position failed',
          status: endNearestPolyResult.status,
        },
        path: [],
      };
    }

    const startRef = startNearestPolyResult.nearestRef;
    const endRef = endNearestPolyResult.nearestRef;

    // find polygon path
    const maxPathPolys = options?.maxPathPolys ?? 256;

    const findPathResult = this.findPath(startRef, endRef, start, end, {
      filter,
      maxPathPolys,
    });

    if (!findPathResult.success) {
      return {
        success: false,
        error: {
          name: 'findPath unsuccessful',
          status: findPathResult.status,
        },
        path: [],
      };
    }

    if (findPathResult.polys.size <= 0) {
      return {
        success: false,
        error: {
          name: 'no polygon path found',
        },
        path: [],
      };
    }

    const lastPoly = findPathResult.polys.get(findPathResult.polys.size - 1);

    let closestEnd = { x: end.x, y: end.y, z: end.z };

    if (lastPoly !== endRef) {
      const lastPolyClosestPointResult = this.closestPointOnPoly(lastPoly, end);

      if (!lastPolyClosestPointResult.success) {
        return {
          success: false,
          error: {
            name: 'no closest point on last polygon found',
            status: lastPolyClosestPointResult.status,
          },
          path: [],
        };
      }

      closestEnd = lastPolyClosestPointResult.closestPoint;
    }

    // find straight path
    const maxStraightPathPoints = options?.maxStraightPathPoints;

    const findStraightPathResult = this.findStraightPath(
      start,
      closestEnd,
      findPathResult.polys,
      { maxStraightPathPoints }
    );

    if (!findStraightPathResult.success) {
      return {
        success: false,
        error: {
          name: 'findStraightPath unsuccessful',
          status: findStraightPathResult.status,
        },
        path: [],
      };
    }

    const { straightPath, straightPathCount } = findStraightPathResult;

    // format output
    const points: Vector3[] = [];

    for (let i = 0; i < straightPathCount; i++) {
      points.push({
        x: straightPath.get(i * 3),
        y: straightPath.get(i * 3 + 1),
        z: straightPath.get(i * 3 + 2),
      });
    }

    findPathResult.polys.destroy();
    findStraightPathResult.straightPath.destroy();
    findStraightPathResult.straightPathFlags.destroy();
    findStraightPathResult.straightPathRefs.destroy();

    return {
      success: true,
      path: points,
    };
  }

  /**
   * Finds a path from the start polygon to the end polygon.
   * @param startRef the reference id of the start polygon.
   * @param endRef the reference id of the end polygon.
   * @param startPosition position within the start polygon.
   * @param endPosition position within the end polygon.
   * @param options additional options
   * @returns
   * 
   * The `polys` array returned must be freed after use.
   *
   * ```ts
   * findPathResult.polys.destroy();
   * ```
   */
  findPath(
    startRef: number,
    endRef: number,
    startPosition: Vector3,
    endPosition: Vector3,
    options?: {
      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * The maximum number of polygons the path array can hold. [Limit: >= 1]
       * @default 256
       */
      maxPathPolys?: number;
    }
  ) {
    const filter = options?.filter ?? this.defaultFilter;
    const maxPathPolys = options?.maxPathPolys ?? 256;

    const polysArray = new UnsignedIntArray();
    polysArray.resize(maxPathPolys);

    const status = this.raw.findPath(
      startRef,
      endRef,
      vec3.toArray(startPosition),
      vec3.toArray(endPosition),
      filter.raw,
      polysArray.raw,
      maxPathPolys
    );

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      polys: polysArray,
    };
  }

  /**
   * Finds the straight path from the start to the end position within the polygon corridor.
   *
   * This method peforms what is often called 'string pulling'.
   *
   * The start position is clamped to the first polygon in the path, and the
   * end position is clamped to the last. So the start and end positions should
   * normally be within or very near the first and last polygons respectively.
   *
   * The returned polygon references represent the reference id of the polygon
   * that is entered at the associated path position. The reference id associated
   * with the end point will always be zero.  This allows, for example, matching
   * off-mesh link points to their representative polygons.
   *
   * If the provided result arrays are too small for the entire result set,
   * they will be filled as far as possible from the start toward the end
   * position.
   *
   * @param start path start position
   * @param end path end position
   * @param path an array of polygon references that represent the path corridor
   * @param options additional options
   * @returns the straight path result
   * 
   * The straightPath, straightPathFlags, and straightPathRefs arrays returned must be freed after use.
   *
   * ```ts
   * findStraightPathResult.straightPath.destroy();
   * findStraightPathResult.straightPathFlags.destroy();
   * findStraightPathResult.straightPathRefs.destroy();
   * ```
   */
  findStraightPath(
    start: Vector3,
    end: Vector3,
    path: UnsignedIntArray,
    options?: {
      /**
       * The maximum number of points the straight path arrays can hold. [Limit: > 0]
       * @default 256
       */
      maxStraightPathPoints?: number;

      /**
       * Options for dtNavMeshQuery::findStraightPath
       *
       * Add a vertex at every polygon edge crossing where area changes.
       * DT_STRAIGHTPATH_AREA_CROSSINGS = 1
       *
       * Add a vertex at every polygon edge crossing.
       * DT_STRAIGHTPATH_ALL_CROSSINGS = 2
       *
       * @default 0
       */
      straightPathOptions?: number;
    }
  ): {
    success: boolean;
    status: number;

    /**
     * The straight path points.
     */
    straightPath: FloatArray;

    /**
     * The straight path flags.
     */
    straightPathFlags: UnsignedCharArray;

    /**
     * The reference ids of the visited polygons.
     *
     * Raw.Module.DT_STRAIGHTPATH_START
     * Raw.Module.DT_STRAIGHTPATH_END
     * Raw.Module.DT_STRAIGHTPATH_OFFMESH_CONNECTION
     */
    straightPathRefs: UnsignedIntArray;

    /**
     * The number of points in the straight path.
     */
    straightPathCount: number;
  } {
    const maxStraightPathPoints = options?.maxStraightPathPoints ?? 256;
    const straightPathOptions = options?.straightPathOptions ?? 0;

    const straightPath = new FloatArray();
    straightPath.resize(maxStraightPathPoints * 3);

    const straightPathFlags = new UnsignedCharArray();
    straightPathFlags.resize(maxStraightPathPoints);

    const straightPathRefs = new UnsignedIntArray();
    straightPathRefs.resize(maxStraightPathPoints);

    const straightPathCountRaw = new Raw.IntRef();

    const status = this.raw.findStraightPath(
      vec3.toArray(start),
      vec3.toArray(end),
      path.raw,
      straightPath.raw,
      straightPathFlags.raw,
      straightPathRefs.raw,
      straightPathCountRaw,
      maxStraightPathPoints,
      straightPathOptions
    );

    const straightPathCount = straightPathCountRaw.value;
    Raw.destroy(straightPathCountRaw);

    return {
      success: Raw.Detour.statusSucceed(status),
      status,
      straightPath,
      straightPathFlags,
      straightPathRefs,
      straightPathCount,
    };
  }

  /**
   * Casts a 'walkability' ray along the surface of the navigation mesh from the start position toward the end position.
   *
   * This method is meant to be used for quick, short distance checks.
   *
   * If the path array is too small to hold the result, it will be filled as far as possible from the start postion toward the end position.
   *
   * The raycast ignores the y-value of the end position. (2D check.) This places significant limits on how it can be used.
   *
   * <b>Using the Hit Parameter (t)</b>
   *
   * If the hit parameter is a very high value, then the ray has hit
   * the end position. In this case the path represents a valid corridor to the
   * end position and the value of hitNormal is undefined.
   *
   * If the hit parameter is zero, then the start position is on the wall that
   * was hit and the value of hitNormal is undefined.
   *
   * If 0 < t < 1.0 then the following applies:
   *
   * ```
   * distanceToHitBorder = distanceToEndPosition * t
   * hitPoint = startPos + (endPos - startPos) * t
   * ```
   *
   * <b>Use Case Restriction</b>
   *
   * Consider a scene where there is a main floor with a second floor balcony that hangs over the main floor.
   * So the first floor mesh extends below the balcony mesh.
   * The start position is somewhere on the first floor.
   * The end position is on the balcony.
   *
   * The raycast will search toward the end position along the first floor mesh.
   * If it reaches the end position's xz-coordinates it will indicate FLT_MAX,(no wall hit), meaning it reached the end position.
   * This is one example of why this method is meant for short distance checks.
   *
   * @param startRef the reference id of the start polygon.
   * @param startPosition a position within the start polygon representing the start of the ray
   * @param endPosition the position to cast the ray toward.
   * @param options additional options
   */
  raycast(
    startRef: number,
    startPosition: Vector3,
    endPosition: Vector3,
    options?: {
      /**
       * The polygon filter to apply to the query.
       * @default this.defaultFilter
       */
      filter?: QueryFilter;

      /**
       * Determines how the raycast behaves.
       *
       * // Raycast should calculate movement cost along the ray and fill RaycastHit::cost
       * DT_RAYCAST_USE_COSTS = 1
       *
       * @default 0
       */
      raycastOptions?: number;

      /**
       * Optional parent of start ref. Used during for cost calculation.
       */
      prevRef?: number;
    }
  ): {
    /**
     * Whether the raycast was successful.
     */
    success: boolean;

    /**
     * The status of the raycast.
     */
    status: number;

    /**
     * The hit parameter.
     */
    t: number;

    /**
     * The normal of the nearest wall hit.
     */
    hitNormal: Vector3;

    /**
     * The index of the edge on the final polygon where the wall was hit.
     */
    hitEdgeIndex: number;

    /**
     * The reference ids of the visited polygons.
     */
    path: number[];

    /**
     * The maximum number of polygons the path can contain.
     */
    maxPath: number;

    /**
     * The cost of the path until hit.
     */
    pathCost: number;
  } {
    const raycastHit = new Raw.Module.dtRaycastHit();

    const raycastOptions = options?.raycastOptions ?? 0;
    const prevRef = options?.prevRef ?? 0;
    const queryFilter = options?.filter?.raw ?? this.defaultFilter.raw;

    const status = this.raw.raycast(
      startRef,
      vec3.toArray(startPosition),
      vec3.toArray(endPosition),
      queryFilter,
      raycastOptions,
      raycastHit,
      prevRef
    );

    const result = {
      success: Raw.Detour.statusSucceed(status),
      status,
      t: raycastHit.t,
      hitNormal: vec3.fromArray(array((i) => raycastHit.get_hitNormal(i), 3)),
      hitEdgeIndex: raycastHit.hitEdgeIndex,
      path: array((i) => raycastHit.get_path(i), raycastHit.pathCount),
      maxPath: raycastHit.maxPath,
      pathCost: raycastHit.pathCost,
    };

    Raw.destroy(raycastHit);

    return result;
  }

  /**
   * Destroys the NavMeshQuery instance
   */
  destroy(): void {
    this.raw.destroy();
  }
}
