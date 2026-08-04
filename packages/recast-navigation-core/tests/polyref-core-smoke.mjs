import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const [mode, corePath, wasmPath, generatorsPath] = process.argv.slice(2);

assert.ok(mode === '32' || mode === '64', `unexpected mode: ${mode}`);
assert.ok(corePath, 'missing core module path');
assert.ok(wasmPath, 'missing generated WASM module path');
assert.ok(generatorsPath, 'missing generators module path');

const core = await import(pathToFileURL(corePath));
const { default: createRecast } = await import(pathToFileURL(wasmPath));
const generators = await import(pathToFileURL(generatorsPath));

await core.init(createRecast);

assert.equal(core.uses64BitPolyRefs(), mode === '64');
assert.equal(typeof core.toWasmPolyRef(0), mode === '64' ? 'bigint' : 'number');

const navMesh = new core.NavMesh();
const params = core.NavMeshParams.create({
  orig: { x: 0, y: 0, z: 0 },
  tileWidth: 25.6,
  tileHeight: 25.6,
  maxTiles: mode === '64' ? 131072 : 1024,
  maxPolys: mode === '64' ? 256 : 2048,
});

assert.equal(navMesh.initTiled(params), true);

const refs = new core.PolyRefArray();

if (mode === '64') {
  const maximumUnsignedRef = (1n << 64n) - 1n;
  const encoded = navMesh.encodePolyId(65535, 268435455, 1048575);

  assert.equal(typeof encoded, 'bigint');
  assert.equal(encoded, maximumUnsignedRef);
  assert.deepEqual(navMesh.decodePolyId(encoded), {
    tileSalt: 65535,
    tileIndex: 268435455,
    tilePolygonIndex: 1048575,
  });

  refs.copy([1n << 40n, 1n << 63n, maximumUnsignedRef]);
  assert.deepEqual(refs.toArray(), [1n << 40n, 1n << 63n, maximumUnsignedRef]);
  assert.equal(core.nullPolyRef(), 0n);
} else {
  const encoded = navMesh.encodePolyId(2047, 1023, 2047);

  assert.equal(typeof encoded, 'number');
  assert.equal(encoded >>> 0, 0xffffffff);
  assert.deepEqual(navMesh.decodePolyId(encoded), {
    tileSalt: 2047,
    tileIndex: 1023,
    tilePolygonIndex: 2047,
  });

  refs.copy([1, 0x80000000, 0xffffffff]);
  assert.deepEqual(refs.toArray(), [1, 0x80000000, 0xffffffff]);
  assert.equal(core.nullPolyRef(), 0);
}

refs.destroy();
core.Raw.destroy(params.raw);
core.Raw.destroy(navMesh.raw);

const planePositions = [
  -2.5, -0.05, -2.5, 2.5, -0.05, -2.5, 2.5, 0.05, -2.5, -2.5, 0.05, -2.5, -2.5,
  -0.05, 2.5, 2.5, -0.05, 2.5, 2.5, 0.05, 2.5, -2.5, 0.05, 2.5,
];
const planeIndices = [
  3, 7, 6, 3, 6, 2, 0, 1, 5, 0, 5, 4, 4, 5, 6, 4, 6, 7, 0, 3, 2, 0, 2, 1, 0, 4,
  7, 0, 7, 3, 1, 2, 6, 1, 6, 5,
];
const generated = generators.generateSoloNavMesh(planePositions, planeIndices);

assert.equal(generated.success, true);

const query = new core.NavMeshQuery(generated.navMesh);
const start = query.findNearestPoly({ x: -1, y: 0, z: -1 });
const end = query.findNearestPoly({ x: 1, y: 0, z: 1 });

assert.equal(start.success, true);
assert.equal(end.success, true);
assert.equal(typeof start.nearestRef, mode === '64' ? 'bigint' : 'number');
assert.equal(typeof end.nearestRef, mode === '64' ? 'bigint' : 'number');

const corridor = query.findPath(
  start.nearestRef,
  end.nearestRef,
  start.nearestPoint,
  end.nearestPoint,
);

assert.equal(corridor.success, true);
assert.ok(corridor.polys.size > 0);
assert.ok(
  corridor.polys
    .toArray()
    .every((ref) => typeof ref === (mode === '64' ? 'bigint' : 'number')),
);

const straight = query.findStraightPath(
  start.nearestPoint,
  end.nearestPoint,
  corridor.polys,
);

assert.equal(straight.success, true);
assert.ok(straight.straightPathCount > 0);
assert.ok(
  straight.straightPathRefs
    .toArray()
    .slice(0, straight.straightPathCount)
    .every((ref) => typeof ref === (mode === '64' ? 'bigint' : 'number')),
);

const raycast = query.raycast(
  start.nearestRef,
  start.nearestPoint,
  end.nearestPoint,
);

assert.equal(raycast.success, true);
assert.ok(
  raycast.path.every(
    (ref) => typeof ref === (mode === '64' ? 'bigint' : 'number'),
  ),
);

corridor.polys.destroy();
straight.straightPath.destroy();
straight.straightPathFlags.destroy();
straight.straightPathRefs.destroy();
query.destroy();
core.Raw.destroy(generated.navMesh.raw);

const tileData = generators.generateSoloNavMeshData(
  planePositions,
  planeIndices,
);

assert.equal(tileData.success, true);

const tiledNavMesh = new core.NavMesh();
const tiledParams = core.NavMeshParams.create({
  orig: { x: -2.5, y: -0.05, z: -2.5 },
  tileWidth: 5,
  tileHeight: 5,
  maxTiles: 1,
  maxPolys: 256,
});

assert.equal(tiledNavMesh.initTiled(tiledParams), true);

const addedTile = tiledNavMesh.addTile(
  tileData.navMeshData,
  core.Detour.DT_TILE_FREE_DATA,
  0,
);

assert.equal(core.statusSucceed(addedTile.status), true);
assert.equal(typeof addedTile.tileRef, mode === '64' ? 'bigint' : 'number');

const tiledQuery = new core.NavMeshQuery(tiledNavMesh);
const tiledNearest = tiledQuery.findNearestPoly({ x: 0, y: 0, z: 0 });

assert.equal(tiledNearest.success, true);
assert.equal(
  typeof tiledNearest.nearestRef,
  mode === '64' ? 'bigint' : 'number',
);

tiledQuery.destroy();
core.Raw.destroy(tiledParams.raw);
core.Raw.destroy(tiledNavMesh.raw);

console.log(`DT_POLYREF${mode} core API smoke PASS`);
