import { Raw, type RawModule } from './raw';

export type Vector3 = { x: number; y: number; z: number };

export type Vector3Tuple = [number, number, number];

export type Vector2 = { x: number; y: number };

export type Vector2Tuple = [x: number, y: number];

export const vec3 = {
  toRaw: ({ x, y, z }: Vector3, existing?: RawModule.Vec3) => {
    if (existing) {
      existing.x = x;
      existing.y = y;
      existing.z = z;
      return existing;
    }

    return new Raw.Module.Vec3(x, y, z);
  },
  fromRaw: (vec3: RawModule.Vec3) => {
    const { x, y, z } = vec3;

    return { x, y, z };
  },
  fromArray: ([x, y, z]: number[]) => {
    return { x, y, z };
  },
  toArray: ({ x, y, z }: Vector3): Vector3Tuple => {
    return [x, y, z];
  },
  lerp: (
    a: Vector3,
    b: Vector3,
    t: number,
    out: Vector3 = { x: 0, y: 0, z: 0 }
  ) => {
    out.x = a.x + (b.x - a.x) * t;
    out.y = a.y + (b.y - a.y) * t;
    out.z = a.z + (b.z - a.z) * t;
  },
  copy: (source: Vector3, out: Vector3 = { x: 0, y: 0, z: 0 }) => {
    out.x = source.x;
    out.y = source.y;
    out.z = source.z;
  },
};

export const array = <T>(getter: (index: number) => T, count: number) => {
  const array: T[] = [];

  for (let i = 0; i < count; i++) {
    array.push(getter(i));
  }

  return array;
};
