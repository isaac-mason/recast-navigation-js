import { DetourMeshTile, DetourOffMeshConnection, dtPoly } from './detour';
import { finalizer } from './finalizer';
import { Raw } from './raw';
import type R from './raw-module';
import { Vector3, array, vec3 } from './utils';

export class NavMeshGetTilesAtResult {
  raw: R.NavMeshGetTilesAtResult;

  constructor(raw: R.NavMeshGetTilesAtResult) {
    this.raw = raw;

    finalizer.register(this);
  }

  tiles(index: number): DetourMeshTile {
    return new DetourMeshTile(this.raw.get_tiles(index));
  }

  tileCount(): number {
    return this.raw.tileCount;
  }

  destroy(): void {
    finalizer.unregister(this);
    Raw.Module.destroy(this.raw);
  }
}

export class NavMeshRemoveTileResult {
  raw: R.NavMeshRemoveTileResult;

  constructor(raw: R.NavMeshRemoveTileResult) {
    this.raw = raw;

    finalizer.register(this);
  }

  data(): number[] {
    return array((i) => this.raw.get_data(i), this.raw.dataSize);
  }

  dataSize(): number {
    return this.raw.dataSize;
  }

  destroy(): void {
    finalizer.unregister(this);
    Raw.Module.destroy(this.raw);
  }
}

export class NavMeshCalcTileLocResult {
  raw: R.NavMeshCalcTileLocResult;

  constructor(raw: R.NavMeshCalcTileLocResult) {
    this.raw = raw;

    finalizer.register(this);
  }

  tileX(): number {
    return this.raw.tileX;
  }

  tileY(): number {
    return this.raw.tileY;
  }

  destroy(): void {
    finalizer.unregister(this);
    Raw.Module.destroy(this.raw);
  }
}

export class NavMeshGetTileAndPolyByRefResult {
  raw: R.NavMeshGetTileAndPolyByRefResult;

  constructor(raw: R.NavMeshGetTileAndPolyByRefResult) {
    this.raw = raw;

    finalizer.register(this);
  }

  tile(): DetourMeshTile {
    return new DetourMeshTile(this.raw.tile);
  }

  poly(): dtPoly {
    return new dtPoly(this.raw.poly);
  }

  status(): number {
    return this.raw.status;
  }

  destroy(): void {
    finalizer.unregister(this);
    Raw.Module.destroy(this.raw);
  }
}

export class NavMeshStoreTileStateResult {
  raw: R.NavMeshStoreTileStateResult;

  constructor(raw: R.NavMeshStoreTileStateResult) {
    this.raw = raw;

    finalizer.register(this);
  }

  data(): number[] {
    return array((i) => this.raw.get_data(i), this.raw.dataSize);
  }

  dataSize(): number {
    return this.raw.dataSize;
  }

  destroy(): void {
    finalizer.unregister(this);
    Raw.Module.destroy(this.raw);
  }
}

export type NavMeshParams = {
  orig: Vector3;
  tileWidth: number;
  tileHeight: number;
  maxTiles: number;
  maxPolys: number;
};

export class NavMesh {
  raw: R.NavMesh;

  constructor(raw?: R.NavMesh) {
    this.raw = raw ?? new Raw.Module.NavMesh();
    finalizer.register(this);
  }

  /**
   * Initializes the NavMesh for use with a single tile.
   * @param navMeshData the nav mesh data
   * @returns the status of the operation
   */
  initSolo(navMeshData: R.NavMeshData): boolean {
    return this.raw.initSolo(navMeshData);
  }

  /**
   * Initializes the NavMesh for use with multiple tiles.
   * @param params parameters for the NavMesh
   * @returns the status of the operation
   */
  initTiled(params: R.dtNavMeshParams): boolean {
    return this.raw.initTiled(params);
  }

  /**
   * Adds a tile to the NavMesh.
   * @param navMeshData the nav mesh data
   * @param flags the flags to use when building the nav mesh
   * @param lastRef
   * @returns the status of the operation and the reference of the added tile
   */
  addTile(navMeshData: R.NavMeshData, flags: number, lastRef: number) {
    const tileRef = new Raw.UnsignedIntRef();

    const status = this.raw.addTile(navMeshData, flags, lastRef, tileRef);

    return {
      status,
      tileRef: tileRef.value,
    };
  }

  /**
   * Removes a tile from the NavMesh
   * @param ref the tile ref
   * @returns the nav mesh data, so it can be added back later
   */
  removeTile(ref: number): NavMeshRemoveTileResult {
    return new NavMeshRemoveTileResult(this.raw.removeTile(ref));
  }

  /**
   * Calculates the tile grid location for the specified world position.
   * @param pos The world position for the query. [(x, y, z)]
   * @returns
   */
  calcTileLoc(pos: Vector3): NavMeshCalcTileLocResult {
    return new NavMeshCalcTileLocResult(
      this.raw.calcTileLoc(vec3.toArray(pos))
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
  getTileRefAt(x: number, y: number, layer: number): number {
    return this.raw.getTileRefAt(x, y, layer);
  }

  /**
   * Gets the tile reference for the specified tile.
   * @param tile
   * @returns
   */
  getTileRef(tile: DetourMeshTile): number {
    return this.raw.getTileRef(tile.raw);
  }

  /**
   * Gets the tile for the specified tile reference.
   * @param ref The tile reference of the tile to retrieve.
   * @returns The tile for the specified reference, or null if the reference is invalid.
   */
  getTileByRef(ref: number): DetourMeshTile | null {
    const tile = this.raw.getTileByRef(ref);

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
  getTileAndPolyByRef(ref: number): NavMeshGetTileAndPolyByRefResult {
    return new NavMeshGetTileAndPolyByRefResult(
      this.raw.getTileAndPolyByRef(ref)
    );
  }

  /**
   * Gets the tile and polygon for the specified polygon reference.
   * @param ref A known valid reference for a polygon.
   * @returns
   */
  getTileAndPolyByRefUnsafe(ref: number): NavMeshGetTileAndPolyByRefResult {
    return new NavMeshGetTileAndPolyByRefResult(
      this.raw.getTileAndPolyByRefUnsafe(ref)
    );
  }

  /**
   * Checks the validity of a polygon reference.
   * @param ref
   * @returns
   */
  isValidPolyRef(ref: number): boolean {
    return this.raw.isValidPolyRef(ref);
  }

  /**
   * Gets the polygon reference for the tile's base polygon.
   * @param tile
   * @returns
   */
  getPolyRefBase(tile: DetourMeshTile): number {
    return this.raw.getPolyRefBase(tile.raw);
  }

  /**
   * Gets the endpoints for an off-mesh connection, ordered by "direction of travel".
   * @param prevRef The reference of the polygon before the connection.
   * @param polyRef The reference of the off-mesh connection polygon.
   * @returns
   */
  getOffMeshConnectionPolyEndPoints(prevRef: number, polyRef: number) {
    const start = new Raw.Vec3();
    const end = new Raw.Vec3();

    const status = this.raw.getOffMeshConnectionPolyEndPoints(
      prevRef,
      polyRef,
      start,
      end
    );

    return {
      status,
      start: vec3.fromRaw(start),
      end: vec3.fromRaw(end),
    };
  }

  /**
   * Gets the specified off-mesh connection.
   * @param ref The polygon reference of the off-mesh connection.
   * @returns
   */
  getOffMeshConnectionByRef(ref: number): DetourOffMeshConnection {
    return new DetourOffMeshConnection(this.raw.getOffMeshConnectionByRef(ref));
  }

  /**
   * Sets the user defined flags for the specified polygon.
   * @param ref The polygon reference.
   * @param flags The new flags for the polygon.
   */
  setPolyFlags(ref: number, flags: number): number {
    return this.raw.setPolyFlags(ref, flags);
  }

  /**
   * Gets the user defined flags for the specified polygon.
   * @param ref The polygon reference.
   * @returns
   */
  getPolyFlags(ref: number) {
    const flags = new Raw.UnsignedShortRef();

    const status = this.raw.getPolyFlags(ref, flags);

    return {
      status,
      flags: flags.value,
    };
  }

  /**
   * Sets the user defined area for the specified polygon.
   * @param ref The polygon reference.
   * @param flags The new flags for the polygon.
   */
  setPolyArea(ref: number, area: number): number {
    return this.raw.setPolyArea(ref, area);
  }

  /**
   * Gets the user defined area for the specified polygon.
   * @param ref The polygon reference.
   * @returns
   */
  getPolyArea(ref: number) {
    const area = new Raw.UnsignedCharRef();

    const status = this.raw.getPolyArea(ref, area);

    return {
      status,
      area: area.value,
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
    maxDataSize: number
  ): NavMeshStoreTileStateResult {
    return new NavMeshStoreTileStateResult(
      this.raw.storeTileState(tile.raw, maxDataSize)
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
    maxDataSize: number
  ): number {
    return this.raw.restoreTileState(tile.raw, data, maxDataSize);
  }

  /**
   * Returns a triangle mesh that can be used to visualize the NavMesh.
   */
  getDebugNavMesh(): [positions: number[], indices: number[]] {
    const positions: number[] = [];
    const indices: number[] = [];
    let tri = 0;

    const maxTiles = this.getMaxTiles();

    for (let tileIndex = 0; tileIndex < maxTiles; tileIndex++) {
      const tile = this.getTile(tileIndex);
      const tileHeader = tile.header();

      if (!tileHeader) continue;

      const tilePolyCount = tileHeader.polyCount();

      for (
        let tilePolyIndex = 0;
        tilePolyIndex < tilePolyCount;
        ++tilePolyIndex
      ) {
        const poly = tile.polys(tilePolyIndex);

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
              tile.detailTris(detailTrisBaseIndex + trianglePoint) <
              polyVertCount
            ) {
              const tileVertsBaseIndex =
                poly.verts(
                  tile.detailTris(detailTrisBaseIndex + trianglePoint)
                ) * 3;

              positions.push(
                tile.verts(tileVertsBaseIndex),
                tile.verts(tileVertsBaseIndex + 1),
                tile.verts(tileVertsBaseIndex + 2)
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
                tile.detailVerts(tileVertsBaseIndex + 2)
              );
            }

            indices.push(tri++);
          }
        }
      }
    }

    return [positions, indices];
  }

  /**
   * Destroys the NavMesh.
   */
  destroy(): void {
    this.raw.destroy();
    finalizer.unregister(this);
    Raw.Module.destroy(this.raw);
  }
}
