import type R from '@recast-navigation/wasm';
import { Vector3, array, emscripten, vec3 } from './utils';

export class rcSpan {
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

  next(): rcSpan | null {
    return !emscripten.isNull(this.raw.next) ? new rcSpan(this.raw.next) : null;
  }
}

export class rcSpanPool {
  raw: R.rcSpanPool;

  constructor(raw: R.rcSpanPool) {
    this.raw = raw;
  }

  next(): rcSpanPool | null {
    return !emscripten.isNull(this.raw.next)
      ? new rcSpanPool(this.raw.next)
      : null;
  }

  items(index: number): rcSpan {
    return new rcSpan(this.raw.get_items(index));
  }
}

export class rcHeightfield {
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

  spans(index: number): rcSpan {
    return new rcSpan(this.raw.get_spans(index));
  }

  pools(index: number): rcSpanPool {
    return new rcSpanPool(this.raw.get_pools(index));
  }

  freelist(index: number): rcSpan {
    return new rcSpan(this.raw.get_freelist(index));
  }
}

export class rcCompactCell {
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

export class rcCompactSpan {
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

export class rcCompactHeightfield {
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

  cells(index: number): rcCompactCell {
    return new rcCompactCell(this.raw.get_cells(index));
  }

  spans(index: number): rcCompactSpan {
    return new rcCompactSpan(this.raw.get_spans(index));
  }

  dist(index: number): number {
    return this.raw.get_dist(index);
  }

  areas(index: number): number {
    return this.raw.get_areas(index);
  }
}

export class rcContour {
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

export class rcContourSet {
  raw: R.rcContourSet;

  constructor(raw: R.rcContourSet) {
    this.raw = raw;
  }

  conts(index: number): rcContour {
    return new rcContour(this.raw.get_conts(index));
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

export class rcHeightfieldLayer {
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

export class rcHeightfieldLayerSet {
  raw: R.rcHeightfieldLayerSet;

  constructor(raw: R.rcHeightfieldLayerSet) {
    this.raw = raw;
  }

  layers(index: number): rcHeightfieldLayer {
    return new rcHeightfieldLayer(this.raw.get_layers(index));
  }

  nlayers(): number {
    return this.raw.nlayers;
  }
}

export class rcChunkyTriMeshNode {
  raw: R.rcChunkyTriMeshNode;

  constructor(raw: R.rcChunkyTriMeshNode) {
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

  n(): number {
    return this.raw.n;
  }
}

export class rcChunkyTriMesh {
  raw: R.rcChunkyTriMesh;

  constructor(raw: R.rcChunkyTriMesh) {
    this.raw = raw;
  }

  nodes(index: number): rcChunkyTriMeshNode {
    return new rcChunkyTriMeshNode(this.raw.get_nodes(index));
  }

  nnodes(): number {
    return this.raw.nnodes;
  }

  tris(index: number): number {
    return this.raw.get_tris(index);
  }

  ntris(): number {
    return this.raw.ntris;
  }

  maxTrisPerChunk(): number {
    return this.raw.maxTrisPerChunk;
  }
}

export class rcPolyMesh {
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

export class rcPolyMeshDetail {
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
