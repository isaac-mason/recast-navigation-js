import type Recast from '@recast-navigation/wasm';
import { NavMesh } from '../nav-mesh';
import { Raw } from '../raw';
import { TileCache, TileCacheMeshProcess } from '../tile-cache';

export type NavMeshImporterResult =
  | {
      navMesh: NavMesh;
    }
  | {
      navMesh: NavMesh;
      tileCache: TileCache;
      allocator: Recast.RecastLinearAllocator;
      compressor: Recast.RecastFastLZCompressor;
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    tileCacheMeshProcess?.raw!
  );

  Raw.Module._free(dataHeap.byteOffset);

  const rawNavMesh = result.navMesh;
  const rawTileCache = result.tileCache;

  const navMesh = new NavMesh(rawNavMesh);
  const tileCache = new TileCache(rawTileCache);

  return { navMesh, tileCache };
};
