import type R from '@recast-navigation/wasm';
import { Raw } from './raw';

export type Vector3 = { x: number; y: number; z: number };

export const vec3 = {
  toRaw: (v: Vector3) => {
    return new Raw.Recast.Vec3(v.x, v.y, v.z);
  },
  fromRaw: (v: R.Vec3) => {
    return { x: v.x, y: v.y, z: v.z };
  },
};

export type NavPath = Vector3[];

export const navPath = {
  fromRaw: (v: R.NavPath) => {
    const path = [];
    for (let i = 0; i < v.getPointCount(); i++) {
      path.push(vec3.fromRaw(v.getPoint(i)));
    }
    return path;
  },
};
