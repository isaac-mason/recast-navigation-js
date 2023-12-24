import { NavMesh } from '../nav-mesh';
import { TileCache } from '../tile-cache';
import { Raw } from '../raw';

export const exportNavMesh = (
  navMesh: NavMesh,
  tileCache?: TileCache
): Uint8Array => {
  const navMeshExport = Raw.NavMeshExporter.exportNavMesh(
    navMesh.raw,
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    tileCache?.raw!
  );

  const arrView = new Uint8Array(
    Raw.Module.HEAPU8.buffer,
    navMeshExport.dataPointer,
    navMeshExport.size
  );

  const data = new Uint8Array(navMeshExport.size);
  data.set(arrView);
  Raw.NavMeshExporter.freeNavMeshExport(navMeshExport);

  return data;
};
