import type { UnsignedCharArray } from './arrays';
import {
  DetourMeshTile,
  DetourOffMeshConnection,
  DetourPoly,
  statusSucceed,
} from './detour';
import { Detour, Raw, type RawModule } from './raw';
import {
  type PolyRef,
  createPolyRefRef,
  fromWasmPolyRef,
  readPolyRefRef,
  toWasmPolyRef,
} from './poly-ref';
import { type Vector3, array, vec3 } from './utils';

export class NavMeshGetTilesAtResult {
  raw: RawModule.NavMeshGetTilesAtResult;

  constructor(raw: RawModule.NavMeshGetTilesAtResult) {
    this.raw = raw;
  }

  tiles(index: number): DetourMeshTile {
    return new DetourMeshTile(this.raw.get_tiles(index));
  }

  tileCount(): number {
    return this.raw.tileCount;
  }
}

export class NavMeshRemoveTileResult {
  raw: RawModule.NavMeshRemoveTileResult;

  constructor(raw: RawModule.NavMeshRemoveTileResult) {
    this.raw = raw;
  }

  data(): number[] {
    return array((i) => this.raw.get_data(i), this.raw.dataSize);
  }

  dataSize(): number {
    return this.raw.dataSize;
  }
}

export class NavMeshCalcTileLocResult {
  raw: RawModule.NavMeshCalcTileLocResult;

  constructor(raw: RawModule.NavMeshCalcTileLocResult) {
    this.raw = raw;
  }

  tileX(): number {
    return this.raw.tileX;
  }

  tileY(): number {
    return this.raw.tileY;
  }
}

export class NavMeshStoreTileStateResult {
  raw: RawModule.NavMeshStoreTileStateResult;

  constructor(raw: RawModule.NavMeshStoreTileStateResult) {
    this.raw = raw;
  }

  data(): number[] {
    return array((i) => this.raw.get_data(i), this.raw.dataSize);
  }

  dataSize(): number {
    return this.raw.dataSize;
  }
}

export type NavMeshDecodePolyIdResult = {
  /**
   * The tile's salt value.
   */
  tileSalt: number;

  /**
   * The index of the tile. `it` in the C++ api.
   */
  tileIndex: number;

  /**
   * The index of the polygon within the tile. `ip` in the C++ api.
   */
  tilePolygonIndex: number;
};

export type NavMeshParamsType = {
  orig: Vector3;
  tileWidth: number;
  tileHeight: number;
  maxTiles: number;
  maxPolys: number;
};

export class NavMeshParams {
  constructor(public raw: RawModule.dtNavMeshParams) {}

  static create(params: NavMeshParamsType): NavMeshParams {
    const raw = new Raw.Module.dtNavMeshParams();

    raw.set_orig(0, params.orig.x);
    raw.set_orig(1, params.orig.y);
    raw.set_orig(2, params.orig.z);

    raw.tileWidth = params.tileWidth;
    raw.tileHeight = params.tileHeight;
    raw.maxTiles = params.maxTiles;
    raw.maxPolys = params.maxPolys;

    return new NavMeshParams(raw);
  }

  clone(): NavMeshParams {
    return NavMeshParams.create({
      orig: {
        x: this.raw.get_orig(0),
        y: this.raw.get_orig(1),
        z: this.raw.get_orig(2),
      },
      tileWidth: this.raw.tileWidth,
      tileHeight: this.raw.tileHeight,
      maxTiles: this.raw.maxTiles,
      maxPolys: this.raw.maxPolys,
    });
  }
}

export class NavMesh {
  raw: RawModule.NavMesh;

  /**
   * Constructs a new NavMesh
   */
  constructor();

  /**
   * Creates a wrapper around a raw NavMesh object
   * @param raw raw object
   */
  constructor(raw: RawModule.NavMesh);

  constructor(raw?: RawModule.NavMesh) {
    this.raw = raw ?? new Raw.Module.NavMesh();
  }

  /**
   * Initializes the NavMesh for use with a single tile.
   * @param navMeshData the nav mesh data
   * @returns the status of the operation
   */
  initSolo(navMeshData: UnsignedCharArray): boolean {
    return this.raw.initSolo(navMeshData.raw);
  }

  /**
   * Initializes the NavMesh for use with multiple tiles.
   * @param params parameters for the NavMesh
   * @returns the status of the operation
   */
  initTiled(params: NavMeshParams): boolean {
    return this.raw.initTiled(params.raw);
  }

  /**
   * Adds a tile to the NavMesh.
   * @param navMeshData the nav mesh data
   * @param flags the flags to use when building the nav mesh
   * @param lastRef
   * @returns the status of the operation and the reference of the added tile
   */
  addTile(navMeshData: UnsignedCharArray, flags: number, lastRef: PolyRef) {
    const tileRefRaw = createPolyRefRef();

    const status = (this.raw as any).addTile(
      navMeshData.raw,
      flags,
      toWasmPolyRef(lastRef),
      tileRefRaw,
    );

    const tileRef = readPolyRefRef(tileRefRaw);
    Raw.destroy(tileRefRaw);

    return {
      status,
      tileRef,
    };
  }

  /**
   * Decodes a standard polygon reference.
   * @param polyRef The polygon reference to decode
   * @returns the decoded polygon reference
   */
  decodePolyId(polyRef: PolyRef): NavMeshDecodePolyIdResult {
    const saltRef = new Raw.UnsignedIntRef();
    const itRef = new Raw.UnsignedIntRef();
    const ipRef = new Raw.UnsignedIntRef();

    (this.raw as any).decodePolyId(
      toWasmPolyRef(polyRef),
      saltRef,
      itRef,
      ipRef,
    );

    const tileSalt = saltRef.value;
    Raw.destroy(saltRef);

    const tileIndex = itRef.value;
    Raw.destroy(itRef);

    const tilePolygonIndex = ipRef.value;
    Raw.destroy(ipRef);

    return {
      tileSalt,
      tileIndex,
      tilePolygonIndex,
    };
  }

  /**
   * Derives a standard polygon reference.
   * @param salt The tile's salt value.
   * @param tileIndex The index of the tile. `it` in the C++ api.
   * @param tilePolygonIndex The index of the polygon within the tile. `ip` in the C++ api.
   * @returns the derived polygon reference
   */
  encodePolyId(
    salt: number,
    tileIndex: number,
    tilePolygonIndex: number,
  ): PolyRef {
    return fromWasmPolyRef(
      (this.raw as any).encodePolyId(salt, tileIndex, tilePolygonIndex),
    );
  }

  /**
   * Removes a tile from the NavMesh
   * @param ref the tile ref
   * @returns the nav mesh data, so it can be added back later
   */
  removeTile(ref: PolyRef): NavMeshRemoveTileResult {
    return new NavMeshRemoveTileResult(
      (this.raw as any).removeTile(toWasmPolyRef(ref)),
    );
  }

  /**
   * Calculates the tile grid location for the specified world position.
   * @param pos The world position for the query. [(x, y, z)]
   * @returns
   */
  calcTileLoc(pos: Vector3): NavMeshCalcTileLocResult {
    return new NavMeshCalcTileLocResult(
      this.raw.calcTileLoc(vec3.toArray(pos)),
    );
  }

  /**
   * Gets the tile at the specified grid location.
   * @param x The tile's x-location. (x, y, layer)
   * @param y The tile's y-location. (x, y, layer)
   * @param layer The tile's layer. (x, y, layer)
   * @returns The tile, or null if the tile does not exist.
   */
  getTileAt(x: number, y: number, layer: number): DetourMeshTile | null {
    const tile = this.raw.getTileAt(x, y, layer);

    return !Raw.isNull(tile) ? new DetourMeshTile(tile) : null;
  }

  /**
   * Gets all tiles at the specified grid location. (All layers.)
   * @param x The tile's x-location. (x, y)
   * @param y The tile's y-location. (x, y)
   * @param maxTiles The maximum tiles the tiles parameter can hold.
   */
  getTilesAt(x: number, y: number, maxTiles: number): NavMeshGetTilesAtResult {
    return new NavMeshGetTilesAtResult(this.raw.getTilesAt(x, y, maxTiles));
  }

  /**
   * Gets the tile reference for the tile at specified grid location.
   * @param x The tile's x-location. (x, y, layer)
   * @param y The tile's y-location. (x, y, layer)
   * @param layer The tile's layer. (x, y, layer)
   * @returns The tile reference of the tile, or 0 if there is none.
   */
  getTileRefAt(x: number, y: number, layer: number): PolyRef {
    return fromWasmPolyRef((this.raw as any).getTileRefAt(x, y, layer));
  }

  /**
   * Gets the tile reference for the specified tile.
   * @param tile
   * @returns
   */
  getTileRef(tile: DetourMeshTile): PolyRef {
    return fromWasmPolyRef((this.raw as any).getTileRef(tile.raw));
  }

  /**
   * Gets the tile for the specified tile reference.
   * @param ref The tile reference of the tile to retrieve.
   * @returns The tile for the specified reference, or null if the reference is invalid.
   */
  getTileByRef(ref: PolyRef): DetourMeshTile | null {
    const tile = (this.raw as any).getTileByRef(toWasmPolyRef(ref));

    return !Raw.isNull(tile) ? new DetourMeshTile(tile) : null;
  }

  /**
   * Returns the maximum number of tiles supported by the navigation mesh.
   */
  getMaxTiles(): number {
    return this.raw.getMaxTiles();
  }

  /**
   * Gets the tile at the specified index.
   * @param i the tile index. [Limit: 0 >= index < #getMaxTiles()]
   * @returns
   */
  getTile(i: number): DetourMeshTile {
    return new DetourMeshTile(this.raw.getTile(i));
  }

  /**
   * Gets the tile and polygon for the specified polygon reference.
   * @param ref The reference for the a polygon.
   * @returns
   */
  getTileAndPolyByRef(ref: PolyRef) {
    const result = (this.raw as any).getTileAndPolyByRef(toWasmPolyRef(ref));

    const tile = new DetourMeshTile(result.tile);
    const poly = new DetourPoly(result.poly);

    return {
      success: statusSucceed(result.status),
      status: result.status,
      tile,
      poly,
    };
  }

  /**
   * Gets the tile and polygon for the specified polygon reference.
   * @param ref A known valid reference for a polygon.
   * @returns
   */
  getTileAndPolyByRefUnsafe(ref: PolyRef) {
    const result = (this.raw as any).getTileAndPolyByRefUnsafe(
      toWasmPolyRef(ref),
    );

    const tile = new DetourMeshTile(result.tile);
    const poly = new DetourPoly(result.poly);

    return {
      tile,
      poly,
    };
  }

  /**
   * Checks the validity of a polygon reference.
   * @param ref
   * @returns
   */
  isValidPolyRef(ref: PolyRef): boolean {
    return (this.raw as any).isValidPolyRef(toWasmPolyRef(ref));
  }

  /**
   * Gets the polygon reference for the tile's base polygon.
   * @param tile
   * @returns
   */
  getPolyRefBase(tile: DetourMeshTile): PolyRef {
    return fromWasmPolyRef((this.raw as any).getPolyRefBase(tile.raw));
  }

  /**
   * Gets the endpoints for an off-mesh connection, ordered by "direction of travel".
   * @param prevRef The reference of the polygon before the connection.
   * @param polyRef The reference of the off-mesh connection polygon.
   * @returns
   */
  getOffMeshConnectionPolyEndPoints(prevRef: PolyRef, polyRef: PolyRef) {
    const startRaw = new Raw.Vec3();
    const endRaw = new Raw.Vec3();

    const status = (this.raw as any).getOffMeshConnectionPolyEndPoints(
      toWasmPolyRef(prevRef),
      toWasmPolyRef(polyRef),
      startRaw,
      endRaw,
    );

    const start = vec3.fromRaw(startRaw);
    Raw.destroy(startRaw);

    const end = vec3.fromRaw(endRaw);
    Raw.destroy(endRaw);

    return {
      success: statusSucceed(status),
      status,
      start,
      end,
    };
  }

  /**
   * Gets the specified off-mesh connection.
   * @param ref The polygon reference of the off-mesh connection.
   * @returns
   */
  getOffMeshConnectionByRef(ref: PolyRef): DetourOffMeshConnection {
    return new DetourOffMeshConnection(
      (this.raw as any).getOffMeshConnectionByRef(toWasmPolyRef(ref)),
    );
  }

  /**
   * Sets the user defined flags for the specified polygon.
   * @param ref The polygon reference.
   * @param flags The new flags for the polygon.
   */
  setPolyFlags(ref: PolyRef, flags: number): number {
    return (this.raw as any).setPolyFlags(toWasmPolyRef(ref), flags);
  }

  /**
   * Gets the user defined flags for the specified polygon.
   * @param ref The polygon reference.
   * @returns
   */
  getPolyFlags(ref: PolyRef) {
    const flagsRaw = new Raw.UnsignedShortRef();

    const status = (this.raw as any).getPolyFlags(toWasmPolyRef(ref), flagsRaw);

    const flags = flagsRaw.value;
    Raw.destroy(flagsRaw);

    return {
      status,
      flags,
    };
  }

  /**
   * Sets the user defined area for the specified polygon.
   * @param ref The polygon reference.
   * @param flags The new flags for the polygon.
   */
  setPolyArea(ref: PolyRef, area: number): number {
    return (this.raw as any).setPolyArea(toWasmPolyRef(ref), area);
  }

  /**
   * Gets the user defined area for the specified polygon.
   * @param ref The polygon reference.
   * @returns
   */
  getPolyArea(ref: PolyRef) {
    const areaRaw = new Raw.UnsignedCharRef();

    const status = (this.raw as any).getPolyArea(toWasmPolyRef(ref), areaRaw);

    const area = areaRaw.value;
    Raw.destroy(areaRaw);

    return {
      status,
      area,
    };
  }

  /**
   * Gets the size of the buffer required by #storeTileState to store the specified tile's state.
   * @param tile
   * @returns The size of the buffer required to store the state.
   */
  getTileStateSize(tile: DetourMeshTile): number {
    return this.raw.getTileStateSize(tile.raw);
  }

  /**
   * Stores the non-structural state of the tile in the specified buffer. (Flags, area ids, etc.)
   * @param tile The tile.
   * @param maxDataSize The size of the data buffer. [Limit: >= #getTileStateSize]
   * @returns
   */
  storeTileState(
    tile: DetourMeshTile,
    maxDataSize: number,
  ): NavMeshStoreTileStateResult {
    return new NavMeshStoreTileStateResult(
      this.raw.storeTileState(tile.raw, maxDataSize),
    );
  }

  /**
   * Restores the state of the tile.
   * @param tile The tile.
   * @param data The new state. (Obtained from @see storeTileState)
   * @param maxDataSize The size of the state within the data buffer.
   * @returns
   */
  restoreTileState(
    tile: DetourMeshTile,
    data: number[],
    maxDataSize: number,
  ): number {
    return this.raw.restoreTileState(tile.raw, data, maxDataSize);
  }

  /**
   * Destroys the NavMesh.
   */
  destroy(): void {
    this.raw.destroy();
    Raw.Module.destroy(this.raw);
  }
}

/**
 * Gets the positions and indices of the nav mesh.
 * @param navMesh the nav mesh
 * @param flags poly flags to filter by, defaults to undefined to include all polys
 * @returns the positions and indices of the nav mesh
 */
export const getNavMeshPositionsAndIndices = (
  navMesh: NavMesh,
  flags?: number,
): [positions: number[], indices: number[]] => {
  const positions: number[] = [];
  const indices: number[] = [];
  let tri = 0;

  const maxTiles = navMesh.getMaxTiles();

  for (let tileIndex = 0; tileIndex < maxTiles; tileIndex++) {
    const tile = navMesh.getTile(tileIndex);
    const tileHeader = tile.header();

    if (!tileHeader) continue;

    const tilePolyCount = tileHeader.polyCount();

    for (
      let tilePolyIndex = 0;
      tilePolyIndex < tilePolyCount;
      ++tilePolyIndex
    ) {
      const poly = tile.polys(tilePolyIndex);

      if (flags !== undefined && (poly.flags() & flags) === 0) continue;

      if (poly.getType() === 1) continue;

      const polyVertCount = poly.vertCount();
      const polyDetail = tile.detailMeshes(tilePolyIndex);
      const polyDetailTriBase = polyDetail.triBase();
      const polyDetailTriCount = polyDetail.triCount();

      for (
        let polyDetailTriIndex = 0;
        polyDetailTriIndex < polyDetailTriCount;
        ++polyDetailTriIndex
      ) {
        const detailTrisBaseIndex =
          (polyDetailTriBase + polyDetailTriIndex) * 4;

        for (let trianglePoint = 0; trianglePoint < 3; ++trianglePoint) {
          if (
            tile.detailTris(detailTrisBaseIndex + trianglePoint) < polyVertCount
          ) {
            const tileVertsBaseIndex =
              poly.verts(tile.detailTris(detailTrisBaseIndex + trianglePoint)) *
              3;

            positions.push(
              tile.verts(tileVertsBaseIndex),
              tile.verts(tileVertsBaseIndex + 1),
              tile.verts(tileVertsBaseIndex + 2),
            );
          } else {
            const tileVertsBaseIndex =
              (polyDetail.vertBase() +
                tile.detailTris(detailTrisBaseIndex + trianglePoint) -
                poly.vertCount()) *
              3;

            positions.push(
              tile.detailVerts(tileVertsBaseIndex),
              tile.detailVerts(tileVertsBaseIndex + 1),
              tile.detailVerts(tileVertsBaseIndex + 2),
            );
          }

          indices.push(tri++);
        }
      }
    }
  }

  return [positions, indices];
};

/**
 * Disables all polys not connected to provided start poly refs.
 * @param navMesh the nav mesh to prune
 * @param startPolyRefs poly refs to start the flood fill from, can be retrieved with `navMeshQuery.findNearestPoly`
 *
 * @example
 * ```ts
 * const navMeshQuery = new NavMeshQuery(navMesh);
 *
 * const nearestPolyResult = navMeshQuery.findNearestPoly(point, {
 *   halfExtents: { x: 2, y: 2, z: 2 },
 * });
 *
 * if (!nearestPolyResult.success) return;
 *
 * floodFillPruneNavMesh(navMesh, [nearestPolyResult.nearestRef]);
 * ```
 */
export const floodFillPruneNavMesh = (
  navMesh: NavMesh,
  startPolyRefs: PolyRef[],
) => {
  /* find all polys connected to the nearest poly */
  const visited = new Set<PolyRef>();
  const openList: PolyRef[] = [];

  for (const startPolyRef of startPolyRefs) {
    visited.add(startPolyRef);
    openList.push(startPolyRef);
  }

  while (openList.length > 0) {
    const ref = openList.pop()!;

    // get current poly and tile
    const { poly, tile } = navMesh.getTileAndPolyByRefUnsafe(ref);

    // visit linked polys
    for (
      let i = poly.firstLink();
      i !== Detour.DT_NULL_LINK;
      i = tile.links(i).next()
    ) {
      const neiRef = tile.links(i).ref();

      // skip invalid and already visited
      if (!neiRef || visited.has(neiRef)) continue;

      // mark as visited
      visited.add(neiRef);

      // visit neighbours
      openList.push(neiRef);
    }
  }

  /* disable unvisited polys */
  for (let tileIndex = 0; tileIndex < navMesh.getMaxTiles(); tileIndex++) {
    const tile = navMesh.getTile(tileIndex);

    if (!tile || !tile.header()) continue;

    const tileHeader = tile.header()!;

    const base = navMesh.getPolyRefBase(tile);

    for (let i = 0; i < tileHeader.polyCount(); i++) {
      const ref = typeof base === 'bigint' ? base | BigInt(i) : base | i;

      if (!visited.has(ref)) {
        // set flag to 0
        // this could also be a custom 'disabled' area flag if using custom areas
        navMesh.setPolyFlags(ref, 0);
      }
    }
  }
};
