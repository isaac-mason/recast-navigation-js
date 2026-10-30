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
    out: Vector3 = { x: 0, y: 0, z: 0 },
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

/**
 * Zero-allocation reads/writes of small fixed struct vectors via the shared wasm
 * scratch buffer. `raw.read_<name>()` copies the field into scratch (one boundary
 * crossing); we read it from HEAPF32 into a pre-allocated target. `write_<name>()`
 * does the reverse. Re-grab the heap view each call (memory growth may relocate it).
 */
type ScratchRaw = Record<string, () => void>;

export const readVec3 = (
  raw: unknown,
  name: string,
  out: Vector3 = { x: 0, y: 0, z: 0 },
): Vector3 => {
  (raw as ScratchRaw)[`read_${name}`]();
  const base = Raw.Module.getScratchPtr() >> 2;
  const heap = Raw.Module.HEAPF32;
  out.x = heap[base];
  out.y = heap[base + 1];
  out.z = heap[base + 2];
  return out;
};

export const writeVec3 = (raw: unknown, name: string, v: Vector3): void => {
  const base = Raw.Module.getScratchPtr() >> 2;
  const heap = Raw.Module.HEAPF32;
  heap[base] = v.x;
  heap[base + 1] = v.y;
  heap[base + 2] = v.z;
  (raw as ScratchRaw)[`write_${name}`]();
};

/** Read an N-length float vector field from scratch into a pre-allocated array. */
export const readFloats = (raw: unknown, name: string, out: number[], n: number): number[] => {
  (raw as ScratchRaw)[`read_${name}`]();
  const base = Raw.Module.getScratchPtr() >> 2;
  const heap = Raw.Module.HEAPF32;
  for (let i = 0; i < n; i++) out[i] = heap[base + i];
  return out;
};

/**
 * Read a single element of a BULK struct-array field at `index` — zero allocation,
 * no total length needed (for per-element public accessors like `poly.verts(i)`).
 */
const bulkPtr = (raw: unknown, name: string): number =>
  (raw as Record<string, () => number>)[`${name}Ptr`]();

export const bulkAt = {
  f32: (raw: unknown, name: string, i: number) => Raw.Module.HEAPF32[(bulkPtr(raw, name) >> 2) + i],
  i32: (raw: unknown, name: string, i: number) => Raw.Module.HEAP32[(bulkPtr(raw, name) >> 2) + i],
  u32: (raw: unknown, name: string, i: number) => Raw.Module.HEAPU32[(bulkPtr(raw, name) >> 2) + i],
  u16: (raw: unknown, name: string, i: number) => Raw.Module.HEAPU16[(bulkPtr(raw, name) >> 1) + i],
  u8: (raw: unknown, name: string, i: number) => Raw.Module.HEAPU8[bulkPtr(raw, name) + i],
};

/** Write a single element of a BULK struct-array field at `index` (via the heap). */
export const bulkSet = {
  f32: (raw: unknown, name: string, i: number, v: number) => {
    Raw.Module.HEAPF32[(bulkPtr(raw, name) >> 2) + i] = v;
  },
  i32: (raw: unknown, name: string, i: number, v: number) => {
    Raw.Module.HEAP32[(bulkPtr(raw, name) >> 2) + i] = v;
  },
  u32: (raw: unknown, name: string, i: number, v: number) => {
    Raw.Module.HEAPU32[(bulkPtr(raw, name) >> 2) + i] = v;
  },
  u16: (raw: unknown, name: string, i: number, v: number) => {
    Raw.Module.HEAPU16[(bulkPtr(raw, name) >> 1) + i] = v;
  },
  u8: (raw: unknown, name: string, i: number, v: number) => {
    Raw.Module.HEAPU8[bulkPtr(raw, name) + i] = v;
  },
};

/** Write an N-length float vector field from a pre-supplied array via scratch. */
export const writeFloats = (raw: unknown, name: string, arr: ArrayLike<number>, n: number): void => {
  const base = Raw.Module.getScratchPtr() >> 2;
  const heap = Raw.Module.HEAPF32;
  for (let i = 0; i < n; i++) heap[base + i] = arr[i];
  (raw as ScratchRaw)[`write_${name}`]();
};

/**
 * A zero-copy typed view over a BULK struct-array field (`raw.<name>Ptr()` returns
 * the wasm pointer; length comes from a sibling field). View is created once per call.
 */
export const bulkView = <T extends Float32Array | Int32Array | Uint32Array | Uint8Array | Uint16Array>(
  raw: unknown,
  name: string,
  length: number,
  Ctor: new (buffer: ArrayBufferLike, byteOffset: number, length: number) => T,
  heap: T,
): T => {
  const ptr = (raw as Record<string, () => number>)[`${name}Ptr`]();
  return new Ctor(heap.buffer, ptr, length);
};
