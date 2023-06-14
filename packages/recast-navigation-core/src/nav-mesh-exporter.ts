import type R from '@recast-navigation/wasm';
import { NavMesh } from './nav-mesh';
import { TileCache } from './tile-cache';
import { Wasm } from './wasm';
import { emscripten } from './utils';
import { finalizer } from './finalizer';

export class NavMeshExporter {
  raw: R.NavMeshExporter;

  constructor() {
    this.raw = new Wasm.Recast.NavMeshExporter();

    finalizer.register(this);
  }

  /**
   * Returns a NavMesh export that can be used later. The NavMesh must be built before retrieving the data
   * @returns data the Uint8Array that can be saved and reused
   */
  export(navMesh: NavMesh, tileCache?: TileCache): Uint8Array {
    const navMeshExport = this.raw.exportNavMesh(navMesh.raw, tileCache?.raw!);

    const arrView = new Uint8Array(
      Wasm.Recast.HEAPU8.buffer,
      navMeshExport.dataPointer,
      navMeshExport.size
    );

    const data = new Uint8Array(navMeshExport.size);
    data.set(arrView);
    this.raw.freeNavMeshExport(navMeshExport);

    return data;
  }

  destroy(): void {
    finalizer.unregister(this);
    emscripten.destroy(this.raw);
  }
}
