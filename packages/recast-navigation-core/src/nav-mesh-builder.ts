import type R from '@recast-navigation/wasm';
import { Wasm } from './wasm';

export type NavMeshCreateParams = {
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

export type CreateNavMeshDataResult = {
  success: boolean;
  navMeshData: readonly number[];
  navMeshDataSize: number;
};

export class NavMeshBuilder {
  raw: R.NavMeshBuilder;

  constructor() {
    this.raw = new Wasm.Recast.NavMeshBuilder();
  }

  createNavMeshData(params: NavMeshCreateParams): CreateNavMeshDataResult {
    const navMeshCreateParams = new Wasm.Recast.NavMeshCreateParams();

    navMeshCreateParams.setVerts(params.verts);
    navMeshCreateParams.setVertCount(params.vertCount);
    navMeshCreateParams.setPolys(params.polys);
    navMeshCreateParams.setPolyFlags(params.polyFlags);
    navMeshCreateParams.setPolyAreas(params.polyAreas);
    navMeshCreateParams.setPolyCount(params.polyCount);
    navMeshCreateParams.setNvp(params.nvp);
    navMeshCreateParams.setDetailMeshes(params.detailMeshes);
    navMeshCreateParams.setDetailVerts(params.detailVerts);
    navMeshCreateParams.setDetailVertsCount(params.detailVertsCount);
    navMeshCreateParams.setDetailTris(params.detailTris);
    navMeshCreateParams.setDetailTriCount(params.detailTriCount);
    navMeshCreateParams.setOffMeshConVerts(params.offMeshConVerts);
    navMeshCreateParams.setOffMeshConRad(params.offMeshConRad);
    navMeshCreateParams.setOffMeshConFlags(params.offMeshConFlags);
    navMeshCreateParams.setOffMeshConAreas(params.offMeshConAreas);
    navMeshCreateParams.setOffMeshConDir(params.offMeshConDir);
    navMeshCreateParams.setOffMeshConUserID(params.offMeshConUserID);
    navMeshCreateParams.setOffMeshConCount(params.offMeshConCount);
    navMeshCreateParams.setUserId(params.userId);
    navMeshCreateParams.setTileX(params.tileX);
    navMeshCreateParams.setTileY(params.tileY);
    navMeshCreateParams.setTileLayer(params.tileLayer);
    navMeshCreateParams.setBmin(params.bmin);
    navMeshCreateParams.setBmax(params.bmax);
    navMeshCreateParams.setWalkableHeight(params.walkableHeight);
    navMeshCreateParams.setWalkableRadius(params.walkableRadius);
    navMeshCreateParams.setWalkableClimb(params.walkableClimb);
    navMeshCreateParams.setCs(params.cs);
    navMeshCreateParams.setCh(params.ch);
    navMeshCreateParams.setBuildBvTree(params.buildBvTree);

    const { success, navMeshData, navMeshDataSize } =
      this.raw.createNavMeshData(navMeshCreateParams);

    return {
      success,
      navMeshData,
      navMeshDataSize,
    };
  }
}
