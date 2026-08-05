import {
  DetourTileCacheParams,
  NavMesh,
  NavMeshParams,
  NavMeshQuery,
  Raw,
  TileCache,
  TileCacheData,
  importTileCache,
  init,
  statusSucceed,
  vec3,
} from 'recast-navigation';
import {
  createDefaultTileCacheMeshProcess,
  generateTileCache,
} from 'recast-navigation/generators';
import { BoxGeometry, BufferAttribute, Mesh } from 'three';
import { expect, test } from 'vitest';

test('addTileCopy retains compressed data after the source is destroyed', async () => {
  await init();

  const mesh = new Mesh(new BoxGeometry(5, 0.1, 5));
  const positions = (mesh.geometry.getAttribute('position') as BufferAttribute)
    .array;
  const indices = mesh.geometry.getIndex()!.array;
  const generated = generateTileCache(positions, indices);

  if (!generated.success) throw new Error(generated.error);

  const exported = Raw.NavMeshExporter.exportNavMesh(
    generated.navMesh.raw,
    generated.tileCache.raw,
  );
  const tset = new Uint8Array(
    Raw.Module.HEAPU8.buffer,
    exported.dataPointer,
    exported.size,
  );
  const view = new DataView(tset.buffer, tset.byteOffset, tset.byteLength);
  const serializedTileCache = new Uint8Array(tset);

  // TSET uses fixed WASM32 layouts: RecastHeader (12),
  // TileCacheSetHeader (80), and TileCacheTileHeader (8).
  const compressedLayers: Uint8Array[] = [];
  const tileCount = view.getInt32(8, true);
  let tileHeaderOffset = 92;
  for (let i = 0; i < tileCount; i++) {
    const tileDataSize = view.getInt32(tileHeaderOffset + 4, true);
    const tileDataOffset = tileHeaderOffset + 8;
    compressedLayers.push(
      new Uint8Array(tset.slice(tileDataOffset, tileDataOffset + tileDataSize)),
    );
    tileHeaderOffset = tileDataOffset + tileDataSize;
  }
  Raw.NavMeshExporter.freeNavMeshExport(exported);
  generated.tileCache.destroy();
  generated.navMesh.destroy();

  const tileCache = new TileCache();
  const navMesh = new NavMesh();
  const allocator = new Raw.RecastLinearAllocator(32000);
  const compressor = new Raw.RecastFastLZCompressor();
  const meshProcess = createDefaultTileCacheMeshProcess();
  const origin = [-2.5, -0.05, -2.5] as const;

  expect(
    tileCache.init(
      DetourTileCacheParams.create({
        orig: origin,
        cs: 0.2,
        ch: 0.2,
        width: 32,
        height: 32,
        walkableHeight: 0.4,
        walkableRadius: 0.1,
        walkableClimb: 0.4,
        maxSimplificationError: 1.3,
        maxTiles: 4,
        maxObstacles: 128,
      }),
      allocator,
      compressor,
      meshProcess,
    ),
  ).toBe(true);
  expect(
    navMesh.initTiled(
      NavMeshParams.create({
        orig: vec3.fromArray(origin),
        tileWidth: 6.4,
        tileHeight: 6.4,
        maxTiles: 4,
        maxPolys: 1 << 20,
      }),
    ),
  ).toBe(true);

  for (const compressedLayer of compressedLayers) {
    const source = new TileCacheData();
    source.copy(compressedLayer);
    const added = tileCache.addTileCopy(source);
    expect(statusSucceed(added.status)).toBe(true);
    source.destroy();
    compressedLayer.fill(0);
  }

  expect(statusSucceed(tileCache.buildNavMeshTilesAt(0, 0, navMesh))).toBe(
    true,
  );

  const query = new NavMeshQuery(navMesh);
  const start = query.findClosestPoint({ x: -2, y: 0, z: -2 }).point;
  const end = query.findClosestPoint({ x: 2, y: 0, z: 2 }).point;
  expect(query.computePath(start, end).path.length).toBeGreaterThan(1);

  const imported = importTileCache(
    serializedTileCache,
    createDefaultTileCacheMeshProcess(),
  );
  serializedTileCache.fill(0);
  const importedQuery = new NavMeshQuery(imported.navMesh);
  const importedStart = importedQuery.findClosestPoint({
    x: -2,
    y: 0,
    z: -2,
  }).point;
  const importedEnd = importedQuery.findClosestPoint({
    x: 2,
    y: 0,
    z: 2,
  }).point;
  expect(
    importedQuery.computePath(importedStart, importedEnd).path.length,
  ).toBeGreaterThan(1);

  query.destroy();
  importedQuery.destroy();
  imported.tileCache.destroy();
  imported.navMesh.destroy();
  tileCache.destroy();
  navMesh.destroy();
});
