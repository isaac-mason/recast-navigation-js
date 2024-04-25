import { Raw } from './raw';
import RawModule from './raw-module';

type TypedArray =
  | typeof Int32Array
  | typeof Uint32Array
  | typeof Uint8Array
  | typeof Uint16Array
  | typeof Float32Array;

abstract class BaseArray<
  RawType extends
    | RawModule.IntArray
    | RawModule.UnsignedIntArray
    | RawModule.UnsignedCharArray
    | RawModule.UnsignedShortArray
    | RawModule.FloatArray,
  T extends TypedArray,
> {
  raw: RawType;

  get size() {
    return this.raw.size;
  }

  abstract TypedArray: T;

  constructor(raw: RawType) {
    this.raw = raw;
  }

  get(i: number) {
    return this.raw.get(i);
  }

  set(i: number, value: number) {
    this.raw.set(i, value);
  }

  resize(size: number) {
    this.raw.resize(size);
  }

  free() {
    this.raw.free();
  }

  protected abstract getHeap(): InstanceType<T>;

  copy(data: InstanceType<T> | number[]): void {
    if ('buffer' in data) {
      this.raw.resize(data.length);

      const heap = this.getHeap();

      const dataPointer = this.raw.getDataPointer();
      const nDataBytes = data.length * data.BYTES_PER_ELEMENT;

      const dataHeap = new this.TypedArray(
        heap.buffer,
        dataPointer,
        nDataBytes
      );

      dataHeap.set(data);
    } else {
      this.raw.copy(data, data.length);
    }
  }

  getTypedArrayView(): InstanceType<T> {
    const heap = this.getHeap();

    const dataHeap = new this.TypedArray(
      heap.buffer,
      this.raw.getDataPointer(),
      this.size
    );

    return dataHeap as InstanceType<T>;
  }

  toTypedArray(): InstanceType<T> {
    const view = this.getTypedArrayView();

    const data = new this.TypedArray(this.size);
    data.set(view);

    return data as InstanceType<T>;
  }
}

export class IntArray extends BaseArray<RawModule.IntArray, typeof Int32Array> {
  TypedArray = Int32Array;

  constructor(raw?: RawModule.IntArray) {
    super(raw ?? new Raw.Module.IntArray());
  }

  protected getHeap(): Int32Array {
    return Raw.Module.HEAP32;
  }

  static fromRaw(raw?: RawModule.IntArray) {
    return new this(raw);
  }
}

export class UnsignedIntArray extends BaseArray<
  RawModule.UnsignedIntArray,
  typeof Uint32Array
> {
  TypedArray = Uint32Array;

  constructor(raw?: RawModule.UnsignedIntArray) {
    super(raw ?? new Raw.Module.UnsignedIntArray());
  }

  protected getHeap(): Uint32Array {
    return Raw.Module.HEAPU32;
  }

  static fromRaw(raw?: RawModule.UnsignedIntArray) {
    return new this(raw);
  }
}

export class UnsignedCharArray extends BaseArray<
  RawModule.UnsignedCharArray,
  typeof Uint8Array
> {
  TypedArray = Uint8Array;

  constructor(raw?: RawModule.UnsignedCharArray) {
    super(raw ?? new Raw.Module.UnsignedCharArray());
  }

  protected getHeap(): Uint8Array {
    return Raw.Module.HEAPU8;
  }

  static fromRaw(raw?: RawModule.UnsignedCharArray) {
    return new this(raw);
  }
}

export class UnsignedShortArray extends BaseArray<
  RawModule.UnsignedShortArray,
  typeof Uint16Array
> {
  TypedArray = Uint16Array;

  constructor(raw?: RawModule.UnsignedShortArray) {
    super(raw ?? new Raw.Module.UnsignedShortArray());
  }

  protected getHeap(): Uint16Array {
    return Raw.Module.HEAPU16;
  }

  static fromRaw(raw?: RawModule.UnsignedShortArray) {
    return new this(raw);
  }
}

export class FloatArray extends BaseArray<
  RawModule.FloatArray,
  typeof Float32Array
> {
  TypedArray = Float32Array;

  constructor(raw?: RawModule.FloatArray) {
    super(raw ?? new Raw.Module.FloatArray());
  }

  protected getHeap(): Float32Array {
    return Raw.Module.HEAPF32;
  }

  static fromRaw(raw?: RawModule.FloatArray) {
    return new this(raw);
  }
}

export const VertsArray = FloatArray;
export const TrisArray = IntArray;
export const TriAreasArray = UnsignedCharArray;
export const ChunkIdsArray = IntArray;
export const TileCacheData = UnsignedCharArray;
