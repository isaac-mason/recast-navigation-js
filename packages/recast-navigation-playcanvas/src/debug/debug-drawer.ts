import {
  DebugDrawerPrimitive,
  DebugDrawerUtils,
  NavMesh,
  NavMeshQuery,
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

  private debugDrawerUtils: DebugDrawerUtils;
  private graphicsDevice: GraphicsDevice;

  constructor(graphicsDevice: GraphicsDevice, params?: DebugDrawerParams) {
    super();

    this.debugDrawerUtils = new DebugDrawerUtils();

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
  }

  drawPrimitives(primitives: DebugDrawerPrimitive[]): void {
    for (const primitive of primitives) {
      switch (primitive.type) {
        case 'points':
          this.drawPoints(primitive);
          break;
        case 'lines':
          this.drawLines(primitive);
          break;
        case 'tris':
          this.drawTris(primitive);
          break;
        case 'quads':
          this.drawQuads(primitive);
          break;
      }
    }
  }

  drawHeightfieldSolid(hf: RecastHeightfield): void {
    const primitives = this.debugDrawerUtils.drawHeightfieldSolid(hf);
    this.drawPrimitives(primitives);
  }

  drawHeightfieldWalkable(hf: RecastHeightfield): void {
    const primitives = this.debugDrawerUtils.drawHeightfieldWalkable(hf);
    this.drawPrimitives(primitives);
  }

  drawCompactHeightfieldSolid(chf: RecastCompactHeightfield): void {
    const primitives = this.debugDrawerUtils.drawCompactHeightfieldSolid(chf);
    this.drawPrimitives(primitives);
  }

  drawCompactHeightfieldRegions(chf: RecastCompactHeightfield): void {
    const primitives = this.debugDrawerUtils.drawCompactHeightfieldRegions(chf);
    this.drawPrimitives(primitives);
  }

  drawCompactHeightfieldDistance(chf: RecastCompactHeightfield): void {
    const primitives =
      this.debugDrawerUtils.drawCompactHeightfieldDistance(chf);
    this.drawPrimitives(primitives);
  }

  drawHeightfieldLayer(layer: RecastHeightfieldLayer, idx: number): void {
    const primitives = this.debugDrawerUtils.drawHeightfieldLayer(layer, idx);
    this.drawPrimitives(primitives);
  }

  drawHeightfieldLayers(lset: RecastHeightfieldLayerSet): void {
    const primitives = this.debugDrawerUtils.drawHeightfieldLayers(lset);
    this.drawPrimitives(primitives);
  }

  drawRegionConnections(cset: RecastContourSet, alpha: number = 1): void {
    const primitives = this.debugDrawerUtils.drawRegionConnections(cset, alpha);
    this.drawPrimitives(primitives);
  }

  drawRawContours(cset: RecastContourSet, alpha: number = 1): void {
    const primitives = this.debugDrawerUtils.drawRawContours(cset, alpha);
    this.drawPrimitives(primitives);
  }

  drawContours(cset: RecastContourSet, alpha: number = 1): void {
    const primitives = this.debugDrawerUtils.drawContours(cset, alpha);
    this.drawPrimitives(primitives);
  }

  drawPolyMesh(mesh: RecastPolyMesh): void {
    const primitives = this.debugDrawerUtils.drawPolyMesh(mesh);
    this.drawPrimitives(primitives);
  }

  drawPolyMeshDetail(dmesh: RecastPolyMeshDetail): void {
    const primitives = this.debugDrawerUtils.drawPolyMeshDetail(dmesh);
    this.drawPrimitives(primitives);
  }

  drawNavMesh(mesh: NavMesh, flags: number = 0): void {
    const primitives = this.debugDrawerUtils.drawNavMesh(mesh, flags);
    this.drawPrimitives(primitives);
  }

  drawNavMeshWithClosedList(
    mesh: NavMesh,
    query: NavMeshQuery,
    flags: number = 0,
  ): void {
    const primitives = this.debugDrawerUtils.drawNavMeshWithClosedList(
      mesh,
      query,
      flags,
    );
    this.drawPrimitives(primitives);
  }

  drawNavMeshNodes(query: NavMeshQuery): void {
    const primitives = this.debugDrawerUtils.drawNavMeshNodes(query);
    this.drawPrimitives(primitives);
  }

  drawNavMeshBVTree(mesh: NavMesh): void {
    const primitives = this.debugDrawerUtils.drawNavMeshBVTree(mesh);
    this.drawPrimitives(primitives);
  }

  drawNavMeshPortals(mesh: NavMesh): void {
    const primitives = this.debugDrawerUtils.drawNavMeshPortals(mesh);
    this.drawPrimitives(primitives);
  }

  drawNavMeshPolysWithFlags(mesh: NavMesh, flags: number, col: number): void {
    const primitives = this.debugDrawerUtils.drawNavMeshPolysWithFlags(
      mesh,
      flags,
      col,
    );
    this.drawPrimitives(primitives);
  }

  drawNavMeshPoly(mesh: NavMesh, ref: number, col: number): void {
    const primitives = this.debugDrawerUtils.drawNavMeshPoly(mesh, ref, col);
    this.drawPrimitives(primitives);
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
    this.debugDrawerUtils.dispose();
    this.reset();
  }

  private drawPoints(primitive: DebugDrawerPrimitive): void {
    const graphicsDevice = this.graphicsDevice;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < primitive.vertices.length; i++) {
      const [x, y, z, r, g, b, a] = primitive.vertices[i];
      positions.push(x, y, z);
      colors.push(r, g, b, a);
    }

    const mesh = createPointMesh(graphicsDevice, positions, colors);
    const meshInstance = new MeshInstance(mesh, this.pointMaterial);
    const entity = new Entity();
    entity.addComponent('render', {
      meshInstances: [meshInstance],
    });
    this.addChild(entity);
  }

  private drawLines(primitive: DebugDrawerPrimitive): void {
    const graphicsDevice = this.graphicsDevice;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < primitive.vertices.length; i++) {
      const [x, y, z, r, g, b, a] = primitive.vertices[i];
      positions.push(x, y, z);
      colors.push(r, g, b, a);
    }

    const mesh = createLineMesh(graphicsDevice, positions, colors);
    const meshInstance = new MeshInstance(mesh, this.lineMaterial);
    const entity = new Entity();
    entity.addComponent('render', {
      meshInstances: [meshInstance],
    });
    this.addChild(entity);
  }

  private drawTris(primitive: DebugDrawerPrimitive): void {
    const graphicsDevice = this.graphicsDevice;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < primitive.vertices.length; i++) {
      const [x, y, z, r, g, b, a] = primitive.vertices[i];
      positions.push(x, y, z);
      colors.push(r, g, b, a);
    }

    const mesh = createTriangleMesh(graphicsDevice, positions, colors);
    const meshInstance = new MeshInstance(mesh, this.triMaterial);
    const entity = new Entity();
    entity.addComponent('render', {
      meshInstances: [meshInstance],
    });
    this.addChild(entity);
  }

  private drawQuads(primitive: DebugDrawerPrimitive): void {
    // Quads are converted to triangles
    const graphicsDevice = this.graphicsDevice;

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < primitive.vertices.length; i += 4) {
      const [x0, y0, z0, r0, g0, b0, a0] = primitive.vertices[i];
      const [x1, y1, z1, r1, g1, b1, a1] = primitive.vertices[i + 1];
      const [x2, y2, z2, r2, g2, b2, a2] = primitive.vertices[i + 2];
      const [x3, y3, z3, r3, g3, b3, a3] = primitive.vertices[i + 3];

      // First triangle (v0, v1, v2)
      positions.push(x0, y0, z0, x1, y1, z1, x2, y2, z2);
      colors.push(r0, g0, b0, a0, r1, g1, b1, a1, r2, g2, b2, a2);

      // Second triangle (v0, v2, v3)
      positions.push(x0, y0, z0, x2, y2, z2, x3, y3, z3);
      colors.push(r0, g0, b0, a0, r2, g2, b2, a2, r3, g3, b3, a3);
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
  colors: number[],
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
    { usage: BUFFER_STATIC },
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
  colors: number[],
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
    { usage: BUFFER_STATIC },
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
  colors: number[],
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
    { usage: BUFFER_STATIC },
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
