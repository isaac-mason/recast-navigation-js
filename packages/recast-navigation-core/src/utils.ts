import type R from '@recast-navigation/wasm';
import { Wasm } from './wasm';

export const emscripten = {
  isNull: (obj: unknown) => {
    return Wasm.Recast.getPointer(obj) === 0;
  },
  getPointer: (obj: unknown) => {
    return Wasm.Recast.getPointer(obj);
  },
  destroy: (obj: unknown) => {
    return Wasm.Recast.destroy(obj);
  },
};

export type Vector3 = { x: number; y: number; z: number };

export const vec3 = {
  toRaw: ({ x, y, z }: Vector3, existing?: R.Vec3) => {
    if (existing) {
      existing.x = x;
      existing.y = y;
      existing.z = z;
      return existing;
    }

    return new Wasm.Recast.Vec3(x, y, z);
  },
  fromRaw: (vec3: R.Vec3, freeRaw?: boolean) => {
    const { x, y, z } = vec3;

    if (freeRaw) {
      emscripten.destroy(vec3);
    }

    return { x, y, z };
  },
  fromArray: ([x, y, z]: number[]) => {
    return { x, y, z };
  },
  toArray: ({ x, y, z }: Vector3) => {
    return [x, y, z];
  },
};

export const array = <T>(getter: (index: number) => T, count: number) => {
  const array: T[] = [];

  for (let i = 0; i < count; i++) {
    array.push(getter(i));
  }

  return array;
};
