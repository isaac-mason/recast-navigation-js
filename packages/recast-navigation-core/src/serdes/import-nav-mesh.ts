import { NavMesh } from '../nav-mesh';
import { Raw } from '../raw';
import type R from '../raw-module';
import { TileCache, TileCacheMeshProcess } from '../tile-cache';

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
  tileCacheMeshProcess?: TileCacheMeshProcess
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

  const result = Raw.NavMeshImporter.importNavMesh(
    buf,
    tileCacheMeshProcess?.raw as never
  );

  Raw.Module._free(dataHeap.byteOffset);

  const rawNavMesh = result.navMesh;
  const rawTileCache = result.tileCache;

  const navMesh = new NavMesh(rawNavMesh);
  const tileCache = new TileCache(rawTileCache);

  return { navMesh, tileCache };
};
