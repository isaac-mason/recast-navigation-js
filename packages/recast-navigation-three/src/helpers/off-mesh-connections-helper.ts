import { OffMeshConnection } from '@recast-navigation/core';
import {
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';

export type OffMeshConnectionsHelperParams = {
  offMeshConnections?: OffMeshConnection[];
  entryCircleMaterial?: Material;
  exitCircleMaterial?: Material;
  lineMaterial?: LineBasicMaterial;
};

export class OffMeshConnectionsHelper extends Object3D {
  offMeshConnections: OffMeshConnection[];

  entryCircleMaterial: Material;

  exitCircleMaterial: Material;

  lineMaterial: LineBasicMaterial;

  constructor({
    offMeshConnections,
    entryCircleMaterial,
    exitCircleMaterial,
    lineMaterial,
  }: OffMeshConnectionsHelperParams) {
    super();

    this.offMeshConnections = offMeshConnections ?? [];

    this.entryCircleMaterial =
      entryCircleMaterial ?? new MeshBasicMaterial({ color: 'green' });

    this.exitCircleMaterial =
      exitCircleMaterial ?? new MeshBasicMaterial({ color: 'blue' });

    this.lineMaterial = lineMaterial ?? new LineBasicMaterial({ color: 'red' });

    this.update();
  }

  /**
   * Update the three debug view of the off mesh connections.
   */
  update() {
    this.clear();

    for (const offMeshConnection of this.offMeshConnections) {
      // start and end circles
      const circleGeometry = new CircleGeometry(offMeshConnection.radius, 16);

      const startMesh = new Mesh(circleGeometry, this.entryCircleMaterial);
      startMesh.position.copy(offMeshConnection.startPosition as Vector3);
      startMesh.position.y += 0.001;
      startMesh.rotation.x = -Math.PI / 2;
      this.add(startMesh);

      const endMesh = new Mesh(
        circleGeometry,
        offMeshConnection.bidirectional
          ? this.entryCircleMaterial
          : this.exitCircleMaterial
      );
      endMesh.position.copy(offMeshConnection.endPosition as Vector3);
      endMesh.position.y += 0.001;
      endMesh.rotation.x = -Math.PI / 2;
      this.add(endMesh);

      // line between points
      const start = new Vector3().copy(
        offMeshConnection.startPosition as Vector3
      );
      const end = new Vector3().copy(offMeshConnection.endPosition as Vector3);

      const middle = new Vector3().addVectors(start, end).multiplyScalar(0.5);
      middle.y *= 1.2;

      const curve = new CatmullRomCurve3([start, middle, end]);
      const curvePoints = curve.getPoints(50);

      const lineGeometry = new BufferGeometry().setFromPoints(curvePoints);
      const line = new Line(lineGeometry, this.lineMaterial);

      this.add(line);
    }
  }
}
