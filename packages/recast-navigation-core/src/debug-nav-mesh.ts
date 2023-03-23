import R from '@recast-navigation/wasm';

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
