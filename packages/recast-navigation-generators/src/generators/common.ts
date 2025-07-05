import { type OffMeshConnectionParams, vec3 } from '@recast-navigation/core';

export const getBoundingBox = (
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
) => {
  const bbMin = { x: Infinity, y: Infinity, z: Infinity };
  const bbMax = { x: -Infinity, y: -Infinity, z: -Infinity };

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

  return {
    bbMin: vec3.toArray(bbMin),
    bbMax: vec3.toArray(bbMax),
  };
};

export const dtIlog2 = (v: number) => {
  let r = 0;
  let shift = 0;

  r = Number(v > 0xffff) << 4;
  v >>= r;

  shift = Number(v > 0xff) << 3;
  v >>= shift;
  r |= shift;

  shift = Number(v > 0xf) << 2;
  v >>= shift;
  r |= shift;

  shift = Number(v > 0x3) << 1;
  v >>= shift;
  r |= shift;
  r |= v >> 1;

  return r;
};

export const dtNextPow2 = (v: number) => {
  v--;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  v++;
  return v;
};

export type OffMeshConnectionGeneratorParams = {
  offMeshConnections?: OffMeshConnectionParams[];
};
