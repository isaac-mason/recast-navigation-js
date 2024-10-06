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
import {
  AppBase,
  BLEND_NORMAL,
  BUFFER_STATIC,
  Color,
  Entity,
  GraphicsDevice,
  Mesh,
  MeshInstance,
  PRIMITIVE_LINES,
  PRIMITIVE_POINTS,
  PRIMITIVE_TRIANGLES,
  SEMANTIC_COLOR,
  SEMANTIC_POSITION,
  StandardMaterial,
  TYPE_FLOAT32,
  VertexBuffer,
  VertexFormat,
} from 'playcanvas';

/**
 * Represents a vertex with position and color data.
 */
type VertexData = {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  a: number;
};

/**
 * Parameters for creating DebugDrawer.
 */
export type DebugDrawerParams = {
  app: AppBase;
  triMaterial?: StandardMaterial;
  pointMaterial?: StandardMaterial;
  lineMaterial?: StandardMaterial;
};

/**
 * Represents a helper class to visualize navigation meshes and related data in PlayCanvas.
 */
export class DebugDrawer extends Entity {
  triMaterial: StandardMaterial;
  pointMaterial: StandardMaterial;
  lineMaterial: StandardMaterial;

  private graphicsDevice: GraphicsDevice;
  private debugDrawImpl: any; // Replace 'any' with the actual type if available
  private currentVertices: VertexData[] = [];
  private currentPrimitive: number = 0;

  constructor(graphicsDevice: GraphicsDevice, params?: DebugDrawerParams) {
    super();

    this.graphicsDevice = graphicsDevice;

    if (params?.triMaterial) {
      this.triMaterial = params.triMaterial;
    } else {
      this.triMaterial = new StandardMaterial();
      this.triMaterial.useLighting = false;
      this.triMaterial.diffuse = new Color(1, 1, 1);
      this.triMaterial.opacity = 0.4;
      this.triMaterial.blendType = BLEND_NORMAL;
      this.triMaterial.depthWrite = false;
      this.triMaterial.update();
    }

    if (params?.pointMaterial) {
      this.pointMaterial = params.pointMaterial;
    } else {
      this.pointMaterial = new StandardMaterial();
      this.pointMaterial.useLighting = false;
      this.pointMaterial.update();
    }

    if (params?.lineMaterial) {
      this.lineMaterial = params.lineMaterial;
    } else {
      this.lineMaterial = new StandardMaterial();
      this.lineMaterial.useLighting = false;
      this.lineMaterial.diffuse = new Color(1, 1, 1);
      this.lineMaterial.emissive = new Color(1, 1, 1);
      this.lineMaterial.update();
    }

    this.debugDrawImpl = new Raw.Module.DebugDrawImpl();

    // Bind the debug draw implementation handlers
    this.debugDrawImpl.handleBegin = (primitive: number, _size: number) => {
      this.currentPrimitive = primitive;
      this.currentVertices = [];
    };

    this.debugDrawImpl.handleDepthMask = (_state: number) => {
      // Implement if necessary
    };

    this.debugDrawImpl.handleTexture = (_state: number) => {
      // Implement if necessary
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

  // Implement other drawing methods similarly...

  /**
   * Resets the debug drawer by removing all child entities.
   */
  reset(): void {
    while (this.children.length > 0) {
      const child = this.children[0];
      if (child instanceof Entity) {
        child.destroy();
      } else {
        this.removeChild(child);
      }
    }
  }

  /**
   * Disposes of the debug drawer and releases resources.
   */
  dispose(): void {
    this.reset();
    Raw.Module.destroy(this.debugDrawImpl);
    // Dispose materials if necessary
  }

  private vertex(x: number, y: number, z: number, color: number) {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    const a = ((color >> 24) & 0xff) / 255;

    this.currentVertices.push({ x, y, z, r, g, b, a });
  }

  private endPoints(): void {
    const graphicsDevice = this.graphicsDevice;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < this.currentVertices.length; i++) {
      const vertex = this.currentVertices[i];
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(vertex.r, vertex.g, vertex.b, vertex.a);
    }

    const mesh = createPointMesh(graphicsDevice, positions, colors);
    const meshInstance = new MeshInstance(mesh, this.pointMaterial);
    const entity = new Entity();
    entity.addComponent('render', {
      meshInstances: [meshInstance],
    });
    this.addChild(entity);
  }

  private endLines(): void {
    const graphicsDevice = this.graphicsDevice;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < this.currentVertices.length; i++) {
      const vertex = this.currentVertices[i];
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(vertex.r, vertex.g, vertex.b, vertex.a);
    }

    const mesh = createLineMesh(graphicsDevice, positions, colors);
    const meshInstance = new MeshInstance(mesh, this.lineMaterial);
    const entity = new Entity();
    entity.addComponent('render', {
      meshInstances: [meshInstance],
    });
    this.addChild(entity);
  }

  private endTris(): void {
    const graphicsDevice = this.graphicsDevice;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < this.currentVertices.length; i++) {
      const vertex = this.currentVertices[i];
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(vertex.r, vertex.g, vertex.b, vertex.a);
    }

    const mesh = createTriangleMesh(graphicsDevice, positions, colors);
    const meshInstance = new MeshInstance(mesh, this.triMaterial);
    const entity = new Entity();
    entity.addComponent('render', {
      meshInstances: [meshInstance],
    });
    this.addChild(entity);
  }

  private endQuads(): void {
    // Quads are converted to triangles
    const graphicsDevice = this.graphicsDevice;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < this.currentVertices.length; i += 4) {
      const v0 = this.currentVertices[i];
      const v1 = this.currentVertices[i + 1];
      const v2 = this.currentVertices[i + 2];
      const v3 = this.currentVertices[i + 3];

      // First triangle (v0, v1, v2)
      positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      colors.push(
        v0.r,
        v0.g,
        v0.b,
        v0.a,
        v1.r,
        v1.g,
        v1.b,
        v1.a,
        v2.r,
        v2.g,
        v2.b,
        v2.a
      );

      // Second triangle (v0, v2, v3)
      positions.push(v0.x, v0.y, v0.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
      colors.push(
        v0.r,
        v0.g,
        v0.b,
        v0.a,
        v2.r,
        v2.g,
        v2.b,
        v2.a,
        v3.r,
        v3.g,
        v3.b,
        v3.a
      );
    }

    const mesh = createTriangleMesh(graphicsDevice, positions, colors);
    const meshInstance = new MeshInstance(mesh, this.triMaterial);
    const entity = new Entity();
    entity.addComponent('render', {
      meshInstances: [meshInstance],
    });
    this.addChild(entity);
  }
}

/**
 * Creates a point mesh.
 */
function createPointMesh(
  graphicsDevice: GraphicsDevice,
  positions: number[],
  colors: number[]
): Mesh {
  const vertexFormat = new VertexFormat(graphicsDevice, [
    { semantic: SEMANTIC_POSITION, components: 3, type: TYPE_FLOAT32 },
    { semantic: SEMANTIC_COLOR, components: 4, type: TYPE_FLOAT32 },
  ]);

  const vertexCount = positions.length / 3;
  const vertexBuffer = new VertexBuffer(
    graphicsDevice,
    vertexFormat,
    vertexCount,
    { usage: BUFFER_STATIC }
  );

  const vertexData = new Float32Array(vertexBuffer.lock());
  for (let i = 0; i < vertexCount; i++) {
    vertexData[i * 7 + 0] = positions[i * 3 + 0];
    vertexData[i * 7 + 1] = positions[i * 3 + 1];
    vertexData[i * 7 + 2] = positions[i * 3 + 2];
    vertexData[i * 7 + 3] = colors[i * 4 + 0];
    vertexData[i * 7 + 4] = colors[i * 4 + 1];
    vertexData[i * 7 + 5] = colors[i * 4 + 2];
    vertexData[i * 7 + 6] = colors[i * 4 + 3];
  }
  vertexBuffer.unlock();

  const mesh = new Mesh(graphicsDevice);
  mesh.vertexBuffer = vertexBuffer;
  mesh.primitive[0].type = PRIMITIVE_POINTS;
  mesh.primitive[0].base = 0;
  mesh.primitive[0].count = vertexCount;
  mesh.primitive[0].indexed = false;

  return mesh;
}

/**
 * Creates a line mesh.
 */
function createLineMesh(
  graphicsDevice: GraphicsDevice,
  positions: number[],
  colors: number[]
): Mesh {
  const vertexFormat = new VertexFormat(graphicsDevice, [
    { semantic: SEMANTIC_POSITION, components: 3, type: TYPE_FLOAT32 },
    { semantic: SEMANTIC_COLOR, components: 4, type: TYPE_FLOAT32 },
  ]);

  const vertexCount = positions.length / 3;
  const vertexBuffer = new VertexBuffer(
    graphicsDevice,
    vertexFormat,
    vertexCount,
    { usage: BUFFER_STATIC }
  );

  const vertexData = new Float32Array(vertexBuffer.lock());
  for (let i = 0; i < vertexCount; i++) {
    vertexData[i * 7 + 0] = positions[i * 3 + 0];
    vertexData[i * 7 + 1] = positions[i * 3 + 1];
    vertexData[i * 7 + 2] = positions[i * 3 + 2];
    vertexData[i * 7 + 3] = colors[i * 4 + 0];
    vertexData[i * 7 + 4] = colors[i * 4 + 1];
    vertexData[i * 7 + 5] = colors[i * 4 + 2];
    vertexData[i * 7 + 6] = colors[i * 4 + 3];
  }
  vertexBuffer.unlock();

  const mesh = new Mesh(graphicsDevice);
  mesh.vertexBuffer = vertexBuffer;
  mesh.primitive[0].type = PRIMITIVE_LINES;
  mesh.primitive[0].base = 0;
  mesh.primitive[0].count = vertexCount;
  mesh.primitive[0].indexed = false;

  return mesh;
}

/**
 * Creates a triangle mesh.
 */
function createTriangleMesh(
  graphicsDevice: GraphicsDevice,
  positions: number[],
  colors: number[]
): Mesh {
  const vertexFormat = new VertexFormat(graphicsDevice, [
    { semantic: SEMANTIC_POSITION, components: 3, type: TYPE_FLOAT32 },
    { semantic: SEMANTIC_COLOR, components: 4, type: TYPE_FLOAT32 },
  ]);

  const vertexCount = positions.length / 3;
  const vertexBuffer = new VertexBuffer(
    graphicsDevice,
    vertexFormat,
    vertexCount,
    { usage: BUFFER_STATIC }
  );

  const vertexData = new Float32Array(vertexBuffer.lock());
  for (let i = 0; i < vertexCount; i++) {
    vertexData[i * 7 + 0] = positions[i * 3 + 0];
    vertexData[i * 7 + 1] = positions[i * 3 + 1];
    vertexData[i * 7 + 2] = positions[i * 3 + 2];
    vertexData[i * 7 + 3] = colors[i * 4 + 0];
    vertexData[i * 7 + 4] = colors[i * 4 + 1];
    vertexData[i * 7 + 5] = colors[i * 4 + 2];
    vertexData[i * 7 + 6] = colors[i * 4 + 3];
  }
  vertexBuffer.unlock();

  const mesh = new Mesh(graphicsDevice);
  mesh.vertexBuffer = vertexBuffer;
  mesh.primitive[0].type = PRIMITIVE_TRIANGLES;
  mesh.primitive[0].base = 0;
  mesh.primitive[0].count = vertexCount;
  mesh.primitive[0].indexed = false;

  return mesh;
}
