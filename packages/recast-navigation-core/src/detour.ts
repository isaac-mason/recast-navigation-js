import { UnsignedCharArray } from './arrays';
import { Detour, Raw, type RawModule } from './raw';
import type { RecastPolyMesh, RecastPolyMeshDetail } from './recast';
import { type Vector3, type Vector3Tuple, array, vec3 } from './utils';

export const statusSucceed = (status: number): boolean => {
  return Raw.Detour.statusSucceed(status);
};

export const statusFailed = (status: number): boolean => {
  return Raw.Detour.statusFailed(status);
};

export const statusInProgress = (status: number): boolean => {
  return Raw.Detour.statusInProgress(status);
};

export const statusDetail = (status: number, detail: number): boolean => {
  return Raw.Detour.statusDetail(status, detail);
};

export const statusToReadableString = (status: number): string => {
  if (Raw.Detour.statusSucceed(status)) {
    return 'success';
  }

  if (Raw.Detour.statusInProgress(status)) {
    return 'in progress';
  }

  if (Raw.Detour.statusFailed(status)) {
    let reason: string | undefined ;

    const DT_STATUS_REASONS = {
      DT_WRONG_MAGIC: Detour.DT_WRONG_MAGIC,
      DT_WRONG_VERSION: Detour.DT_WRONG_VERSION,
      DT_OUT_OF_MEMORY: Detour.DT_OUT_OF_MEMORY,
      DT_INVALID_PARAM: Detour.DT_INVALID_PARAM,
      DT_BUFFER_TOO_SMALL: Detour.DT_BUFFER_TOO_SMALL,
      DT_OUT_OF_NODES: Detour.DT_OUT_OF_NODES,
      DT_PARTIAL_RESULT: Detour.DT_PARTIAL_RESULT,
      DT_ALREADY_OCCUPIED: Detour.DT_ALREADY_OCCUPIED,
    };

    for (const [reasonName, reasonMask] of Object.entries(DT_STATUS_REASONS)) {
      if (Raw.Detour.statusDetail(status, reasonMask)) {
        reason = reasonName;
        break;
      }
    }

    if (reason) {
      return `failed - ${reason}`;
    }

    return `failed - unknown`;
  }

  return 'unknown';
};

export class DetourPolyDetail {
  raw: RawModule.dtPolyDetail;

  constructor(raw: RawModule.dtPolyDetail) {
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

export class DetourLink {
  raw: RawModule.dtLink;

  constructor(raw: RawModule.dtLink) {
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

export class DetourBVNode {
  raw: RawModule.dtBVNode;

  constructor(raw: RawModule.dtBVNode) {
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

export class DetourOffMeshConnection {
  raw: RawModule.dtOffMeshConnection;

  constructor(raw: RawModule.dtOffMeshConnection) {
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

export class DetourMeshHeader {
  raw: RawModule.dtMeshHeader;

  constructor(raw: RawModule.dtMeshHeader) {
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

export class DetourPoly {
  raw: RawModule.dtPoly;

  constructor(raw: RawModule.dtPoly) {
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

export class DetourMeshTile {
  raw: RawModule.dtMeshTile;

  constructor(raw: RawModule.dtMeshTile) {
    this.raw = raw;
  }

  salt(): number {
    return this.raw.salt;
  }

  linksFreeList(): number {
    return this.raw.linksFreeList;
  }

  header(): DetourMeshHeader | null {
    return !Raw.isNull(this.raw.header)
      ? new DetourMeshHeader(this.raw.header)
      : null;
  }

  polys(index: number): DetourPoly {
    return new DetourPoly(this.raw.get_polys(index));
  }

  verts(index: number): number {
    return this.raw.get_verts(index);
  }

  links(index: number): DetourLink {
    return new DetourLink(this.raw.get_links(index));
  }

  detailMeshes(index: number): DetourPolyDetail {
    return new DetourPolyDetail(this.raw.get_detailMeshes(index));
  }

  detailVerts(index: number): number {
    return this.raw.get_detailVerts(index);
  }

  detailTris(index: number): number {
    return this.raw.get_detailTris(index);
  }

  bvTree(index: number): DetourBVNode {
    return new DetourBVNode(this.raw.get_bvTree(index));
  }

  offMeshCons(index: number): DetourOffMeshConnection {
    return new DetourOffMeshConnection(this.raw.get_offMeshCons(index));
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

  next(): DetourMeshTile {
    return new DetourMeshTile(this.raw.next);
  }
}

export const createNavMeshData = (navMeshCreateParams: NavMeshCreateParams) => {
  const result = Raw.DetourNavMeshBuilder.createNavMeshData(
    navMeshCreateParams.raw,
  );

  return {
    success: result.success,
    navMeshData: UnsignedCharArray.fromRaw(result.navMeshData),
  };
};

export type OffMeshConnectionParams = {
  startPosition: Vector3;
  endPosition: Vector3;
  radius: number;
  bidirectional: boolean;
  /**
   * @default 0
   */
  area?: number;
  /**
   * @default 1
   */
  flags?: number;
  userId?: number;
};

export class NavMeshCreateParams {
  raw: RawModule.dtNavMeshCreateParams;

  /**
   * Creates a new NavMeshCreateParams object.
   */
  constructor();

  /**
   * Creates a wrapper around an existing raw NavMeshCreateParams object.
   */
  constructor(raw: RawModule.dtNavMeshCreateParams);

  constructor(raw?: RawModule.dtNavMeshCreateParams) {
    this.raw = raw ?? new Raw.Module.dtNavMeshCreateParams();
  }

  setPolyMeshCreateParams(polyMesh: RecastPolyMesh): void {
    Raw.DetourNavMeshBuilder.setPolyMeshCreateParams(this.raw, polyMesh.raw);
  }

  setPolyMeshDetailCreateParams(polyMeshDetail: RecastPolyMeshDetail): void {
    Raw.DetourNavMeshBuilder.setPolyMeshDetailCreateParams(
      this.raw,
      polyMeshDetail.raw,
    );
  }

  setOffMeshConnections(offMeshConnections: OffMeshConnectionParams[]): void {
    if (offMeshConnections.length <= 0) return;

    const verts: number[] = [];
    const rads: number[] = [];
    const dir: number[] = [];
    const areas: number[] = [];
    const flags: number[] = [];
    const userIds: number[] = [];

    for (let i = 0; i < offMeshConnections.length; i++) {
      const connection = offMeshConnections[i];

      verts.push(
        connection.startPosition.x,
        connection.startPosition.y,
        connection.startPosition.z,
      );
      verts.push(
        connection.endPosition.x,
        connection.endPosition.y,
        connection.endPosition.z,
      );

      rads.push(connection.radius);
      dir.push(connection.bidirectional ? 1 : 0);
      areas.push(connection.area ?? 0);
      flags.push(connection.flags ?? 1);
      userIds.push(connection.userId ?? 1000 + i);
    }

    Raw.DetourNavMeshBuilder.setOffMeshConnections(
      this.raw,
      offMeshConnections.length,
      verts,
      rads,
      dir,
      areas,
      flags,
      userIds,
    );
  }

  verts(index: number): number {
    return this.raw.get_verts(index);
  }

  setVerts(index: number, value: number): void {
    this.raw.set_verts(index, value);
  }

  vertCount(): number {
    return this.raw.vertCount;
  }

  polys(index: number): number {
    return this.raw.get_polys(index);
  }

  setPolys(index: number, value: number): void {
    this.raw.set_polys(index, value);
  }

  polyAreas(index: number): number {
    return this.raw.get_polyAreas(index);
  }

  setPolyAreas(index: number, value: number): void {
    this.raw.set_polyAreas(index, value);
  }

  polyFlags(index: number): number {
    return this.raw.get_polyFlags(index);
  }

  setPolyFlags(index: number, value: number): void {
    this.raw.set_polyFlags(index, value);
  }

  polyCount(): number {
    return this.raw.polyCount;
  }

  nvp(): number {
    return this.raw.nvp;
  }

  setNvp(value: number): void {
    this.raw.nvp = value;
  }

  detailMeshes(index: number): number {
    return this.raw.get_detailMeshes(index);
  }

  setDetailMeshes(index: number, value: number): void {
    this.raw.set_detailMeshes(index, value);
  }

  detailVerts(index: number): number {
    return this.raw.get_detailVerts(index);
  }

  setDetailVerts(index: number, value: number): void {
    this.raw.set_detailVerts(index, value);
  }

  detailVertsCount(): number {
    return this.raw.detailVertsCount;
  }

  detailTris(index: number): number {
    return this.raw.get_detailTris(index);
  }

  setDetailTris(index: number, value: number): void {
    this.raw.set_detailTris(index, value);
  }

  detailTriCount(): number {
    return this.raw.detailTriCount;
  }

  offMeshConVerts(index: number): number {
    return this.raw.get_offMeshConVerts(index);
  }

  offMeshConRad(index: number): number {
    return this.raw.get_offMeshConRad(index);
  }

  offMeshConDir(index: number): number {
    return this.raw.get_offMeshConDir(index);
  }

  offMeshConAreas(index: number): number {
    return this.raw.get_offMeshConAreas(index);
  }

  offMeshConFlags(index: number): number {
    return this.raw.get_offMeshConFlags(index);
  }

  offMeshConUserID(index: number): number {
    return this.raw.get_offMeshConUserID(index);
  }

  offMeshConCount(): number {
    return this.raw.offMeshConCount;
  }

  userId(): number {
    return this.raw.userId;
  }

  tileX(): number {
    return this.raw.tileX;
  }

  setTileX(value: number): void {
    this.raw.tileX = value;
  }

  tileY(): number {
    return this.raw.tileY;
  }

  setTileY(value: number): void {
    this.raw.tileY = value;
  }

  tileLayer(): number {
    return this.raw.tileLayer;
  }

  setTileLayer(value: number): void {
    this.raw.tileLayer = value;
  }

  boundsMin(): Vector3Tuple {
    return array((i) => this.raw.get_bmin(i), 3) as Vector3Tuple;
  }

  setBoundsMin(value: Vector3Tuple): void {
    this.raw.set_bmin(0, value[0]);
    this.raw.set_bmin(1, value[1]);
    this.raw.set_bmin(2, value[2]);
  }

  boundsMax(): Vector3Tuple {
    return array((i) => this.raw.get_bmax(i), 3) as Vector3Tuple;
  }

  setBoundsMax(value: Vector3Tuple): void {
    this.raw.set_bmax(0, value[0]);
    this.raw.set_bmax(1, value[1]);
    this.raw.set_bmax(2, value[2]);
  }

  walkableHeight(): number {
    return this.raw.walkableHeight;
  }

  setWalkableHeight(value: number): void {
    this.raw.walkableHeight = value;
  }

  walkableRadius(): number {
    return this.raw.walkableRadius;
  }

  setWalkableRadius(value: number): void {
    this.raw.walkableRadius = value;
  }

  walkableClimb(): number {
    return this.raw.walkableClimb;
  }

  setWalkableClimb(value: number): void {
    this.raw.walkableClimb = value;
  }

  cellSize(): number {
    return this.raw.cs;
  }

  setCellSize(value: number): void {
    this.raw.cs = value;
  }

  cellHeight(): number {
    return this.raw.ch;
  }

  setCellHeight(value: number): void {
    this.raw.ch = value;
  }

  buildBvTree(): boolean {
    return this.raw.buildBvTree;
  }

  setBuildBvTree(value: boolean): void {
    this.raw.buildBvTree = value;
  }
}
