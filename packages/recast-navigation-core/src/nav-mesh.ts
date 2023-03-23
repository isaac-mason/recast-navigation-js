import R from '@recast-navigation/wasm';
import { ObstacleRef } from './obstacle';
import { Raw } from './raw';
import { vector3, Vector3 } from './utils';

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

export class DebugNavMesh {
  raw: R.DebugNavMesh;

  positions: number[];

  indices: number[];

  constructor(debugNavMesh: R.DebugNavMesh) {
    this.raw = debugNavMesh;

    let tri: number;
    let pt: number;

    const triangleCount = debugNavMesh.getTriangleCount();

    const positions = [];
    for (tri = 0; tri < triangleCount; tri++) {
      for (pt = 0; pt < 3; pt++) {
        const point = debugNavMesh.getTriangle(tri).getPoint(pt);
        positions.push(point.x, point.y, point.z);
      }
    }

    const indices = [];
    for (tri = 0; tri < triangleCount * 3; tri++) {
      indices.push(tri);
    }

    this.positions = positions;
    this.indices = indices;
  }
}

export class NavMesh {
  navMesh: R.NavMesh;

  constructor() {
    this.navMesh = new Raw.Recast.NavMesh();
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

    this.navMesh.build(
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

    this.navMesh = new Raw.Recast.NavMesh();
    this.navMesh.buildFromNavMeshData(buf);

    // Free memory
    Raw.Recast._free(dataHeap.byteOffset);
  }

  /**
   * Returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
   * @returns data the Uint8Array that can be saved and reused
   */
  getNavMeshData(): Uint8Array {
    const navMeshData = this.navMesh.getNavMeshData();
    const arrView = new Uint8Array(
      Raw.Recast.HEAPU8.buffer,
      navMeshData.dataPointer,
      navMeshData.size
    );
    const ret = new Uint8Array(navMeshData.size);
    ret.set(arrView);
    this.navMesh.freeNavMeshData(navMeshData);

    return ret;
  }

  getDebugNavMesh(): DebugNavMesh {
    const rawDebugNavMesh = this.navMesh.getDebugNavMesh();
    return new DebugNavMesh(rawDebugNavMesh);
  }

  getClosestPoint(position: Vector3): Vector3 {
    const positionRaw = vector3.toRaw(position);
    const closestPoint = this.navMesh.getClosestPoint(positionRaw);

    return vector3.fromRaw(closestPoint);
  }

  getRandomPointAround(position: Vector3, radius: number): Vector3 {
    const positionRaw = vector3.toRaw(position);
    const randomPoint = this.navMesh.getRandomPointAround(positionRaw, radius);

    return vector3.fromRaw(randomPoint);
  }

  moveAlong(position: Vector3, destination: Vector3): Vector3 {
    const positionRaw = vector3.toRaw(position);
    const destinationRaw = vector3.toRaw(destination);
    const movedPosition = this.navMesh.moveAlong(positionRaw, destinationRaw);

    return { x: movedPosition.x, y: movedPosition.y, z: movedPosition.z };
  }

  computePath(start: Vector3, end: Vector3): Vector3[] {
    const startRaw = vector3.toRaw(start);
    const endRaw = vector3.toRaw(end);
    const pathRaw = this.navMesh.computePath(startRaw, endRaw);
    const count = pathRaw.getPointCount();

    const path: Vector3[] = [];

    for (let i = 0; i < count; i += 3) {
      const point = pathRaw.getPoint(i);
      path.push({ x: point.x, y: point.y, z: point.z });
    }

    return path;
  }

  setDefaultQueryExtent(extent: Vector3): void {
    const extentRaw = vector3.toRaw(extent);
    this.navMesh.setDefaultQueryExtent(extentRaw);
  }

  getDefaultQueryExtent(): Vector3 {
    const extentRaw = this.navMesh.getDefaultQueryExtent();

    return { x: extentRaw.x, y: extentRaw.y, z: extentRaw.z };
  }

  addCylinderObstacle(
    position: Vector3,
    radius: number,
    height: number
  ): ObstacleRef {
    const positionRaw = vector3.toRaw(position);
    const obstacleRef = this.navMesh.addCylinderObstacle(
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
    const positionRaw = vector3.toRaw(position);
    const extentRaw = vector3.toRaw(extent);
    const obstacleRef = this.navMesh.addBoxObstacle(
      positionRaw,
      extentRaw,
      angle
    );

    return obstacleRef;
  }

  removeObstacle(obstacleRef: ObstacleRef): void {
    this.navMesh.removeObstacle(obstacleRef as R.dtObstacleRef);
  }

  update(): void {
    this.navMesh.update();
  }

  destroy(): void {
    this.navMesh.destroy();
  }
}
