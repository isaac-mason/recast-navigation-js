import type R from '@recast-navigation/wasm';
import { Raw } from './raw';

export type Vector3 = { x: number; y: number; z: number };

export const vector3 = {
  toRaw: (v: Vector3) => {
    return new Raw.Recast.Vec3(v.x, v.y, v.z);
  },
  fromRaw: (v: R.Vec3) => {
    return { x: v.x, y: v.y, z: v.z };
  },
};
