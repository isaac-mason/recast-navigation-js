import type R from '@recast-navigation/wasm';
import { array, emscripten, vec3, Vector3 } from './utils';
import { Wasm } from './wasm';

export class dtPoly {
  raw: R.dtPoly;

  constructor(raw: R.dtPoly) {
    this.raw = raw;
  }

  firstLink(): number {
    return this.raw.firstLink;
  }

  verts(index: number): number {
    return this.raw.get_verts(index);
  }

  neis(index: number): number {
    return this.raw.get_neis(index);
  }

  flags(): number {
    return this.raw.flags;
  }

  vertCount(): number {
    return this.raw.vertCount;
  }

  areaAndType(): number {
    return this.raw.get_areaAndtype();
  }

  getType(): number {
    return this.raw.getType();
  }
}

export class dtPolyDetail {
  raw: R.dtPolyDetail;

  constructor(raw: R.dtPolyDetail) {
    this.raw = raw;
  }

  vertBase(): number {
    return this.raw.vertBase;
  }

  triBase(): number {
    return this.raw.triBase;
  }

  vertCount(): number {
    return this.raw.vertCount;
  }

  triCount(): number {
    return this.raw.triCount;
  }
}

export class dtLink {
  raw: R.dtLink;

  constructor(raw: R.dtLink) {
    this.raw = raw;
  }

  ref(): number {
    return this.raw.ref;
  }

  next(): number {
    return this.raw.next;
  }

  edge(): number {
    return this.raw.edge;
  }

  side(): number {
    return this.raw.side;
  }

  bmin(): number {
    return this.raw.bmin;
  }

  bmax(): number {
    return this.raw.bmax;
  }
}

export class dtBVNode {
  raw: R.dtBVNode;

  constructor(raw: R.dtBVNode) {
    this.raw = raw;
  }

  bmin(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmin(i), 3));
  }

  bmax(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmax(i), 3));
  }

  i(): number {
    return this.raw.i;
  }
}

export class dtOffMeshConnection {
  raw: R.dtOffMeshConnection;

  constructor(raw: R.dtOffMeshConnection) {
    this.raw = raw;
  }

  pos(index: number): number {
    return this.raw.get_pos(index);
  }

  rad(): number {
    return this.raw.rad;
  }

  poly(): number {
    return this.raw.poly;
  }

  flags(): number {
    return this.raw.flags;
  }

  side(): number {
    return this.raw.side;
  }

  userId(): number {
    return this.raw.userId;
  }
}

export class dtMeshHeader {
  raw: R.dtMeshHeader;

  constructor(raw: R.dtMeshHeader) {
    this.raw = raw;
  }

  magic(): number {
    return this.raw.magic;
  }

  version(): number {
    return this.raw.version;
  }

  x(): number {
    return this.raw.x;
  }

  y(): number {
    return this.raw.y;
  }

  layer(): number {
    return this.raw.layer;
  }

  userId(): number {
    return this.raw.userId;
  }

  polyCount(): number {
    return this.raw.polyCount;
  }

  vertCount(): number {
    return this.raw.vertCount;
  }

  maxLinkCount(): number {
    return this.raw.maxLinkCount;
  }

  detailMeshCount(): number {
    return this.raw.detailMeshCount;
  }

  detailVertCount(): number {
    return this.raw.detailVertCount;
  }

  detailTriCount(): number {
    return this.raw.detailTriCount;
  }

  bvNodeCount(): number {
    return this.raw.bvNodeCount;
  }

  offMeshConCount(): number {
    return this.raw.offMeshConCount;
  }

  offMeshBase(): number {
    return this.raw.offMeshBase;
  }

  walkableHeight(): number {
    return this.raw.walkableHeight;
  }

  walkableRadius(): number {
    return this.raw.walkableRadius;
  }

  walkableClimb(): number {
    return this.raw.walkableClimb;
  }

  bmin(index: number): number {
    return this.raw.get_bmin(index);
  }

  bmax(index: number): number {
    return this.raw.get_bmax(index);
  }

  bvQuantFactor(): number {
    return this.raw.bvQuantFactor;
  }
}

export class dtMeshTile {
  raw: R.dtMeshTile;

  constructor(raw: R.dtMeshTile) {
    this.raw = raw;
  }

  salt(): number {
    return this.raw.salt;
  }

  linksFreeList(): number {
    return this.raw.linksFreeList;
  }

  header(): dtMeshHeader | null {
    return !emscripten.isNull(this.raw.header)
      ? new dtMeshHeader(this.raw.header)
      : null;
  }

  polys(index: number): dtPoly {
    return new dtPoly(this.raw.get_polys(index));
  }

  verts(index: number): number {
    return this.raw.get_verts(index);
  }

  links(index: number): dtLink {
    return new dtLink(this.raw.get_links(index));
  }

  detailMeshes(index: number): dtPolyDetail {
    return new dtPolyDetail(this.raw.get_detailMeshes(index));
  }

  detailVerts(index: number): number {
    return this.raw.get_detailVerts(index);
  }

  detailTris(index: number): number {
    return this.raw.get_detailTris(index);
  }

  bvTree(index: number): dtBVNode {
    return new dtBVNode(this.raw.get_bvTree(index));
  }

  offMeshCons(index: number): dtOffMeshConnection {
    return new dtOffMeshConnection(this.raw.get_offMeshCons(index));
  }

  data(index: number): number {
    return this.raw.get_data(index);
  }

  dataSize(): number {
    return this.raw.dataSize;
  }

  flags(): number {
    return this.raw.flags;
  }

  next(): dtMeshTile {
    return new dtMeshTile(this.raw.next);
  }
}

export class NavMeshGetTilesAtResult {
  raw: R.NavMeshGetTilesAtResult;

  constructor(raw: R.NavMeshGetTilesAtResult) {
    this.raw = raw;
  }

  tiles(index: number): dtMeshTile {
    return new dtMeshTile(this.raw.get_tiles(index));
  }

  tileCount(): number {
    return this.raw.tileCount;
  }
}

export class NavMeshAddTileResult {
  raw: R.NavMeshAddTileResult;

  constructor(raw: R.NavMeshAddTileResult) {
    this.raw = raw;
  }

  tileRef(): number {
    return this.raw.tileRef;
  }

  status(): number {
    return this.raw.status;
  }
}

export class NavMeshRemoveTileResult {
  raw: R.NavMeshRemoveTileResult;

  constructor(raw: R.NavMeshRemoveTileResult) {
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
  raw: R.NavMeshCalcTileLocResult;

  constructor(raw: R.NavMeshCalcTileLocResult) {
    this.raw = raw;
  }

  tileX(): number {
    return this.raw.tileX;
  }

  tileY(): number {
    return this.raw.tileY;
  }
}

export class NavMeshGetTileAndPolyByRefResult {
  raw: R.NavMeshGetTileAndPolyByRefResult;

  constructor(raw: R.NavMeshGetTileAndPolyByRefResult) {
    this.raw = raw;
  }

  tile(): dtMeshTile {
    return new dtMeshTile(this.raw.tile);
  }

  poly(): dtPoly {
    return new dtPoly(this.raw.poly);
  }

  status(): number {
    return this.raw.status;
  }
}

export class NavMeshGetOffMeshConnectionPolyEndPointsResult {
  raw: R.NavMeshGetOffMeshConnectionPolyEndPointsResult;

  constructor(raw: R.NavMeshGetOffMeshConnectionPolyEndPointsResult) {
    this.raw = raw;
  }

  status(): number {
    return this.raw.status;
  }

  startPos(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_startPos(i), 3));
  }

  endPos(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_endPos(i), 3));
  }
}

export class NavMeshGetPolyFlagsResult {
  raw: R.NavMeshGetPolyFlagsResult;

  constructor(raw: R.NavMeshGetPolyFlagsResult) {
    this.raw = raw;
  }

  flags(): number {
    return this.raw.flags;
  }

  status(): number {
    return this.raw.status;
  }
}

export class NavMeshGetPolyAreaResult {
  raw: R.NavMeshGetPolyAreaResult;

  constructor(raw: R.NavMeshGetPolyAreaResult) {
    this.raw = raw;
  }

  area(): number {
    return this.raw.area;
  }

  status(): number {
    return this.raw.status;
  }
}

export class NavMeshStoreTileStateResult {
  raw: R.NavMeshStoreTileStateResult;

  constructor(raw: R.NavMeshStoreTileStateResult) {
    this.raw = raw;
  }

  data(): number[] {
    return array((i) => this.raw.get_data(i), this.raw.dataSize);
  }

  dataSize(): number {
    return this.raw.dataSize;
  }
}

export class DebugNavMesh {
  raw: R.DebugNavMesh;

  positions: number[];

  indices: number[];

  constructor(debugNavMesh: R.DebugNavMesh) {
    this.raw = debugNavMesh;

    let tri: number;
    let pt: number;

    const triangleCount = debugNavMesh.getTriangleCount();

    const positions = [];
    for (tri = 0; tri < triangleCount; tri++) {
      for (pt = 0; pt < 3; pt++) {
        const point = debugNavMesh.getTriangle(tri).getPoint(pt);
        positions.push(point.x, point.y, point.z);
      }
    }

    const indices = [];
    for (tri = 0; tri < triangleCount * 3; tri++) {
      indices.push(tri);
    }

    this.positions = positions;
    this.indices = indices;
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
    this.raw = raw ?? new Wasm.Recast.NavMesh();
  }

  /**
   * Initializes the NavMesh for use with a single tile.
   * @param data the nav mesh data
   * @param dataSize the size of the nav mesh data
   * @param flags the flags to use when building the nav mesh
   * @returns the status of the operation
   */
  initSolo(
    data: ReadonlyArray<number>,
    dataSize: number,
    flags: number
  ): boolean {
    return this.raw.initSolo(data, dataSize, flags);
  }

  /**
   * Initializes the NavMesh for use with multiple tiles.
   * @param params parameters for the NavMesh
   * @returns the status of the operation
   */
  initTiled({
    orig,
    tileWidth,
    tileHeight,
    maxTiles,
    maxPolys,
  }: NavMeshParams): boolean {
    const params = new Wasm.Recast.dtNavMeshParams();
    params.set_orig(vec3.toArray(orig));
    params.set_tileWidth(tileWidth);
    params.set_tileHeight(tileHeight);
    params.set_maxTiles(maxTiles);
    params.set_maxPolys(maxPolys);

    return this.raw.initTiled(params);
  }

  /**
   * Adds a tile to the NavMesh.
   * @param data the nav mesh data
   * @param dataSize the size of the nav mesh data
   * @param flags the flags to use when building the nav mesh
   * @param lastRef
   * @returns the status of the operation and the reference of the added tile
   */
  addTile(
    data: number[],
    dataSize: number,
    flags: number,
    lastRef: number
  ): NavMeshAddTileResult {
    return new NavMeshAddTileResult(
      this.raw.addTile(data, dataSize, flags, lastRef)
    );
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
  getTileAt(x: number, y: number, layer: number): dtMeshTile | null {
    const tile = this.raw.getTileAt(x, y, layer);

    return !emscripten.isNull(tile) ? new dtMeshTile(tile) : null;
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
  getTileRef(tile: dtMeshTile): number {
    return this.raw.getTileRef(tile.raw);
  }

  /**
   * Gets the tile for the specified tile reference.
   * @param ref The tile reference of the tile to retrieve.
   * @returns The tile for the specified reference, or null if the reference is invalid.
   */
  getTileByRef(ref: number): dtMeshTile | null {
    const tile = this.raw.getTileByRef(ref);

    return !emscripten.isNull(tile) ? new dtMeshTile(tile) : null;
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
  getTile(i: number): dtMeshTile {
    return new dtMeshTile(this.raw.getTile(i));
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
  getPolyRefBase(tile: dtMeshTile): number {
    return this.raw.getPolyRefBase(tile.raw);
  }

  /**
   * Gets the endpoints for an off-mesh connection, ordered by "direction of travel".
   * @param prevRef The reference of the polygon before the connection.
   * @param polyRef The reference of the off-mesh connection polygon.
   * @returns
   */
  getOffMeshConnectionPolyEndPoints(
    prevRef: number,
    polyRef: number
  ): NavMeshGetOffMeshConnectionPolyEndPointsResult {
    return new NavMeshGetOffMeshConnectionPolyEndPointsResult(
      this.raw.getOffMeshConnectionPolyEndPoints(prevRef, polyRef)
    );
  }

  /**
   * Gets the specified off-mesh connection.
   * @param ref The polygon reference of the off-mesh connection.
   * @returns
   */
  getOffMeshConnectionByRef(ref: number): dtOffMeshConnection {
    return new dtOffMeshConnection(this.raw.getOffMeshConnectionByRef(ref));
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
  getPolyFlags(ref: number): NavMeshGetPolyFlagsResult {
    return new NavMeshGetPolyFlagsResult(this.raw.getPolyFlags(ref));
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
  getPolyArea(ref: number): NavMeshGetPolyAreaResult {
    return new NavMeshGetPolyAreaResult(this.raw.getPolyArea(ref));
  }

  /**
   * Gets the size of the buffer required by #storeTileState to store the specified tile's state.
   * @param tile
   * @returns The size of the buffer required to store the state.
   */
  getTileStateSize(tile: dtMeshTile): number {
    return this.raw.getTileStateSize(tile.raw);
  }

  /**
   * Stores the non-structural state of the tile in the specified buffer. (Flags, area ids, etc.)
   * @param tile The tile.
   * @param maxDataSize The size of the data buffer. [Limit: >= #getTileStateSize]
   * @returns
   */
  storeTileState(
    tile: dtMeshTile,
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
    tile: dtMeshTile,
    data: number[],
    maxDataSize: number
  ): number {
    return this.raw.restoreTileState(tile.raw, data, maxDataSize);
  }

  /**
   * Returns a DebugNavMesh that can be used to visualize the NavMesh.
   */
  getDebugNavMesh(): DebugNavMesh {
    return new DebugNavMesh(this.raw.getDebugNavMesh());
  }

  /**
   * Destroys the NavMesh.
   */
  destroy(): void {
    this.raw?.destroy();
  }
}
