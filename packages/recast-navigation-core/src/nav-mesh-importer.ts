import type R from '@recast-navigation/wasm';
import { NavMesh } from './nav-mesh';
import { TileCache } from './tile-cache';
import { Wasm } from './wasm';
import { emscripten } from './utils';
import { finalizer } from './finalizer';

export type NavMeshImporterResult = {
  navMesh: NavMesh;
  tileCache: TileCache;
};

export class NavMeshImporter {
  raw: R.NavMeshImporter;

  constructor() {
    this.raw = new Wasm.Recast.NavMeshImporter();

    finalizer.register(this);
  }

  /**
   * Build the navmesh from a previously saved state using getNavMeshExport
   * @param data the Uint8Array returned by `getNavMeshExport`
   */
  import(data: Uint8Array): NavMeshImporterResult {
    const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    const dataPtr = Wasm.Recast._malloc(nDataBytes);

    const dataHeap = new Uint8Array(
      Wasm.Recast.HEAPU8.buffer,
      dataPtr,
      nDataBytes
    );
    dataHeap.set(data);

    const buf = new Wasm.Recast.NavMeshExport();
    buf.dataPointer = dataHeap.byteOffset;
    buf.size = data.length;

    const result = this.raw.importNavMesh(buf);

    Wasm.Recast._free(dataHeap.byteOffset);

    const rawNavMesh = result.getNavMesh();
    const rawTileCache = result.getTileCache();

    const navMesh = new NavMesh(rawNavMesh);
    const tileCache = new TileCache(rawTileCache);

    return { navMesh, tileCache };
  }

  destroy(): void {
    finalizer.unregister(this);
    emscripten.destroy(this.raw);
  }
}
