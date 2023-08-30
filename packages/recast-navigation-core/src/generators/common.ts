import { Vector3 } from 'three';

export const getVertsAndTris = (
  positions: ArrayLike<number>,
  indices: ArrayLike<number>
) => {
  const bbMin = new Vector3(Infinity, Infinity, Infinity);
  const bbMax = new Vector3(-Infinity, -Infinity, -Infinity);

  for (let i = 0; i < indices.length; i++) {
    const ind = indices[i];

    const x = positions[ind * 3];
    const y = positions[ind * 3 + 1];
    const z = positions[ind * 3 + 2];
    
    bbMin.x = Math.min(bbMin.x, x);
    bbMin.y = Math.min(bbMin.y, y);
    bbMin.z = Math.min(bbMin.z, z);

    bbMax.x = Math.max(bbMax.x, x);
    bbMax.y = Math.max(bbMax.y, y);
    bbMax.z = Math.max(bbMax.z, z);
  }

  const verts = positions as number[]
  const nVerts = indices.length;

  const tris = indices as number[];
  const nTris = indices.length / 3;

  return {
    verts,
    nVerts,
    tris,
    nTris,
    bbMin: bbMin.toArray(),
    bbMax: bbMax.toArray(),
  };
};
