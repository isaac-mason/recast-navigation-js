import { Raw } from './raw';
import type R from './raw-module';
import { Vector3, array, vec3 } from './utils';

export type RecastConfigType = {
  /**
   * The size of the non-navigable border around the heightfield.
   * [Limit: >=0] [Units: vx]
   * @default 0
   */
  borderSize: number;

  /**
   * The width/height size of tile's on the xz-plane.
   * [Limit: >= 0] [Units: vx]
   *
   * If tileSize is provided, a tiled navmesh will be created.
   * If tileSize is not provided, or is set to zero, a solo navmesh will be created.
   *
   * To use obstacles, a tiled navmesh must be generated.
   * @default 0
   */
  tileSize: number;

  /**
   * The xz-plane cell size to use for fields.
   * [Limit: > 0] [Units: wu]
   * @default 0.2
   */
  cs: number;

  /**
   * The y-axis cell size to use for fields.
   * Limit: > 0] [Units: wu]
   * @default 0.2
   */
  ch: number;

  /**
   * The maximum slope that is considered walkable.
   * [Limits: 0 <= value < 90] [Units: Degrees]
   * @default 60
   */
  walkableSlopeAngle: number;

  /**
   * Minimum floor to 'ceiling' height that will still allow the floor area to be considered walkable.
   * [Limit: >= 3] [Units: vx]
   * @default 2
   */
  walkableHeight: number;

  /**
   * Maximum ledge height that is considered to still be traversable.
   * [Limit: >=0] [Units: vx]
   * @default 2
   */
  walkableClimb: number;

  /**
   * The distance to erode/shrink the walkable area of the heightfield away from obstructions.
   * [Limit: >=0] [Units: vx]
   * @default 0.5
   */
  walkableRadius: number;

  /**
   * The maximum allowed length for contour edges along the border of the mesh.
   * [Limit: >=0] [Units: vx]
   * @default 12
   */
  maxEdgeLen: number;

  /**
   * The maximum distance a simplfied contour's border edges should deviate the original raw contour.
   * [Limit: >=0] [Units: vx]
   * @default 1.3
   */
  maxSimplificationError: number;

  /**
   * The minimum number of cells allowed to form isolated island areas.
   * [Limit: >=0] [Units: vx]
   * @default 8
   */
  minRegionArea: number;

  /**
   * Any regions with a span count smaller than this value will, if possible, be merged with larger regions.
   * [Limit: >=0] [Units: vx]
   * @default 20
   */
  mergeRegionArea: number;

  /**
   * The maximum number of vertices allowed for polygons generated during the be merged with larger regions.
   * [Limit: >=0] [Units: vx]
   * @default 6
   */
  maxVertsPerPoly: number;

  /**
   * Sets the sampling distance to use when generating the detail mesh. (For height detail only.)
   * [Limits: 0 or >= 0.9] [Units: wu]
   * @default 6
   */
  detailSampleDist: number;

  /**
   * The maximum distance the detail mesh surface should deviate from heightfield data. (For height detail only.)
   * [Limit: >=0] [Units: wu]
   * @default 1
   */
  detailSampleMaxError: number;
};

export const recastConfigDefaults: RecastConfigType = {
  borderSize: 0,
  tileSize: 0,
  cs: 0.2,
  ch: 0.2,
  walkableSlopeAngle: 60,
  walkableHeight: 2,
  walkableClimb: 2,
  walkableRadius: 0.5,
  maxEdgeLen: 12,
  maxSimplificationError: 1.3,
  minRegionArea: 8,
  mergeRegionArea: 20,
  maxVertsPerPoly: 6,
  detailSampleDist: 6,
  detailSampleMaxError: 1,
};

export class RecastConfig {
  constructor(public raw: R.rcConfig) {}

  static create(partialConfig: Partial<RecastConfigType>): RecastConfig {
    const config = {
      ...recastConfigDefaults,
      ...partialConfig,
    };

    const raw = new Raw.Module.rcConfig();
    raw.borderSize = config.borderSize;
    raw.tileSize = config.tileSize;
    raw.cs = config.cs;
    raw.ch = config.ch;
    raw.walkableSlopeAngle = config.walkableSlopeAngle;
    raw.walkableHeight = config.walkableHeight;
    raw.walkableClimb = config.walkableClimb;
    raw.walkableRadius = config.walkableRadius;
    raw.maxEdgeLen = config.maxEdgeLen;
    raw.maxSimplificationError = config.maxSimplificationError;
    raw.minRegionArea = config.minRegionArea;
    raw.mergeRegionArea = config.mergeRegionArea;
    raw.maxVertsPerPoly = config.maxVertsPerPoly;
    raw.detailSampleDist = config.detailSampleDist;
    raw.detailSampleMaxError = config.detailSampleMaxError;

    return new RecastConfig(raw);
  }

  clone(): RecastConfig {
    const clone = new Raw.Module.rcConfig();

    clone.set_bmin(0, this.raw.get_bmin(0));
    clone.set_bmin(1, this.raw.get_bmin(1));
    clone.set_bmin(2, this.raw.get_bmin(2));
    clone.set_bmax(0, this.raw.get_bmax(0));
    clone.set_bmax(1, this.raw.get_bmax(1));
    clone.set_bmax(2, this.raw.get_bmax(2));

    clone.width = this.raw.width;
    clone.height = this.raw.height;
    clone.borderSize = this.raw.borderSize;
    clone.tileSize = this.raw.tileSize;
    clone.cs = this.raw.cs;
    clone.ch = this.raw.ch;
    clone.walkableSlopeAngle = this.raw.walkableSlopeAngle;
    clone.walkableHeight = this.raw.walkableHeight;
    clone.walkableClimb = this.raw.walkableClimb;
    clone.walkableRadius = this.raw.walkableRadius;
    clone.maxEdgeLen = this.raw.maxEdgeLen;
    clone.maxSimplificationError = this.raw.maxSimplificationError;
    clone.minRegionArea = this.raw.minRegionArea;
    clone.mergeRegionArea = this.raw.mergeRegionArea;
    clone.maxVertsPerPoly = this.raw.maxVertsPerPoly;
    clone.detailSampleDist = this.raw.detailSampleDist;
    clone.detailSampleMaxError = this.raw.detailSampleMaxError;

    return new RecastConfig(clone);
  }
}

export class RecastSpan {
  raw: R.rcSpan;

  constructor(raw: R.rcSpan) {
    this.raw = raw;
  }

  smin(): number {
    return this.raw.smin;
  }

  smax(): number {
    return this.raw.smax;
  }

  area(): number {
    return this.raw.area;
  }

  next(): RecastSpan | null {
    return !Raw.isNull(this.raw.next) ? new RecastSpan(this.raw.next) : null;
  }
}

export class RecastSpanPool {
  raw: R.rcSpanPool;

  constructor(raw: R.rcSpanPool) {
    this.raw = raw;
  }

  next(): RecastSpanPool | null {
    return !Raw.isNull(this.raw.next)
      ? new RecastSpanPool(this.raw.next)
      : null;
  }

  items(index: number): RecastSpan {
    return new RecastSpan(this.raw.get_items(index));
  }
}

export class RecastHeightfield {
  raw: R.rcHeightfield;

  constructor(raw: R.rcHeightfield) {
    this.raw = raw;
  }

  width(): number {
    return this.raw.width;
  }

  height(): number {
    return this.raw.height;
  }

  bmin(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmin(i), 3));
  }

  bmax(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmax(i), 3));
  }

  cs(): number {
    return this.raw.cs;
  }

  ch(): number {
    return this.raw.ch;
  }

  spans(index: number): RecastSpan {
    return new RecastSpan(this.raw.get_spans(index));
  }

  pools(index: number): RecastSpanPool {
    return new RecastSpanPool(this.raw.get_pools(index));
  }

  freelist(index: number): RecastSpan {
    return new RecastSpan(this.raw.get_freelist(index));
  }
}

export class RecastCompactCell {
  raw: R.rcCompactCell;

  constructor(raw: R.rcCompactCell) {
    this.raw = raw;
  }

  index(): number {
    return this.raw.get_index();
  }

  count(): number {
    return this.raw.get_count();
  }
}

export class RecastCompactSpan {
  raw: R.rcCompactSpan;

  constructor(raw: R.rcCompactSpan) {
    this.raw = raw;
  }

  y(): number {
    return this.raw.get_y();
  }

  reg(): number {
    return this.raw.get_reg();
  }

  con(): number {
    return this.raw.get_con();
  }

  h(): number {
    return this.raw.get_h();
  }
}

export class RecastCompactHeightfield {
  raw: R.rcCompactHeightfield;

  constructor(raw: R.rcCompactHeightfield) {
    this.raw = raw;
  }

  width(): number {
    return this.raw.width;
  }

  height(): number {
    return this.raw.height;
  }

  spanCount(): number {
    return this.raw.spanCount;
  }

  walkableHeight(): number {
    return this.raw.walkableHeight;
  }

  walkableClimb(): number {
    return this.raw.walkableClimb;
  }

  borderSize(): number {
    return this.raw.borderSize;
  }

  maxDistance(): number {
    return this.raw.maxDistance;
  }

  maxRegions(): number {
    return this.raw.maxRegions;
  }

  bmin(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmin(i), 3));
  }

  bmax(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmax(i), 3));
  }

  cs(): number {
    return this.raw.cs;
  }

  ch(): number {
    return this.raw.ch;
  }

  cells(index: number): RecastCompactCell {
    return new RecastCompactCell(this.raw.get_cells(index));
  }

  spans(index: number): RecastCompactSpan {
    return new RecastCompactSpan(this.raw.get_spans(index));
  }

  dist(index: number): number {
    return this.raw.get_dist(index);
  }

  areas(index: number): number {
    return this.raw.get_areas(index);
  }
}

export class RecastContour {
  raw: R.rcContour;

  constructor(raw: R.rcContour) {
    this.raw = raw;
  }

  verts(index: number): number {
    return this.raw.get_verts(index);
  }

  nverts(): number {
    return this.raw.nverts;
  }

  rverts(index: number): number {
    return this.raw.get_rverts(index);
  }

  nrverts(): number {
    return this.raw.nrverts;
  }

  reg(): number {
    return this.raw.reg;
  }

  area(): number {
    return this.raw.area;
  }
}

export class RecastContourSet {
  raw: R.rcContourSet;

  constructor(raw: R.rcContourSet) {
    this.raw = raw;
  }

  conts(index: number): RecastContour {
    return new RecastContour(this.raw.get_conts(index));
  }

  nconts(): number {
    return this.raw.nconts;
  }

  bmin(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmin(i), 3));
  }

  bmax(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmax(i), 3));
  }

  cs(): number {
    return this.raw.cs;
  }

  ch(): number {
    return this.raw.ch;
  }

  width(): number {
    return this.raw.width;
  }

  height(): number {
    return this.raw.height;
  }

  borderSize(): number {
    return this.raw.borderSize;
  }

  maxError(): number {
    return this.raw.maxError;
  }
}

export class RecastHeightfieldLayer {
  raw: R.rcHeightfieldLayer;

  constructor(raw: R.rcHeightfieldLayer) {
    this.raw = raw;
  }

  bmin(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmin(i), 3));
  }

  bmax(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmax(i), 3));
  }

  cs(): number {
    return this.raw.cs;
  }

  ch(): number {
    return this.raw.ch;
  }

  width(): number {
    return this.raw.width;
  }

  height(): number {
    return this.raw.height;
  }

  minx(): number {
    return this.raw.minx;
  }

  maxx(): number {
    return this.raw.maxx;
  }

  miny(): number {
    return this.raw.miny;
  }

  maxy(): number {
    return this.raw.maxy;
  }

  hmin(): number {
    return this.raw.hmin;
  }

  hmax(): number {
    return this.raw.hmax;
  }

  heights(index: number): number {
    return this.raw.get_heights(index);
  }

  areas(index: number): number {
    return this.raw.get_areas(index);
  }

  cons(index: number): number {
    return this.raw.get_cons(index);
  }
}

export class RecastHeightfieldLayerSet {
  raw: R.rcHeightfieldLayerSet;

  constructor(raw: R.rcHeightfieldLayerSet) {
    this.raw = raw;
  }

  layers(index: number): RecastHeightfieldLayer {
    return new RecastHeightfieldLayer(this.raw.get_layers(index));
  }

  nlayers(): number {
    return this.raw.nlayers;
  }
}

export class RecastPolyMesh {
  raw: R.rcPolyMesh;

  constructor(raw: R.rcPolyMesh) {
    this.raw = raw;
  }

  verts(index: number): number {
    return this.raw.get_verts(index);
  }

  polys(index: number): number {
    return this.raw.get_polys(index);
  }

  regs(index: number): number {
    return this.raw.get_regs(index);
  }

  flags(index: number): number {
    return this.raw.get_flags(index);
  }

  areas(index: number): number {
    return this.raw.get_areas(index);
  }

  nverts(): number {
    return this.raw.nverts;
  }

  npolys(): number {
    return this.raw.npolys;
  }

  maxpolys(): number {
    return this.raw.maxpolys;
  }

  nvp(): number {
    return this.raw.nvp;
  }

  bmin(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmin(i), 3));
  }

  bmax(): Vector3 {
    return vec3.fromArray(array((i) => this.raw.get_bmax(i), 3));
  }

  cs(): number {
    return this.raw.cs;
  }

  ch(): number {
    return this.raw.ch;
  }

  borderSize(): number {
    return this.raw.borderSize;
  }

  maxEdgeError(): number {
    return this.raw.maxEdgeError;
  }
}

export class RecastPolyMeshDetail {
  raw: R.rcPolyMeshDetail;

  constructor(raw: R.rcPolyMeshDetail) {
    this.raw = raw;
  }

  meshes(index: number): number {
    return this.raw.get_meshes(index);
  }

  verts(index: number): number {
    return this.raw.get_verts(index);
  }

  tris(index: number): number {
    return this.raw.get_tris(index);
  }

  nmeshes(): number {
    return this.raw.nmeshes;
  }

  nverts(): number {
    return this.raw.nverts;
  }

  ntris(): number {
    return this.raw.ntris;
  }
}
