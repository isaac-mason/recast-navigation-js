import type R from '@recast-navigation/wasm';
import { Crowd } from './crowd';
import { DebugNavMesh } from './debug-nav-mesh';
import type {
  BoxObstacle,
  CylinderObstacle,
  Obstacle,
  ObstacleRef,
} from './obstacle';
import { Raw } from './raw';
import type { NavPath, Vector3 } from './utils';
import { navPath, vec3 } from './utils';

export type NavMeshConfig = {
  /**
   * The size of the non-navigable border around the heightfield.
   * [Limit: >=0] [Units: vx]
   * @default 0
   */
  borderSize: number;

  /**
   * The width/height size of tile's on the xz-plane.
   * [Limit: >= 0] [Units: vx]
   *
   * If tileSize is provided, a tiled navmesh will be created.
   * If tileSize is not provided, or is set to zero, a solo navmesh will be created.
   *
   * To use obstacles, a tiled navmesh must be generated.
   * @default 0
   */
  tileSize: number;

  /**
   * The xz-plane cell size to use for fields.
   * [Limit: > 0] [Units: wu]
   * @default 0.2
   */
  cs: number;

  /**
   * The y-axis cell size to use for fields.
   * Limit: > 0] [Units: wu]
   * @default 0.2
   */
  ch: number;

  /**
   * The maximum slope that is considered walkable.
   * [Limits: 0 <= value < 90] [Units: Degrees]
   * @default 60
   */
  walkableSlopeAngle: number;

  /**
   * Minimum floor to 'ceiling' height that will still allow the floor area to be considered walkable.
   * [Limit: >= 3] [Units: vx]
   * @default 2
   */
  walkableHeight: number;

  /**
   * Maximum ledge height that is considered to still be traversable.
   * [Limit: >=0] [Units: vx]
   * @default 2
   */
  walkableClimb: number;

  /**
   * The distance to erode/shrink the walkable area of the heightfield away from obstructions.
   * [Limit: >=0] [Units: vx]
   * @default 0.5
   */
  walkableRadius: number;

  /**
   * The maximum allowed length for contour edges along the border of the mesh.
   * [Limit: >=0] [Units: vx]
   * @default 12
   */
  maxEdgeLen: number;

  /**
   * The maximum distance a simplfied contour's border edges should deviate the original raw contour.
   * [Limit: >=0] [Units: vx]
   * @default 1.3
   */
  maxSimplificationError: number;

  /**
   * The minimum number of cells allowed to form isolated island areas.
   * [Limit: >=0] [Units: vx]
   * @default 8
   */
  minRegionArea: number;

  /**
   * Any regions with a span count smaller than this value will, if possible, be merged with larger regions.
   * [Limit: >=0] [Units: vx]
   * @default 20
   */
  mergeRegionArea: number;

  /**
   * The maximum number of vertices allowed for polygons generated during the be merged with larger regions.
   * [Limit: >=0] [Units: vx]
   * @default 6
   */
  maxVertsPerPoly: number;

  /**
   * Sets the sampling distance to use when generating the detail mesh. (For height detail only.)
   * [Limits: 0 or >= 0.9] [Units: wu]
   * @default 6
   */
  detailSampleDist: number;

  /**
   * The maximum distance the detail mesh surface should deviate from heightfield data. (For height detail only.)
   * [Limit: >=0] [Units: wu]
   * @default 1
   */
  detailSampleMaxError: number;
};

const navMeshConfigDefaults: NavMeshConfig = {
  borderSize: 0,
  tileSize: 0,
  cs: 0.2,
  ch: 0.2,
  walkableSlopeAngle: 60,
  walkableHeight: 2,
  walkableClimb: 2,
  walkableRadius: 0.5,
  maxEdgeLen: 12,
  maxSimplificationError: 1.3,
  minRegionArea: 8,
  mergeRegionArea: 20,
  maxVertsPerPoly: 6,
  detailSampleDist: 6,
  detailSampleMaxError: 1,
};

export class NavMesh {
  raw: R.NavMesh;

  obstacles: Map<ObstacleRef, Obstacle> = new Map();

  constructor() {
    this.raw = new Raw.Recast.NavMesh();
  }

  /**
   * Updates the NavMesh tile cache by rebuilding tiles touched by unfinished obstacle requests.
   * This should be called after adding or removing obstacles.
   */
  update(): void {
    this.raw.update();
  }

  /**
   * Destroys the NavMesh.
   */
  destroy(): void {
    this.raw?.destroy();
  }

  /**
   * Builds a NavMesh from the given positions and indices.
   * @param positions a flat array of positions
   * @param indices a flat array of indices
   * @param navMeshConfig optional configuration for the NavMesh
   */
  build(
    positions: ArrayLike<number>,
    indices: ArrayLike<number>,
    navMeshConfig: Partial<NavMeshConfig> = {}
  ): void {
    const config = { ...navMeshConfigDefaults, ...navMeshConfig };

    const rcConfig = new Raw.Recast.rcConfig();
    rcConfig.borderSize = config.borderSize;
    rcConfig.tileSize = config.tileSize;
    rcConfig.cs = config.cs;
    rcConfig.ch = config.ch;
    rcConfig.walkableSlopeAngle = config.walkableSlopeAngle;
    rcConfig.walkableHeight = config.walkableHeight;
    rcConfig.walkableClimb = config.walkableClimb;
    rcConfig.walkableRadius = config.walkableRadius;
    rcConfig.maxEdgeLen = config.maxEdgeLen;
    rcConfig.maxSimplificationError = config.maxSimplificationError;
    rcConfig.minRegionArea = config.minRegionArea;
    rcConfig.mergeRegionArea = config.mergeRegionArea;
    rcConfig.maxVertsPerPoly = config.maxVertsPerPoly;
    rcConfig.detailSampleDist = config.detailSampleDist;
    rcConfig.detailSampleMaxError = config.detailSampleMaxError;

    this.raw.build(
      positions as number[],
      positions.length / 3,
      indices as number[],
      indices.length,
      rcConfig
    );
  }

  /**
   * Build the navmesh from a previously saved state using getNavMeshData
   * @param data the Uint8Array returned by `getNavMeshData`
   */
  buildFromNavMeshData(data: Uint8Array): void {
    const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    const dataPtr = Raw.Recast._malloc(nDataBytes);

    const dataHeap = new Uint8Array(
      Raw.Recast.HEAPU8.buffer,
      dataPtr,
      nDataBytes
    );
    dataHeap.set(data);

    const buf = new Raw.Recast.NavMeshData();
    buf.dataPointer = dataHeap.byteOffset;
    buf.size = data.length;

    this.raw = new Raw.Recast.NavMesh();
    this.raw.buildFromNavMeshData(buf);

    Raw.Recast._free(dataHeap.byteOffset);
  }

  /**
   * Returns the NavMesh data that can be used later. The NavMesh must be built before retrieving the data
   * @returns data the Uint8Array that can be saved and reused
   */
  getNavMeshData(): Uint8Array {
    const navMeshData = this.raw.getNavMeshData();
    const arrView = new Uint8Array(
      Raw.Recast.HEAPU8.buffer,
      navMeshData.dataPointer,
      navMeshData.size
    );

    const data = new Uint8Array(navMeshData.size);
    data.set(arrView);
    this.raw.freeNavMeshData(navMeshData);

    return data;
  }

  /**
   * Returns a DebugNavMesh that can be used to visualize the NavMesh.
   */
  getDebugNavMesh(): DebugNavMesh {
    const rawDebugNavMesh = this.raw.getDebugNavMesh();
    return new DebugNavMesh(rawDebugNavMesh);
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
   *
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
   * Creates a cylinder obstacle and adds it to the navigation mesh.
   */
  addCylinderObstacle(
    position: Vector3,
    radius: number,
    height: number
  ): CylinderObstacle {
    const positionRaw = vec3.toRaw(position);

    const ref = this.raw.addCylinderObstacle(positionRaw, radius, height);

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
    const positionRaw = vec3.toRaw(position);
    const extentRaw = vec3.toRaw(extent);

    const ref = this.raw.addBoxObstacle(positionRaw, extentRaw, angle);

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

  createCrowd(config: { maxAgents: number; maxAgentRadius: number }): Crowd {
    return new Crowd({ navMesh: this, ...config });
  }
}
