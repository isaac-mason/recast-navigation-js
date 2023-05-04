import { Wasm } from './wasm';

export class DtStatus {
  static get FAILURE() {
    return Wasm.DtStatus.FAILURE;
  }

  static get SUCCESS() {
    return Wasm.DtStatus.SUCCESS;
  }

  static get IN_PROGRESS() {
    return Wasm.DtStatus.IN_PROGRESS;
  }

  static get STATUS_DETAIL_MASK() {
    return Wasm.DtStatus.STATUS_DETAIL_MASK;
  }

  static get WRONG_MAGIC() {
    return Wasm.DtStatus.WRONG_MAGIC;
  }

  static get WRONG_VERSION() {
    return Wasm.DtStatus.WRONG_VERSION;
  }

  static get OUT_OF_MEMORY() {
    return Wasm.DtStatus.OUT_OF_MEMORY;
  }

  static get INVALID_PARAM() {
    return Wasm.DtStatus.INVALID_PARAM;
  }

  static get BUFFER_TOO_SMALL() {
    return Wasm.DtStatus.BUFFER_TOO_SMALL;
  }

  static get OUT_OF_NODES() {
    return Wasm.DtStatus.OUT_OF_NODES;
  }

  static get PARTIAL_RESULT() {
    return Wasm.DtStatus.PARTIAL_RESULT;
  }

  static get ALREADY_OCCUPIED() {
    return Wasm.DtStatus.ALREADY_OCCUPIED;
  }

  static statusSucceed(status: number) {
    return Wasm.DtStatus.statusSucceed(status);
  }

  static statusFailed(status: number) {
    return Wasm.DtStatus.statusFailed(status);
  }

  static statusInProgress(status: number) {
    return Wasm.DtStatus.statusInProgress(status);
  }

  static statusDetail(status: number, detail: number) {
    return Wasm.DtStatus.statusDetail(status, detail);
  }
}
