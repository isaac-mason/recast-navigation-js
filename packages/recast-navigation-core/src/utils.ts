import { Raw } from './raw';
import type R from './raw-module';

export type Vector3 = { x: number; y: number; z: number };

export type Vector3Tuple = [number, number, number];

export type Vector2 = { x: number; y: number };

export type Vector2Tuple = [x: number, y: number];

export const vec3 = {
  toRaw: ({ x, y, z }: Vector3, existing?: R.Vec3) => {
    if (existing) {
      existing.x = x;
      existing.y = y;
      existing.z = z;
      return existing;
    }

    return new Raw.Module.Vec3(x, y, z);
  },
  fromRaw: (vec3: R.Vec3, freeRaw?: boolean) => {
    const { x, y, z } = vec3;

    if (freeRaw) {
      Raw.Module.destroy(vec3);
    }

    return { x, y, z };
  },
  fromArray: ([x, y, z]: number[]) => {
    return { x, y, z };
  },
  toArray: ({ x, y, z }: Vector3): Vector3Tuple => {
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

/**
 * @param n A non-negative integer
 * @returns Array `[0, ..., n-1]`
 */
export function range(n: number) {
  return [...Array(n)].map((_, i) => i);
}