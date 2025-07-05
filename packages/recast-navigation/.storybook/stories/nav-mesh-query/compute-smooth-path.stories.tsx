import { Line, OrbitControls } from '@react-three/drei';
import {
  Detour,
  NavMesh,
  NavMeshQuery,
  OffMeshConnectionParams,
  QueryFilter
} from '@recast-navigation/core';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import React, { useEffect, useState } from 'react';
import {
  Group,
  Mesh,
  Vector3,
  Vector3Like,
  Vector3Tuple,
} from 'three';
import { Debug } from '../../common/debug';
import { NavTestEnvironment } from '../../common/nav-test-environment';
import { decorators } from '../../decorators';
import { parameters } from '../../parameters';

export default {
  title: 'NavMeshQuery / Compute Smooth Path',
  decorators,
  parameters,
};

const offMeshConnections: OffMeshConnectionParams[] = [
  {
    radius: 0.3,
    area: 0,
    flags: 1,
    bidirectional: true,
    startPosition: {
      x: 0.2870096266269684,
      y: 3.9292590618133545,
      z: 2.564833402633667,
    },
    endPosition: {
      x: 1.4627689123153687,
      y: 2.778116226196289,
      z: 3.5469906330108643,
    },
  },
];

const start = new Vector3(-4.13, 0.266, 4.852);

const end = new Vector3(2.781, 2.75, 4.1);

export const ComputeSmoothPath = () => {
  const [group, setGroup] = useState<Group | null>(null);

  const [navMesh, setNavMesh] = useState<NavMesh>();
  const [path, setPath] = useState<Vector3Tuple[]>();

  useEffect(() => {
    if (!group) return;

    const meshes: Mesh[] = [];

    group.traverse((child) => {
      if (child instanceof Mesh) {
        meshes.push(child);
      }
    });

    const { success, navMesh } = threeToSoloNavMesh(meshes, {
      cs: 0.05,
      ch: 0.2,
      offMeshConnections,
    });

    if (!success) return;

    const navMeshQuery = new NavMeshQuery(navMesh);

    const { path } = computeSmoothPath(navMesh, navMeshQuery, start, end);

    setNavMesh(navMesh);
    setPath(path ? path.map((v) => [v.x, v.y, v.z]) : undefined);

    return () => {
      navMesh.destroy();
      navMeshQuery.destroy();

      setNavMesh(undefined);
      setPath(undefined);
    };
  }, [group]);

  return (
    <>
      <group ref={setGroup}>
        <NavTestEnvironment />
      </group>

      <group position-y={0.25}>
        <mesh position={start}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="blue" />
        </mesh>

        <mesh position={end}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="red" />
        </mesh>

        {path && (
          <>
            <Line points={path} color="blue" lineWidth={5} />

            {path.map((point, index) => (
              <mesh key={index} position={point}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshBasicMaterial color="blue" />
              </mesh>
            ))}
          </>
        )}
      </group>

      <Debug
        navMesh={navMesh}
      />

      <OrbitControls />
    </>
  );
};

const _delta = new Vector3();
const _moveTarget = new Vector3();

const ComputePathError = {
  START_NEAREST_POLY_FAILED: 'START_NEAREST_POLY_FAILED',
  END_NEAREST_POLY_FAILED: 'END_NEAREST_POLY_FAILED',
  FIND_PATH_FAILED: 'FIND_PATH_FAILED',
  NO_POLYGON_PATH_FOUND: 'NO_POLYGON_PATH_FOUND',
  NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND:
    'NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND',
};

type ComputeSmoothPathErrorType =
  (typeof ComputePathError)[keyof typeof ComputePathError];

type ComputeSmoothPathResult = {
  success: boolean;
  error?: {
    type: ComputeSmoothPathErrorType;
    status?: number;
  };
  path: Vector3[];
};

function computeSmoothPath(
  navMesh: NavMesh,
  navMeshQuery: NavMeshQuery,
  start: Vector3Like,
  end: Vector3Like,
  options?: {
    filter?: QueryFilter;
    halfExtents?: Vector3Like;

    /**
     * @default 256
     */
    maxPathPolys?: number;

    /**
     * @default 2048
     */
    maxSmoothPathPoints?: number;

    /**
     * @default 0.5
     */
    stepSize?: number;

    /**
     * @default 0.01
     */
    slop?: number;
  }
): ComputeSmoothPathResult {
  const filter = options?.filter ?? navMeshQuery.defaultFilter;
  const halfExtents =
    options?.halfExtents ?? navMeshQuery.defaultQueryHalfExtents;

  const maxSmoothPathPoints = options?.maxSmoothPathPoints ?? 2048;

  const maxPathPolys = options?.maxPathPolys ?? 256;

  const stepSize = options?.stepSize ?? 0.5;
  const slop = options?.slop ?? 0.01;

  // find nearest polygons for start and end positions
  const startNearestPolyResult = navMeshQuery.findNearestPoly(start, {
    filter,
    halfExtents,
  });

  if (!startNearestPolyResult.success) {
    return {
      success: false,
      error: {
        type: ComputePathError.START_NEAREST_POLY_FAILED,
        status: startNearestPolyResult.status,
      },
      path: [],
    };
  }

  const endNearestPolyResult = navMeshQuery.findNearestPoly(end, {
    filter,
    halfExtents,
  });

  if (!endNearestPolyResult.success) {
    return {
      success: false,
      error: {
        type: ComputePathError.END_NEAREST_POLY_FAILED,
        status: endNearestPolyResult.status,
      },
      path: [],
    };
  }

  const startRef = startNearestPolyResult.nearestRef;
  const endRef = endNearestPolyResult.nearestRef;

  // find polygon path
  const findPathResult = navMeshQuery.findPath(startRef, endRef, start, end, {
    filter,
    maxPathPolys,
  });

  if (!findPathResult.success) {
    return {
      success: false,
      error: {
        type: ComputePathError.FIND_PATH_FAILED,
        status: findPathResult.status,
      },
      path: [],
    };
  }

  if (findPathResult.polys.size <= 0) {
    return {
      success: false,
      error: {
        type: ComputePathError.NO_POLYGON_PATH_FOUND,
      },
      path: [],
    };
  }

  const lastPoly = findPathResult.polys.get(findPathResult.polys.size - 1);

  let closestEnd = end;

  if (lastPoly !== endRef) {
    const lastPolyClosestPointResult = navMeshQuery.closestPointOnPoly(
      lastPoly,
      end
    );

    if (!lastPolyClosestPointResult.success) {
      return {
        success: false,
        error: {
          type: ComputePathError.NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND,
          status: lastPolyClosestPointResult.status,
        },
        path: [],
      };
    }

    closestEnd = lastPolyClosestPointResult.closestPoint;
  }

  // Iterate over the path to find a smooth path on the detail mesh
  const iterPos = new Vector3().copy(start);
  const targetPos = new Vector3().copy(closestEnd);

  const polys = [...findPathResult.polys.getHeapView()];
  const smoothPath: Vector3[] = [];

  smoothPath.push(iterPos.clone());

  while (polys.length > 0 && smoothPath.length < maxSmoothPathPoints) {
    // Find location to steer towards
    const steerTarget = getSteerTarget(
      navMeshQuery,
      iterPos,
      targetPos,
      slop,
      polys
    );

    if (!steerTarget.success) {
      break;
    }

    const isEndOfPath =
      steerTarget.steerPosFlag & Detour.DT_STRAIGHTPATH_END;

    const isOffMeshConnection =
      steerTarget.steerPosFlag & Detour.DT_STRAIGHTPATH_OFFMESH_CONNECTION;

    // Find movement delta.
    const steerPos = steerTarget.steerPos;

    const delta = _delta.copy(steerPos).sub(iterPos);

    let len = Math.sqrt(delta.dot(delta));

    // If the steer target is the end of the path or an off-mesh connection, do not move past the location.
    if ((isEndOfPath || isOffMeshConnection) && len < stepSize) {
      len = 1;
    } else {
      len = stepSize / len;
    }

    const moveTarget = _moveTarget.copy(iterPos).addScaledVector(delta, len);

    // Move
    const moveAlongSurface = navMeshQuery.moveAlongSurface(
      polys[0],
      iterPos,
      moveTarget,
      { filter, maxVisitedSize: 16 }
    );

    if (!moveAlongSurface.success) {
      break;
    }

    const result = moveAlongSurface.resultPosition;

    fixupCorridor(polys, maxPathPolys, moveAlongSurface.visited);
    fixupShortcuts(polys, navMesh);

    const polyHeightResult = navMeshQuery.getPolyHeight(polys[0], result);

    if (polyHeightResult.success) {
      result.y = polyHeightResult.height;
    }

    iterPos.copy(result);

    // Handle end of path and off-mesh links when close enough
    if (isEndOfPath && inRange(iterPos, steerTarget.steerPos, slop, 1.0)) {
      // Reached end of path
      iterPos.copy(targetPos);

      if (smoothPath.length < maxSmoothPathPoints) {
        smoothPath.push(new Vector3(iterPos.x, iterPos.y, iterPos.z));
      }

      break;
    } else if (
      isOffMeshConnection &&
      inRange(iterPos, steerTarget.steerPos, slop, 1.0)
    ) {
      // Reached off-mesh connection.

      // Advance the path up to and over the off-mesh connection.
      const offMeshConRef = steerTarget.steerPosRef;

      // Advance the path up to and over the off-mesh connection.
      let prevPolyRef = 0;
      let polyRef = polys[0];

      let npos = 0;

      while (npos < polys.length && polyRef !== offMeshConRef) {
        prevPolyRef = polyRef;
        polyRef = polys[npos];
        npos++;
      }

      for (let i = npos; i < polys.length; i++) {
        polys[i - npos] = polys[i];
      }
      polys.splice(npos, polys.length - npos);

      // Handle the connection
      const offMeshConnectionPolyEndPoints =
        navMesh.getOffMeshConnectionPolyEndPoints(prevPolyRef, polyRef);

      if (offMeshConnectionPolyEndPoints.success) {
        if (smoothPath.length < maxSmoothPathPoints) {
          smoothPath.push(new Vector3(iterPos.x, iterPos.y, iterPos.z));

          // Hack to make the dotted path not visible during off-mesh connection.
          if (smoothPath.length & 1) {
            smoothPath.push(new Vector3(iterPos.x, iterPos.y, iterPos.z));
          }

          // Move position at the other side of the off-mesh link.
          iterPos.copy(offMeshConnectionPolyEndPoints.end);

          const endPositionPolyHeight = navMeshQuery.getPolyHeight(
            polys[0],
            iterPos
          );

          if (endPositionPolyHeight.success) {
            iterPos.y = endPositionPolyHeight.height;
          }
        }
      }
    }

    // Store results.
    if (smoothPath.length < maxSmoothPathPoints) {
      smoothPath.push(new Vector3(iterPos.x, iterPos.y, iterPos.z));
    }
  }

  return {
    success: true,
    path: smoothPath,
  };
}

type GetSteerTargetResult =
  | {
      success: false;
    }
  | {
      success: true;
      steerPos: Vector3;
      steerPosFlag: number;
      steerPosRef: number;
      points: Vector3[];
    };

function getSteerTarget(
  navMeshQuery: NavMeshQuery,
  start: Vector3,
  end: Vector3,
  minTargetDist: number,
  pathPolys: number[]
): GetSteerTargetResult {
  const maxSteerPoints = 3;

  const straightPath = navMeshQuery.findStraightPath(start, end, pathPolys, {
    maxStraightPathPoints: maxSteerPoints,
  });

  if (!straightPath.success) {
    return {
      success: false,
    };
  }

  const outPoints: Vector3[] = [];
  for (let i = 0; i < straightPath.straightPathCount; i++) {
    const point = new Vector3(
      straightPath.straightPath.get(i * 3),
      straightPath.straightPath.get(i * 3 + 1),
      straightPath.straightPath.get(i * 3 + 2)
    );

    outPoints.push(point);
  }

  // Find vertex far enough to steer to
  let ns = 0;
  while (ns < outPoints.length) {
    // Stop at Off-Mesh link or when point is further than slop away
    if (
      straightPath.straightPathFlags.get(ns) &
      Detour.DT_STRAIGHTPATH_OFFMESH_CONNECTION
    ) {
      break;
    }

    const posA = outPoints[ns];
    const posB = start;

    if (!inRange(posA, posB, minTargetDist, 1000.0)) {
      break;
    }

    ns++;
  }

  // Failed to find good point to steer to
  if (ns >= straightPath.straightPathCount) {
    return {
      success: false,
    };
  }

  const steerPos = outPoints[ns];
  const steerPosFlag = straightPath.straightPathFlags.get(ns);
  const steerPosRef = straightPath.straightPathRefs.get(ns);

  return {
    success: true,
    steerPos,
    steerPosFlag,
    steerPosRef,
    points: outPoints,
  };
}

function inRange(a: Vector3, b: Vector3, r: number, h: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return dx * dx + dz * dz < r && Math.abs(dy) < h;
}

function fixupCorridor(
  pathPolys: number[],
  maxPath: number,
  visitedPolyRefs: number[]
) {
  let furthestPath = -1;
  let furthestVisited = -1;

  // Find furthest common polygon.
  for (let i = pathPolys.length - 1; i >= 0; i--) {
    let found = false;
    for (let j = visitedPolyRefs.length - 1; j >= 0; j--) {
      if (pathPolys[i] === visitedPolyRefs[j]) {
        furthestPath = i;
        furthestVisited = j;
        found = true;
      }
    }
    if (found) {
      break;
    }
  }

  // If no intersection found just return current path.
  if (furthestPath === -1 || furthestVisited === -1) {
    return pathPolys;
  }

  // Concatenate paths.

  // Adjust beginning of the buffer to include the visited.
  const req = visitedPolyRefs.length - furthestVisited;
  const orig = Math.min(furthestPath + 1, pathPolys.length);

  let size = Math.max(0, pathPolys.length - orig);

  if (req + size > maxPath) {
    size = maxPath - req;
  }
  if (size) {
    pathPolys.splice(req, size, ...pathPolys.slice(orig, orig + size));
  }

  // Store visited
  for (let i = 0; i < req; i++) {
    pathPolys[i] = visitedPolyRefs[visitedPolyRefs.length - (1 + i)];
  }
}

/**
 *
 * This function checks if the path has a small U-turn, that is,
 * a polygon further in the path is adjacent to the first polygon
 * in the path. If that happens, a shortcut is taken.
 * This can happen if the target (T) location is at tile boundary,
 * and we're (S) approaching it parallel to the tile edge.
 * The choice at the vertex can be arbitrary,
 *  +---+---+
 *  |:::|:::|
 *  +-S-+-T-+
 *  |:::|   | <-- the step can end up in here, resulting U-turn path.
 *  +---+---+
 */
function fixupShortcuts(pathPolys: number[], navMesh: NavMesh) {
  if (pathPolys.length < 3) {
    return;
  }

  // Get connected polygons
  const maxNeis = 16;
  let nneis = 0;
  const neis: number[] = [];

  const tileAndPoly = navMesh.getTileAndPolyByRef(pathPolys[0]);

  if (!tileAndPoly.success) {
    return;
  }

  const poly = tileAndPoly.poly;
  const tile = tileAndPoly.tile;
  for (
    let k = poly.firstLink();
    k !== Detour.DT_NULL_LINK;
    k = tile.links(k).next()
  ) {
    const link = tile.links(k);

    if (link.ref() !== 0) {
      if (nneis < maxNeis) {
        neis.push(link.ref());
        nneis++;
      }
    }
  }

  // If any of the neighbour polygons is within the next few polygons
  // in the path, short cut to that polygon directly.
  const maxLookAhead = 6;
  let cut = 0;
  for (
    let i = Math.min(maxLookAhead, pathPolys.length) - 1;
    i > 1 && cut === 0;
    i--
  ) {
    for (let j = 0; j < nneis; j++) {
      if (pathPolys[i] === neis[j]) {
        cut = i;
        break;
      }
    }
  }

  if (cut > 1) {
    pathPolys.splice(1, cut - 1);
  }
}
