import { Raw } from './raw';

export type PolyRef = number | bigint;

type RawPolyRefRef = {
  value: PolyRef;
};

type RawPolyRefArray = {
  size: number;
  resize(size: number): void;
  get(index: number): PolyRef;
  set(index: number, value: PolyRef): void;
  getDataPointer(): number;
};

const moduleWithPolyRef64 = () =>
  Raw.Module as typeof Raw.Module & {
    UnsignedLongLongRef?: new () => RawPolyRefRef;
    UnsignedLongLongArray?: new () => RawPolyRefArray;
    HEAPU64?: BigUint64Array;
  };

export const uses64BitPolyRefs = (): boolean =>
  typeof moduleWithPolyRef64().UnsignedLongLongRef === 'function' &&
  typeof moduleWithPolyRef64().UnsignedLongLongArray === 'function' &&
  moduleWithPolyRef64().HEAPU64 instanceof BigUint64Array;

export const fromWasmPolyRef = (ref: PolyRef): PolyRef =>
  typeof ref === 'bigint' ? BigInt.asUintN(64, ref) : ref;

export const toWasmPolyRef = (ref: PolyRef): PolyRef => {
  if (uses64BitPolyRefs()) {
    return BigInt.asIntN(64, typeof ref === 'bigint' ? ref : BigInt(ref));
  }

  return typeof ref === 'bigint' ? Number(BigInt.asUintN(32, ref)) : ref;
};

export const nullPolyRef = (): PolyRef => (uses64BitPolyRefs() ? 0n : 0);

export const createPolyRefRef = (): RawPolyRefRef => {
  const Module = moduleWithPolyRef64();
  return uses64BitPolyRefs() && Module.UnsignedLongLongRef
    ? new Module.UnsignedLongLongRef()
    : new Raw.Module.UnsignedIntRef();
};

export const readPolyRefRef = (ref: RawPolyRefRef): PolyRef =>
  fromWasmPolyRef(ref.value);

export class PolyRefArray {
  raw: RawPolyRefArray;
  private readonly polyRef64: boolean;

  constructor(raw?: RawPolyRefArray) {
    const Module = moduleWithPolyRef64();
    this.polyRef64 = uses64BitPolyRefs();
    this.raw =
      raw ??
      (this.polyRef64 && Module.UnsignedLongLongArray
        ? new Module.UnsignedLongLongArray()
        : new Raw.Module.UnsignedIntArray());
  }

  get size(): number {
    return this.raw.size;
  }

  get(index: number): PolyRef {
    return fromWasmPolyRef(this.raw.get(index));
  }

  set(index: number, value: PolyRef): void {
    this.raw.set(index, toWasmPolyRef(value));
  }

  resize(size: number): void {
    this.raw.resize(size);
  }

  copy(data: readonly PolyRef[]): void {
    this.resize(data.length);
    for (let index = 0; index < data.length; index++) {
      this.set(index, data[index]);
    }
  }

  getHeapView(): Uint32Array | BigUint64Array {
    if (this.polyRef64) {
      const heap = moduleWithPolyRef64().HEAPU64;
      if (!heap) throw new Error('64-bit polygon-ref heap is unavailable');
      return new BigUint64Array(
        heap.buffer,
        this.raw.getDataPointer(),
        this.size,
      );
    }
    return new Uint32Array(
      Raw.Module.HEAPU32.buffer,
      this.raw.getDataPointer(),
      this.size,
    );
  }

  toArray(): PolyRef[] {
    return Array.from(this.getHeapView(), fromWasmPolyRef);
  }

  destroy(): void {
    Raw.destroy(this.raw);
  }
}
