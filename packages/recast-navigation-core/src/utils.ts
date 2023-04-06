import type R from '@recast-navigation/wasm';
import { Raw } from './raw';

export type Vector3 = { x: number; y: number; z: number };

export const vec3 = {
  toRaw: ({ x, y, z }: Vector3) => {
    return new Raw.Recast.Vec3(x, y, z);
  },
  fromRaw: ({ x, y, z }: R.Vec3) => {
    return { x, y, z };
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
