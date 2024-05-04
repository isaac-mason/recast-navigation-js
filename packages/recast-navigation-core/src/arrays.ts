import { Raw, RawModule } from './raw';

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

  protected abstract typedArrayClass: T;

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

  copy(data: InstanceType<T> | number[]): void {
    this.raw.resize(data.length);

    const view = this.getHeapView();

    view.set(data);
  }

  destroy() {
    Raw.destroy(this.raw);
  }

  getHeapView(): InstanceType<T> {
    const heap = this.getHeap();

    const dataHeap = new this.typedArrayClass(
      heap.buffer,
      this.raw.getDataPointer(),
      this.size
    );

    return dataHeap as InstanceType<T>;
  }

  toTypedArray(): InstanceType<T> {
    const view = this.getHeapView();

    const data = new this.typedArrayClass(this.size);
    data.set(view);

    return data as InstanceType<T>;
  }

  protected abstract getHeap(): InstanceType<T>;
}

export class IntArray extends BaseArray<RawModule.IntArray, typeof Int32Array> {
  typedArrayClass = Int32Array;

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
    return new this(raw);
  }
}

export class UnsignedIntArray extends BaseArray<
  RawModule.UnsignedIntArray,
  typeof Uint32Array
> {
  typedArrayClass = Uint32Array;

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
    return new this(raw);
  }
}

export class UnsignedCharArray extends BaseArray<
  RawModule.UnsignedCharArray,
  typeof Uint8Array
> {
  typedArrayClass = Uint8Array;

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
    return new this(raw);
  }
}

export class UnsignedShortArray extends BaseArray<
  RawModule.UnsignedShortArray,
  typeof Uint16Array
> {
  typedArrayClass = Uint16Array;

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
    return new this(raw);
  }
}

export class FloatArray extends BaseArray<
  RawModule.FloatArray,
  typeof Float32Array
> {
  typedArrayClass = Float32Array;

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
    return new this(raw);
  }
}

export const VerticesArray = FloatArray;
export const TrianglesArray = IntArray;
export const TriangleAreasArray = UnsignedCharArray;
export const ChunkIdsArray = IntArray;
export const TileCacheData = UnsignedCharArray;
