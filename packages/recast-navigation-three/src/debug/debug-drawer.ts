import {
  type DebugDrawerPrimitive,
  DebugDrawerUtils,
  type NavMesh,
  type NavMeshQuery,
  type RecastCompactHeightfield,
  type RecastContourSet,
  type RecastHeightfield,
  type RecastHeightfieldLayer,
  type RecastHeightfieldLayerSet,
  type RecastPolyMesh,
  type RecastPolyMeshDetail,
} from '@recast-navigation/core';
import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

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

  private debugDrawerUtils: DebugDrawerUtils;

  constructor({
    triMaterial,
    pointMaterial,
    lineMaterial,
  }: DebugDrawerParams = {}) {
    super();

    this.debugDrawerUtils = new DebugDrawerUtils();

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
    this.debugDrawerUtils.dispose();

    this.reset();

    this.pointGeometry.dispose();

    this.triMaterial.dispose();
    this.pointMaterial.dispose();
    this.lineMaterial.dispose();
  }

  private drawPoints(primitive: DebugDrawerPrimitive): void {
    const geometry = this.pointGeometry;

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      this.pointMaterial,
      primitive.vertices.length / 3,
    );

    for (let point = 0; point < primitive.vertices.length / 7; point++) {
      const [x, y, z, r, g, b] = primitive.vertices[point];

      instancedMesh.setMatrixAt(
        point,
        new THREE.Matrix4().setPosition(x, y, z),
      );

      instancedMesh.setColorAt(point, _color.setRGB(r, g, b));
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    this.add(instancedMesh);
  }

  private drawLines(primitive: DebugDrawerPrimitive): void {
    const lineSegmentsGeometry = new LineSegmentsGeometry();

    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < primitive.vertices.length; i += 2) {
      const [x1, y1, z1, r1, g1, b1] = primitive.vertices[i];
      const [x2, y2, z2, r2, g2, b2] = primitive.vertices[i + 1];

      positions.push(x1, y1, z1);
      positions.push(x2, y2, z2);

      colors.push(r1, g1, b1);
      colors.push(r2, g2, b2);
    }

    lineSegmentsGeometry.setPositions(positions);
    lineSegmentsGeometry.setColors(colors);

    const lineSegments = new LineSegments2(
      lineSegmentsGeometry,
      this.lineMaterial,
    );

    this.add(lineSegments);
  }

  private drawTris(primitive: DebugDrawerPrimitive): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(primitive.vertices.length * 3);
    const colors = new Float32Array(primitive.vertices.length * 3);

    for (let i = 0; i < primitive.vertices.length; i++) {
      const [x, y, z, r, g, b] = primitive.vertices[i];

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

  private drawQuads(primitive: DebugDrawerPrimitive): void {
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < primitive.vertices.length; i += 4) {
      const vertices = [
        primitive.vertices[i],
        primitive.vertices[i + 1],
        primitive.vertices[i + 2],
        primitive.vertices[i],
        primitive.vertices[i + 2],
        primitive.vertices[i + 3],
      ];

      for (const [x, y, z, r, g, b] of vertices) {
        positions.push(x, y, z);
        colors.push(r, g, b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3),
    );
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(colors), 3),
    );

    const material = this.triMaterial;

    const mesh = new THREE.Mesh(geometry, material);

    this.add(mesh);
  }
}
