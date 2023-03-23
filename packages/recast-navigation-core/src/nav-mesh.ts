import R from '@recast-navigation/wasm';
import { ObstacleRef } from './obstacle';
import { Raw } from './raw';
import { NavPath, navPath, vec3, Vector3 } from './utils';
import { DebugNavMesh } from './debug-nav-mesh';

export type NavMeshConfig = {
  /**
   * @default 0
   */
  borderSize?: number;

  /**
   * @default 0
   */
  tileSize?: number;

  /**
   * @default 0.2
   */
  cs?: number;

  /**
   * @default 0.2
   */
  ch?: number;

  /**
   * @default 60
   */
  walkableSlopeAngle?: number;

  /**
   * @default 2
   */
  walkableHeight?: number;

  /**
   * @default 2
   */
  walkableClimb?: number;

  /**
   * @default 0.5
   */
  walkableRadius?: number;

  /**
   * @default 12
   */
  maxEdgeLen?: number;

  /**
   * @default 1.3
   */
  maxSimplificationError?: number;

  /**
   * @default 8
   */
  minRegionArea?: number;

  /**
   * @default 20
   */
  mergeRegionArea?: number;

  /**
   * @default 6
   */
  maxVertsPerPoly?: number;

  /**
   * @default 6
   */
  detailSampleDist?: number;

  /**
   * @default 1
   */
  detailSampleMaxError?: number;
};

export class NavMesh {
  raw: R.NavMesh;

  constructor() {
    this.raw = new Raw.Recast.NavMesh();
  }

  build(
    positions: number[],
    indices: number[],
    config: NavMeshConfig = {}
  ): void {
    const rc = new Raw.Recast.rcConfig();

    rc.borderSize = config.borderSize ?? 0;
    rc.tileSize = config.tileSize ?? 0;
    rc.cs = config.cs ?? 0.2;
    rc.ch = config.ch ?? 0.2;
    rc.walkableSlopeAngle = config.walkableSlopeAngle ?? 60;
    rc.walkableHeight = config.walkableHeight ?? 2;
    rc.walkableClimb = config.walkableClimb ?? 2;
    rc.walkableRadius = config.walkableRadius ?? 0.5;
    rc.maxEdgeLen = config.maxEdgeLen ?? 12;
    rc.maxSimplificationError = config.maxSimplificationError ?? 1.3;
    rc.minRegionArea = config.minRegionArea ?? 8;
    rc.mergeRegionArea = config.mergeRegionArea ?? 20;
    rc.maxVertsPerPoly = config.maxVertsPerPoly ?? 6;
    rc.detailSampleDist = config.detailSampleDist ?? 6;
    rc.detailSampleMaxError = config.detailSampleMaxError ?? 1;

    this.raw.build(
      positions,
      positions.length / 3,
      indices,
      indices.length,
      rc
    );
  }

  /**
   * Build the navmesh from a previously saved state using getNavMeshData
   * @param data the Uint8Array returned by getNavmeshData
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
   * Returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
   * @returns data the Uint8Array that can be saved and reused
   */
  getNavMeshData(): Uint8Array {
    const navMeshData = this.raw.getNavMeshData();
    const arrView = new Uint8Array(
      Raw.Recast.HEAPU8.buffer,
      navMeshData.dataPointer,
      navMeshData.size
    );
    const ret = new Uint8Array(navMeshData.size);
    ret.set(arrView);
    this.raw.freeNavMeshData(navMeshData);

    return ret;
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
  ): ObstacleRef {
    const positionRaw = vec3.toRaw(position);
    const obstacleRef = this.raw.addCylinderObstacle(
      positionRaw,
      radius,
      height
    );

    return obstacleRef;
  }

  addBoxObstacle(
    position: Vector3,
    extent: Vector3,
    angle: number
  ): ObstacleRef {
    const positionRaw = vec3.toRaw(position);
    const extentRaw = vec3.toRaw(extent);
    const obstacleRef = this.raw.addBoxObstacle(positionRaw, extentRaw, angle);

    return obstacleRef;
  }

  removeObstacle(obstacleRef: ObstacleRef): void {
    this.raw.removeObstacle(obstacleRef as R.dtObstacleRef);
  }

  update(): void {
    this.raw.update();
  }

  destroy(): void {
    this.raw.destroy();
  }
}
