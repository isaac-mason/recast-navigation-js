import {
  NavMesh,
  NavMeshQuery,
  Raw,
  RecastCompactHeightfield,
  RecastContourSet,
  RecastHeightfield,
  RecastHeightfieldLayer,
  RecastHeightfieldLayerSet,
  RecastPolyMesh,
  RecastPolyMeshDetail,
} from '@recast-navigation/core';
import * as THREE from 'three';
import {
  LineMaterial,
  LineSegments2,
  LineSegmentsGeometry,
} from 'three/addons';

type VertexData = [
  x: number,
  y: number,
  z: number,
  r: number,
  g: number,
  b: number,
  a: number,
];

const _color = new THREE.Color();

export type DebugDrawerParams = {
  triMaterial?: THREE.Material;
  pointMaterial?: THREE.Material;
  lineMaterial?: LineMaterial;
};

export class DebugDrawer extends THREE.Group {
  triMaterial: THREE.Material;

  pointMaterial: THREE.Material;
  pointGeometry = new THREE.SphereGeometry(0.02, 32, 32);

  lineMaterial: LineMaterial;

  private debugDrawImpl: InstanceType<typeof Raw.Module.DebugDrawImpl>;

  private currentVertices: VertexData[] = [];
  private currentPrimitive = 0;

  constructor({
    triMaterial,
    pointMaterial,
    lineMaterial,
  }: DebugDrawerParams = {}) {
    super();

    this.triMaterial =
      triMaterial ??
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      });

    this.pointMaterial = pointMaterial ?? new THREE.MeshBasicMaterial();

    this.lineMaterial =
      lineMaterial ??
      new LineMaterial({
        color: 0xffffff,
        linewidth: 2,
        vertexColors: true,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -10,
      });

    this.debugDrawImpl = new Raw.Module.DebugDrawImpl();

    this.debugDrawImpl.handleBegin = (primitive: number, _size: number) => {
      this.currentPrimitive = primitive;
      this.currentVertices = [];
    };

    this.debugDrawImpl.handleDepthMask = (_state: number) => {
      // all methods must be implemented for JSImplentation
    };

    this.debugDrawImpl.handleTexture = (_state: number) => {
      // all methods must be implemented for JSImplentation
    };

    this.debugDrawImpl.handleVertexWithColor = (
      x: number,
      y: number,
      z: number,
      color: number
    ) => {
      this.vertex(x, y, z, color);
    };

    this.debugDrawImpl.handleVertexWithColorAndUV = (
      x: number,
      y: number,
      z: number,
      color: number,
      _u: number,
      _v: number
    ) => {
      this.vertex(x, y, z, color);
    };

    this.debugDrawImpl.handleEnd = () => {
      if (this.currentPrimitive === Raw.Module.DU_DRAW_LINES) {
        this.endLines();
      } else if (this.currentPrimitive === Raw.Module.DU_DRAW_TRIS) {
        this.endTris();
      } else if (this.currentPrimitive === Raw.Module.DU_DRAW_QUADS) {
        this.endQuads();
      } else if (this.currentPrimitive === Raw.Module.DU_DRAW_POINTS) {
        this.endPoints();
      }
    };
  }

  drawHeightfieldSolid(hf: RecastHeightfield): void {
    Raw.RecastDebugDraw.debugDrawHeightfieldSolid(this.debugDrawImpl, hf.raw);
  }

  drawHeightfieldWalkable(hf: RecastHeightfield): void {
    Raw.RecastDebugDraw.debugDrawHeightfieldWalkable(
      this.debugDrawImpl,
      hf.raw
    );
  }

  drawCompactHeightfieldSolid(chf: RecastCompactHeightfield): void {
    Raw.RecastDebugDraw.debugDrawCompactHeightfieldSolid(
      this.debugDrawImpl,
      chf.raw
    );
  }

  drawCompactHeightfieldRegions(chf: RecastCompactHeightfield): void {
    Raw.RecastDebugDraw.debugDrawCompactHeightfieldRegions(
      this.debugDrawImpl,
      chf.raw
    );
  }

  drawCompactHeightfieldDistance(chf: RecastCompactHeightfield): void {
    Raw.RecastDebugDraw.debugDrawCompactHeightfieldDistance(
      this.debugDrawImpl,
      chf.raw
    );
  }

  drawHeightfieldLayer(layer: RecastHeightfieldLayer, idx: number): void {
    Raw.RecastDebugDraw.debugDrawHeightfieldLayer(
      this.debugDrawImpl,
      layer.raw,
      idx
    );
  }

  drawHeightfieldLayers(lset: RecastHeightfieldLayerSet): void {
    Raw.RecastDebugDraw.debugDrawHeightfieldLayers(
      this.debugDrawImpl,
      lset.raw
    );
  }

  drawRegionConnections(cset: RecastContourSet, alpha: number = 1): void {
    Raw.RecastDebugDraw.debugDrawRegionConnections(
      this.debugDrawImpl,
      cset.raw,
      alpha
    );
  }

  drawRawContours(cset: RecastContourSet, alpha: number = 1): void {
    Raw.RecastDebugDraw.debugDrawRawContours(
      this.debugDrawImpl,
      cset.raw,
      alpha
    );
  }

  drawContours(cset: RecastContourSet, alpha: number = 1): void {
    Raw.RecastDebugDraw.debugDrawContours(this.debugDrawImpl, cset.raw, alpha);
  }

  drawPolyMesh(mesh: RecastPolyMesh): void {
    Raw.RecastDebugDraw.debugDrawPolyMesh(this.debugDrawImpl, mesh.raw);
  }

  drawPolyMeshDetail(dmesh: RecastPolyMeshDetail): void {
    Raw.RecastDebugDraw.debugDrawPolyMeshDetail(this.debugDrawImpl, dmesh.raw);
  }

  drawNavMesh(mesh: NavMesh, flags: number = 0): void {
    Raw.DetourDebugDraw.debugDrawNavMesh(
      this.debugDrawImpl,
      mesh.raw.getNavMesh(),
      flags
    );
  }

  drawNavMeshWithClosedList(
    mesh: NavMesh,
    query: NavMeshQuery,
    flags: number = 0
  ): void {
    Raw.DetourDebugDraw.debugDrawNavMeshWithClosedList(
      this.debugDrawImpl,
      mesh.raw.m_navMesh,
      query.raw.m_navQuery,
      flags
    );
  }

  drawNavMeshNodes(query: NavMeshQuery): void {
    Raw.DetourDebugDraw.debugDrawNavMeshNodes(
      this.debugDrawImpl,
      query.raw.m_navQuery
    );
  }

  drawNavMeshBVTree(mesh: NavMesh): void {
    Raw.DetourDebugDraw.debugDrawNavMeshBVTree(
      this.debugDrawImpl,
      mesh.raw.m_navMesh
    );
  }

  drawNavMeshPortals(mesh: NavMesh): void {
    Raw.DetourDebugDraw.debugDrawNavMeshPortals(
      this.debugDrawImpl,
      mesh.raw.m_navMesh
    );
  }

  drawNavMeshPolysWithFlags(mesh: NavMesh, flags: number, col: number): void {
    Raw.DetourDebugDraw.debugDrawNavMeshPolysWithFlags(
      this.debugDrawImpl,
      mesh.raw.m_navMesh,
      flags,
      col
    );
  }

  drawNavMeshPoly(mesh: NavMesh, ref: number, col: number): void {
    Raw.DetourDebugDraw.debugDrawNavMeshPoly(
      this.debugDrawImpl,
      mesh.raw.m_navMesh,
      ref,
      col
    );
  }

  // todo:
  // - drawTileCacheLayerAreas
  // - drawTileCacheLayerRegions
  // - drawTileCacheContours
  // - drawTileCachePolyMesh

  reset(): void {
    for (const child of this.children) {
      if (child instanceof THREE.Mesh || child instanceof LineSegments2) {
        child.geometry.dispose();
      }
    }

    this.clear();
  }

  dispose(): void {
    this.reset();

    Raw.Module.destroy(this.debugDrawImpl);
    
    this.pointGeometry.dispose();

    this.triMaterial.dispose();
    this.pointMaterial.dispose();
    this.lineMaterial.dispose();
  }

  private vertex(x: number, y: number, z: number, color: number) {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    const a = ((color >> 24) & 0xff) / 255;

    this.currentVertices.push([x, y, z, r, g, b, a]);
  }

  private endPoints(): void {
    const geometry = this.pointGeometry;

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      this.pointMaterial,
      this.currentVertices.length
    );

    for (let i = 0; i < this.currentVertices.length; i++) {
      const [x, y, z, r, g, b] = this.currentVertices[i];

      instancedMesh.setMatrixAt(i, new THREE.Matrix4().setPosition(x, y, z));

      instancedMesh.setColorAt(i, _color.setRGB(r, g, b));
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    this.add(instancedMesh);
  }

  private endLines(): void {
    const lineSegmentsGeometry = new LineSegmentsGeometry();

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < this.currentVertices.length; i += 2) {
      const [x1, y1, z1, r1, g1, b1] = this.currentVertices[i];
      const [x2, y2, z2, r2, g2, b2] = this.currentVertices[i + 1];

      positions.push(x1, y1, z1);
      positions.push(x2, y2, z2);

      colors.push(r1, g1, b1);
      colors.push(r2, g2, b2);
    }

    lineSegmentsGeometry.setPositions(positions);
    lineSegmentsGeometry.setColors(colors);

    const lineSegments = new LineSegments2(
      lineSegmentsGeometry,
      this.lineMaterial
    );

    this.add(lineSegments);
  }

  private endTris(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.currentVertices.length * 3);
    const colors = new Float32Array(this.currentVertices.length * 3);

    for (let i = 0; i < this.currentVertices.length; i++) {
      const [x, y, z, r, g, b] = this.currentVertices[i];
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3 + 0] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = this.triMaterial;
    const mesh = new THREE.Mesh(geometry, material);

    this.add(mesh);
  }

  private endQuads(): void {
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < this.currentVertices.length; i += 4) {
      const vertices = [
        this.currentVertices[i],
        this.currentVertices[i + 1],
        this.currentVertices[i + 2],

        this.currentVertices[i],
        this.currentVertices[i + 2],
        this.currentVertices[i + 3],
      ];

      for (const [x, y, z, r, g, b] of vertices) {
        positions.push(x, y, z);
        colors.push(r, g, b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(colors), 3)
    );

    const material = this.triMaterial;

    const mesh = new THREE.Mesh(geometry, material);

    this.add(mesh);
  }
}
