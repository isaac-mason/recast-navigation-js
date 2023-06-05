import type R from '@recast-navigation/wasm';
import { Wasm } from './wasm';

export type Vector3 = { x: number; y: number; z: number };

export const vec3 = {
  toRaw: ({ x, y, z }: Vector3) => {
    return new Wasm.Recast.Vec3(x, y, z);
  },
  fromRaw: ({ x, y, z }: R.Vec3) => {
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

export const emscripten = {
  isNull: (obj: unknown) => {
    return Wasm.Recast.getPointer(obj) === 0;
  },
  getPointer: (obj: unknown) => {
    return Wasm.Recast.getPointer(obj);
  },
};
