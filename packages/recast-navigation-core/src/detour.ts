import type R from '@recast-navigation/wasm';
import { Vector3, array, emscripten, vec3 } from './utils';

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
