import R from '@recast-navigation/wasm';
import { ObstacleRef } from './obstacle';
import { Raw } from './raw';
import { NavPath, navPath, vec3, Vector3 } from './utils';
import { DebugNavMesh } from './debug-nav-mesh';
import { Crowd } from './crowd';

export type NavMeshConfig = {
  /**
   * @default 0
   */
  borderSize: number;

  /**
   * @default 0
   */
  tileSize: number;

  /**
   * @default 0.2
   */
  cs: number;

  /**
   * @default 0.2
   */
  ch: number;

  /**
   * @default 60
   */
  walkableSlopeAngle: number;

  /**
   * @default 2
   */
  walkableHeight: number;

  /**
   * @default 2
   */
  walkableClimb: number;

  /**
   * @default 0.5
   */
  walkableRadius: number;

  /**
   * @default 12
   */
  maxEdgeLen: number;

  /**
   * @default 1.3
   */
  maxSimplificationError: number;

  /**
   * @default 8
   */
  minRegionArea: number;

  /**
   * @default 20
   */
  mergeRegionArea: number;

  /**
   * @default 6
   */
  maxVertsPerPoly: number;

  /**
   * @default 6
   */
  detailSampleDist: number;

  /**
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

export class NavMesh {
  raw: R.NavMesh;

  obstacles: Map<ObstacleRef, Obstacle> = new Map();

  constructor() {
    this.raw = new Raw.Recast.NavMesh();
  }

  update(): void {
    this.raw.update();
  }

  destroy(): void {
    this.raw.destroy();
  }

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

    // Free memory
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

  getDebugNavMesh(): DebugNavMesh {
    const rawDebugNavMesh = this.raw.getDebugNavMesh();
    return new DebugNavMesh(rawDebugNavMesh);
  }

  getClosestPoint(position: Vector3): Vector3 {
    const positionRaw = vec3.toRaw(position);
    const closestPoint = this.raw.getClosestPoint(positionRaw);

    return vec3.fromRaw(closestPoint);
  }

  getRandomPointAround(position: Vector3, radius: number): Vector3 {
    const positionRaw = vec3.toRaw(position);
    const randomPoint = this.raw.getRandomPointAround(positionRaw, radius);

    return vec3.fromRaw(randomPoint);
  }

  moveAlong(position: Vector3, destination: Vector3): Vector3 {
    const positionRaw = vec3.toRaw(position);
    const destinationRaw = vec3.toRaw(destination);
    const movedPosition = this.raw.moveAlong(positionRaw, destinationRaw);

    return { x: movedPosition.x, y: movedPosition.y, z: movedPosition.z };
  }

  computePath(start: Vector3, end: Vector3): NavPath {
    const startRaw = vec3.toRaw(start);
    const endRaw = vec3.toRaw(end);
    const pathRaw = this.raw.computePath(startRaw, endRaw);

    return navPath.fromRaw(pathRaw);
  }

  getDefaultQueryExtent(): Vector3 {
    const extentRaw = this.raw.getDefaultQueryExtent();

    return { x: extentRaw.x, y: extentRaw.y, z: extentRaw.z };
  }

  setDefaultQueryExtent(extent: Vector3): void {
    const extentRaw = vec3.toRaw(extent);
    this.raw.setDefaultQueryExtent(extentRaw);
  }

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

  removeObstacle(obstacleRef: ObstacleRef): void {
    this.obstacles.delete(obstacleRef);
    this.raw.removeObstacle(obstacleRef);
  }

  createCrowd(config: { maxAgents: number; maxAgentRadius: number }): Crowd {
    return new Crowd({ navMesh: this, ...config });
  }
}
