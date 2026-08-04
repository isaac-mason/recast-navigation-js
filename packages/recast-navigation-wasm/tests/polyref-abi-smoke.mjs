import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const [mode, modulePath] = process.argv.slice(2);
assert.ok(mode === '32' || mode === '64', `unexpected mode: ${mode}`);
assert.ok(modulePath, 'missing generated module path');

const { default: createRecast } = await import(pathToFileURL(modulePath));
const Recast = await createRecast();
const navMesh = new Recast.NavMesh();
const params = new Recast.dtNavMeshParams();

params.orig = [0, 0, 0];
params.tileWidth = 25.6;
params.tileHeight = 25.6;

if (mode === '64') {
  params.maxTiles = 131072;
  params.maxPolys = 256;
  assert.equal(navMesh.initTiled(params), true);

  const maximumUnsignedRef = (1n << 64n) - 1n;
  const encoded = navMesh.encodePolyId(65535, 268435455, 1048575);
  assert.equal(typeof encoded, 'bigint');
  assert.equal(BigInt.asUintN(64, encoded), maximumUnsignedRef);

  const salt = new Recast.UnsignedIntRef();
  const tile = new Recast.UnsignedIntRef();
  const polygon = new Recast.UnsignedIntRef();
  navMesh.decodePolyId(BigInt.asIntN(64, maximumUnsignedRef), salt, tile, polygon);
  assert.deepEqual(
    [salt.value, tile.value, polygon.value],
    [65535, 268435455, 1048575],
  );

  const scalar = new Recast.UnsignedLongLongRef();
  scalar.value = BigInt.asIntN(64, 0xfedcba9876543210n);
  assert.equal(BigInt.asUintN(64, scalar.value), 0xfedcba9876543210n);

  const refs = new Recast.UnsignedLongLongArray();
  refs.resize(3);
  refs.set(0, 1n << 40n);
  refs.set(1, BigInt.asIntN(64, 1n << 63n));
  refs.set(2, -1n);
  assert.deepEqual(
    [0, 1, 2].map((index) => BigInt.asUintN(64, refs.get(index))),
    [1n << 40n, 1n << 63n, maximumUnsignedRef],
  );
} else {
  params.maxTiles = 1024;
  params.maxPolys = 2048;
  assert.equal(navMesh.initTiled(params), true);

  const encoded = navMesh.encodePolyId(2047, 1023, 2047);
  assert.equal(typeof encoded, 'number');
  assert.equal(encoded >>> 0, 0xffffffff);

  const salt = new Recast.UnsignedIntRef();
  const tile = new Recast.UnsignedIntRef();
  const polygon = new Recast.UnsignedIntRef();
  navMesh.decodePolyId(encoded, salt, tile, polygon);
  assert.deepEqual([salt.value, tile.value, polygon.value], [2047, 1023, 2047]);
}

console.log(`DT_POLYREF${mode} WASM ABI smoke PASS`);
