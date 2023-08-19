import type R from '@recast-navigation/wasm';
import { NavMesh } from '../detour-nav-mesh';
import { TileCache, TileCacheMeshProcess } from '../detour-tile-cache';
import { Raw } from '../raw';

export type NavMeshImporterResult =
  | {
      navMesh: NavMesh;
    }
  | {
      navMesh: NavMesh;
      tileCache: TileCache;
      allocator: R.RecastLinearAllocator;
      compressor: R.RecastFastLZCompressor;
    };

export const importNavMesh = (
  data: Uint8Array,
  tileCacheMeshProcess: TileCacheMeshProcess
): NavMeshImporterResult => {
  const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
  const dataPtr = Raw.Module._malloc(nDataBytes);

  const dataHeap = new Uint8Array(
    Raw.Module.HEAPU8.buffer,
    dataPtr,
    nDataBytes
  );
  dataHeap.set(data);

  const buf = new Raw.Module.NavMeshExport();
  buf.dataPointer = dataHeap.byteOffset;
  buf.size = data.length;

  const result = Raw.NavMeshImporter.importNavMesh(buf, tileCacheMeshProcess.raw);

  Raw.Module._free(dataHeap.byteOffset);

  const rawNavMesh = result.navMesh;
  const rawTileCache = result.tileCache;

  const navMesh = new NavMesh(rawNavMesh);
  const tileCache = new TileCache(rawTileCache);

  return { navMesh, tileCache };
};
