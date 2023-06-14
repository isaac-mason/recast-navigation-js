import type R from '@recast-navigation/wasm';
import { Wasm } from './wasm';
import { emscripten } from './utils';
import { finalizer } from './finalizer';

export type CreateNavMeshDataParams = {
  verts: number[];
  vertCount: number;
  polys: number[];
  polyFlags: number[];
  polyAreas: number[];
  polyCount: number;
  nvp: number;
  detailMeshes: number[];
  detailVerts: number[];
  detailVertsCount: number;
  detailTris: number[];
  detailTriCount: number;
  offMeshConVerts: number[];
  offMeshConRad: number[];
  offMeshConFlags: number[];
  offMeshConAreas: number[];
  offMeshConDir: number[];
  offMeshConUserID: number[];
  offMeshConCount: number;
  userId: number;
  tileX: number;
  tileY: number;
  tileLayer: number;
  bmin: number[];
  bmax: number[];
  walkableHeight: number;
  walkableRadius: number;
  walkableClimb: number;
  cs: number;
  ch: number;
  buildBvTree: boolean;
};

export type CreateNavMeshDataResult = R.CreateNavMeshDataResult;

export class NavMeshBuilder {
  raw: R.NavMeshBuilder;

  constructor() {
    this.raw = new Wasm.Recast.NavMeshBuilder();

    finalizer.register(this);
  }

  createNavMeshData(params: CreateNavMeshDataParams): CreateNavMeshDataResult {
    const navMeshCreateParams = new Wasm.Recast.dtNavMeshCreateParams();

    navMeshCreateParams.set_verts(params.verts);
    navMeshCreateParams.set_vertCount(params.vertCount);
    navMeshCreateParams.set_polys(params.polys);
    navMeshCreateParams.set_polyFlags(params.polyFlags);
    navMeshCreateParams.set_polyAreas(params.polyAreas);
    navMeshCreateParams.set_polyCount(params.polyCount);
    navMeshCreateParams.set_nvp(params.nvp);
    navMeshCreateParams.set_detailMeshes(params.detailMeshes);
    navMeshCreateParams.set_detailVerts(params.detailVerts);
    navMeshCreateParams.set_detailVertsCount(params.detailVertsCount);
    navMeshCreateParams.set_detailTris(params.detailTris);
    navMeshCreateParams.set_detailTriCount(params.detailTriCount);
    navMeshCreateParams.set_offMeshConVerts(params.offMeshConVerts);
    navMeshCreateParams.set_offMeshConRad(params.offMeshConRad);
    navMeshCreateParams.set_offMeshConFlags(params.offMeshConFlags);
    navMeshCreateParams.set_offMeshConAreas(params.offMeshConAreas);
    navMeshCreateParams.set_offMeshConDir(params.offMeshConDir);
    navMeshCreateParams.set_offMeshConUserID(params.offMeshConUserID);
    navMeshCreateParams.set_offMeshConCount(params.offMeshConCount);
    navMeshCreateParams.set_userId(params.userId);
    navMeshCreateParams.set_tileX(params.tileX);
    navMeshCreateParams.set_tileY(params.tileY);
    navMeshCreateParams.set_tileLayer(params.tileLayer);
    navMeshCreateParams.set_bmin(params.bmin);
    navMeshCreateParams.set_bmax(params.bmax);
    navMeshCreateParams.set_walkableHeight(params.walkableHeight);
    navMeshCreateParams.set_walkableRadius(params.walkableRadius);
    navMeshCreateParams.set_walkableClimb(params.walkableClimb);
    navMeshCreateParams.set_cs(params.cs);
    navMeshCreateParams.set_ch(params.ch);
    navMeshCreateParams.set_buildBvTree(params.buildBvTree);

    const createNavMeshDataResult =
      this.raw.createNavMeshData(navMeshCreateParams);

    emscripten.destroy(navMeshCreateParams);

    return createNavMeshDataResult;
  }

  destroy(): void {
    finalizer.unregister(this);
    emscripten.destroy(this.raw);
  }
}
