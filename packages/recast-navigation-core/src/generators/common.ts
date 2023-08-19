import { Vector3 } from 'three';

export const getVertsAndTris = (
  positions: ArrayLike<number>,
  indices: ArrayLike<number>
) => {
  const triangleIndices: Vector3[] = [];

  const bbMin = new Vector3(Infinity, Infinity, Infinity);
  const bbMax = new Vector3(-Infinity, -Infinity, -Infinity);

  let t = 0;

  for (let i = 0; i < indices.length; i++) {
    const ind = indices[t++] * 3;

    const v = new Vector3(
      positions[ind],
      positions[ind + 1],
      positions[ind + 2]
    );

    bbMin.x = Math.min(bbMin.x, v.x);
    bbMin.y = Math.min(bbMin.y, v.y);
    bbMin.z = Math.min(bbMin.z, v.z);

    bbMax.x = Math.max(bbMax.x, v.x);
    bbMax.y = Math.max(bbMax.y, v.y);
    bbMax.z = Math.max(bbMax.z, v.z);

    triangleIndices[i] = v;
  }

  const verts: number[] = [];
  const nVerts = triangleIndices.length;

  for (let i = 0; i < triangleIndices.length; i++) {
    verts[i * 3 + 0] = triangleIndices[i].x;
    verts[i * 3 + 1] = triangleIndices[i].y;
    verts[i * 3 + 2] = triangleIndices[i].z;
  }

  const tris: number[] = [];
  const nTris = triangleIndices.length / 3;

  for (let i = 0; i < triangleIndices.length; i++) {
    tris[i] = triangleIndices.length - i - 1;
  }

  return {
    verts,
    nVerts,
    tris,
    nTris,
    bbMin: bbMin.toArray(),
    bbMax: bbMax.toArray(),
  };
};
