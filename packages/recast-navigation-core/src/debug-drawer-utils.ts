import { NavMesh } from './nav-mesh';
import { NavMeshQuery } from './nav-mesh-query';
import { Raw, RawModule } from './raw';
import {
  RecastCompactHeightfield,
  RecastContourSet,
  RecastHeightfield,
  RecastHeightfieldLayer,
  RecastHeightfieldLayerSet,
  RecastPolyMesh,
  RecastPolyMeshDetail,
} from './recast';

export type DebugDrawerPrimitiveType = 'lines' | 'tris' | 'quads' | 'points';

export type DebugDrawerPrimitive = {
  type: DebugDrawerPrimitiveType;
  vertices: [
    x: number,
    y: number,
    z: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ][];
};

/**
 * Represents a helper class to visualize navigation cur and related data in PlayCanvas.
 */
export class DebugDrawerUtils {
  private debugDrawImpl: RawModule.DebugDrawImpl;

  private currentPrimitiveType: number = 0;
  private currentVertices: DebugDrawerPrimitive['vertices'] = [];

  private primitives: DebugDrawerPrimitive[] = [];

  constructor() {
    this.debugDrawImpl = new Raw.Module.DebugDrawImpl();

    // Bind the debug draw implementation handlers
    this.debugDrawImpl.handleBegin = (primitive: number, _size: number) => {
      this.currentPrimitiveType = primitive;
      this.currentVertices = [];
    };

    this.debugDrawImpl.handleDepthMask = (_state: number) => {
      // unused for now...
    };

    this.debugDrawImpl.handleTexture = (_state: number) => {
      // unused for now...
    };

    this.debugDrawImpl.handleVertexWithColor = (
      x: number,
      y: number,
      z: number,
      color: number,
    ) => {
      this.vertex(x, y, z, color);
    };

    this.debugDrawImpl.handleVertexWithColorAndUV = (
      x: number,
      y: number,
      z: number,
      color: number,
      _u: number,
      _v: number,
    ) => {
      this.vertex(x, y, z, color);
    };

    const primitiveMap: Record<number, DebugDrawerPrimitiveType> = {
      [Raw.Module.DU_DRAW_LINES]: 'lines',
      [Raw.Module.DU_DRAW_TRIS]: 'tris',
      [Raw.Module.DU_DRAW_QUADS]: 'quads',
      [Raw.Module.DU_DRAW_POINTS]: 'points',
    };

    this.debugDrawImpl.handleEnd = () => {
      const type = primitiveMap[this.currentPrimitiveType];

      this.primitives.push({
        type,
        vertices: this.currentVertices,
      });
    };
  }

  private flush(): DebugDrawerPrimitive[] {
    const cur = this.primitives;
    this.primitives = [];
    return cur;
  }

  drawHeightfieldSolid(hf: RecastHeightfield): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawHeightfieldSolid(this.debugDrawImpl, hf.raw);
    return this.flush();
  }

  drawHeightfieldWalkable(hf: RecastHeightfield): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawHeightfieldWalkable(
      this.debugDrawImpl,
      hf.raw,
    );
    return this.flush();
  }

  drawCompactHeightfieldSolid(
    chf: RecastCompactHeightfield,
  ): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawCompactHeightfieldSolid(
      this.debugDrawImpl,
      chf.raw,
    );
    return this.flush();
  }

  drawCompactHeightfieldRegions(
    chf: RecastCompactHeightfield,
  ): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawCompactHeightfieldRegions(
      this.debugDrawImpl,
      chf.raw,
    );
    return this.flush();
  }

  drawCompactHeightfieldDistance(
    chf: RecastCompactHeightfield,
  ): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawCompactHeightfieldDistance(
      this.debugDrawImpl,
      chf.raw,
    );
    return this.flush();
  }

  drawHeightfieldLayer(
    layer: RecastHeightfieldLayer,
    idx: number,
  ): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawHeightfieldLayer(
      this.debugDrawImpl,
      layer.raw,
      idx,
    );
    return this.flush();
  }

  drawHeightfieldLayers(
    lset: RecastHeightfieldLayerSet,
  ): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawHeightfieldLayers(
      this.debugDrawImpl,
      lset.raw,
    );
    return this.flush();
  }

  drawRegionConnections(
    cset: RecastContourSet,
    alpha: number = 1,
  ): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawRegionConnections(
      this.debugDrawImpl,
      cset.raw,
      alpha,
    );
    return this.flush();
  }

  drawRawContours(
    cset: RecastContourSet,
    alpha: number = 1,
  ): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawRawContours(
      this.debugDrawImpl,
      cset.raw,
      alpha,
    );
    return this.flush();
  }

  drawContours(
    cset: RecastContourSet,
    alpha: number = 1,
  ): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawContours(this.debugDrawImpl, cset.raw, alpha);
    return this.flush();
  }

  drawPolyMesh(mesh: RecastPolyMesh): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawPolyMesh(this.debugDrawImpl, mesh.raw);
    return this.flush();
  }

  drawPolyMeshDetail(dmesh: RecastPolyMeshDetail): DebugDrawerPrimitive[] {
    Raw.RecastDebugDraw.debugDrawPolyMeshDetail(this.debugDrawImpl, dmesh.raw);
    return this.flush();
  }

  drawNavMesh(mesh: NavMesh, flags: number = 0): DebugDrawerPrimitive[] {
    Raw.DetourDebugDraw.debugDrawNavMesh(
      this.debugDrawImpl,
      mesh.raw.getNavMesh(),
      flags,
    );
    return this.flush();
  }

  drawNavMeshWithClosedList(
    mesh: NavMesh,
    query: NavMeshQuery,
    flags: number = 0,
  ): DebugDrawerPrimitive[] {
    Raw.DetourDebugDraw.debugDrawNavMeshWithClosedList(
      this.debugDrawImpl,
      mesh.raw.m_navMesh,
      query.raw.m_navQuery,
      flags,
    );
    return this.flush();
  }

  drawNavMeshNodes(query: NavMeshQuery): DebugDrawerPrimitive[] {
    Raw.DetourDebugDraw.debugDrawNavMeshNodes(
      this.debugDrawImpl,
      query.raw.m_navQuery,
    );
    return this.flush();
  }

  drawNavMeshBVTree(mesh: NavMesh): DebugDrawerPrimitive[] {
    Raw.DetourDebugDraw.debugDrawNavMeshBVTree(
      this.debugDrawImpl,
      mesh.raw.m_navMesh,
    );
    return this.flush();
  }

  drawNavMeshPortals(mesh: NavMesh): DebugDrawerPrimitive[] {
    Raw.DetourDebugDraw.debugDrawNavMeshPortals(
      this.debugDrawImpl,
      mesh.raw.m_navMesh,
    );
    return this.flush();
  }

  drawNavMeshPolysWithFlags(
    mesh: NavMesh,
    flags: number,
    col: number,
  ): DebugDrawerPrimitive[] {
    Raw.DetourDebugDraw.debugDrawNavMeshPolysWithFlags(
      this.debugDrawImpl,
      mesh.raw.m_navMesh,
      flags,
      this.rgbToDuRgba(col),
    );
    return this.flush();
  }

  drawNavMeshPoly(
    mesh: NavMesh,
    ref: number,
    col: number,
  ): DebugDrawerPrimitive[] {
    Raw.DetourDebugDraw.debugDrawNavMeshPoly(
      this.debugDrawImpl,
      mesh.raw.m_navMesh,
      ref,
      this.rgbToDuRgba(col),
    );
    return this.flush();
  }

  /**
   * Disposes of the debug drawer and releases resources.
   */
  dispose(): void {
    Raw.Module.destroy(this.debugDrawImpl);
  }

  private rgbToDuRgba(color: number): number {
    // convert hexadecimal rgb color to duRGBA format
    const r = color & 0xff;
    const g = (color >> 8) & 0xff;
    const b = (color >> 16) & 0xff;

    return r | (g << 8) | (b << 16) | (255 << 24);
  }

  private vertex(x: number, y: number, z: number, color: number) {
    const r = (color & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = ((color >> 16) & 0xff) / 255;
    const a = ((color >> 24) & 0xff) / 255;

    this.currentVertices.push([x, y, z, r, g, b, a]);
  }
}
