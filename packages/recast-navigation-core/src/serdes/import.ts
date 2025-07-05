import { NavMesh } from '../nav-mesh';
import { Raw, type RawModule } from '../raw';
import { TileCache, TileCacheMeshProcess } from '../tile-cache';

const createNavMeshExport = (data: Uint8Array) => {
  const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
  const dataPtr = Raw.Module._malloc(nDataBytes);

  const dataHeap = new Uint8Array(
    Raw.Module.HEAPU8.buffer,
    dataPtr,
    nDataBytes,
  );
  dataHeap.set(data);

  const navMeshExport = new Raw.Module.NavMeshExport();
  navMeshExport.dataPointer = dataHeap.byteOffset;
  navMeshExport.size = data.length;

  return { navMeshExport, dataHeap };
};

export type ImportNavMeshResult = {
  navMesh: NavMesh;
};

export const importNavMesh = (data: Uint8Array): ImportNavMeshResult => {
  const { navMeshExport, dataHeap } = createNavMeshExport(data);

  const result = Raw.NavMeshImporter.importNavMesh(navMeshExport, undefined!);

  Raw.Module._free(dataHeap.byteOffset);

  const navMesh = new NavMesh(result.navMesh);

  return { navMesh };
};

export type ImportTileCacheResult = {
  navMesh: NavMesh;
  tileCache: TileCache;
  allocator: RawModule.RecastLinearAllocator;
  compressor: RawModule.RecastFastLZCompressor;
};

export const importTileCache = (
  data: Uint8Array,
  tileCacheMeshProcess: TileCacheMeshProcess,
): ImportTileCacheResult => {
  const { navMeshExport, dataHeap } = createNavMeshExport(data);

  const result = Raw.NavMeshImporter.importNavMesh(
    navMeshExport,
    tileCacheMeshProcess.raw as never,
  );

  Raw.Module._free(dataHeap.byteOffset);

  const navMesh = new NavMesh(result.navMesh);
  const tileCache = new TileCache(result.tileCache);

  const allocator = result.allocator;
  const compressor = result.compressor;

  return { navMesh, tileCache, allocator, compressor };
};
