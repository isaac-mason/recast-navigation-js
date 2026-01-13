import { Raw, type RawModule } from './raw';

abstract class BaseArray<
  RawType extends
    | RawModule.IntArray
    | RawModule.UnsignedIntArray
    | RawModule.UnsignedCharArray
    | RawModule.UnsignedShortArray
    | RawModule.FloatArray,
  TypedArrayType extends
    | Int32Array
    | Uint32Array
    | Uint8Array
    | Uint16Array
    | Float32Array,
> {
  raw: RawType;

  get size() {
    return this.raw.size;
  }

  protected abstract ArrayConstructor: new (
    buffer: ArrayBufferLike,
    byteOffset: number,
    length: number
  ) => TypedArrayType;

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

  copy(data: TypedArrayType | number[]): void {
    this.raw.resize(data.length);

    const view = this.getHeapView();

    view.set(data);
  }

  destroy() {
    Raw.destroy(this.raw);
  }

  getHeapView(): TypedArrayType {
    const heap = this.getHeap();

    return new this.ArrayConstructor(
      heap.buffer,
      this.raw.getDataPointer(),
      this.size
    );
  }

  toTypedArray(): TypedArrayType {
    const view = this.getHeapView();

    const data = new this.ArrayConstructor(
      new ArrayBuffer(this.size * view.BYTES_PER_ELEMENT),
      0,
      this.size
    );
    data.set(view);

    return data;
  }

  protected abstract getHeap(): TypedArrayType;
}

export class IntArray extends BaseArray<RawModule.IntArray, Int32Array> {
  protected ArrayConstructor = Int32Array;

  /**
   * Creates a new IntArray.
   */
  constructor();

  /**
   * Creates a wrapper around an existing raw IntArray object.
   */
  constructor(raw: RawModule.IntArray);

  constructor(raw?: RawModule.IntArray) {
    super(raw ?? new Raw.Module.IntArray());
  }

  protected getHeap(): Int32Array {
    return Raw.Module.HEAP32;
  }

  static fromRaw(raw: RawModule.IntArray) {
    return new IntArray(raw);
  }
}

export class UnsignedIntArray extends BaseArray<
  RawModule.UnsignedIntArray,
  Uint32Array
> {
  protected ArrayConstructor = Uint32Array;

  /**
   * Creates a new UnsignedIntArray.
   */
  constructor();

  /**
   * Creates a wrapper around an existing raw UnsignedIntArray object.
   */
  constructor(raw: RawModule.UnsignedIntArray);

  constructor(raw?: RawModule.UnsignedIntArray) {
    super(raw ?? new Raw.Module.UnsignedIntArray());
  }

  protected getHeap(): Uint32Array {
    return Raw.Module.HEAPU32;
  }

  static fromRaw(raw: RawModule.UnsignedIntArray) {
    return new UnsignedIntArray(raw);
  }
}

export class UnsignedCharArray extends BaseArray<
  RawModule.UnsignedCharArray,
  Uint8Array
> {
  protected ArrayConstructor = Uint8Array;

  /**
   * Creates a new UnsignedCharArray.
   */
  constructor();

  /**
   * Creates a wrapper around an existing raw UnsignedCharArray object.
   */
  constructor(raw: RawModule.UnsignedCharArray);

  constructor(raw?: RawModule.UnsignedCharArray) {
    super(raw ?? new Raw.Module.UnsignedCharArray());
  }

  protected getHeap(): Uint8Array {
    return Raw.Module.HEAPU8;
  }

  static fromRaw(raw: RawModule.UnsignedCharArray) {
    return new UnsignedCharArray(raw);
  }
}

export class UnsignedShortArray extends BaseArray<
  RawModule.UnsignedShortArray,
  Uint16Array
> {
  protected ArrayConstructor = Uint16Array;

  /**
   * Creates a new UnsignedShortArray.
   */
  constructor();

  /**
   * Creates a wrapper around an existing raw UnsignedShortArray object.
   */
  constructor(raw: RawModule.UnsignedShortArray);

  constructor(raw?: RawModule.UnsignedShortArray) {
    super(raw ?? new Raw.Module.UnsignedShortArray());
  }

  protected getHeap(): Uint16Array {
    return Raw.Module.HEAPU16;
  }

  static fromRaw(raw: RawModule.UnsignedShortArray) {
    return new UnsignedShortArray(raw);
  }
}

export class FloatArray extends BaseArray<
  RawModule.FloatArray,
  Float32Array
> {
  protected ArrayConstructor = Float32Array;

  /**
   * Creates a new FloatArray.
   */
  constructor();

  /**
   * Creates a wrapper around an existing raw FloatArray object.
   */
  constructor(raw: RawModule.FloatArray);

  constructor(raw?: RawModule.FloatArray) {
    super(raw ?? new Raw.Module.FloatArray());
  }

  protected getHeap(): Float32Array {
    return Raw.Module.HEAPF32;
  }

  static fromRaw(raw: RawModule.FloatArray) {
    return new FloatArray(raw);
  }
}

export const VerticesArray = FloatArray;
export const TrianglesArray = IntArray;
export const TriangleAreasArray = UnsignedCharArray;
export const ChunkIdsArray = IntArray;
export const TileCacheData = UnsignedCharArray;
