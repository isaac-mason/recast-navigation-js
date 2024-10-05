import {
  Color,
  Entity,
  GraphicsDevice,
  Material,
  Mesh,
  MeshInstance,
  PRIMITIVE_LINES,
  StandardMaterial,
  Vec3,
  createMesh,
} from 'playcanvas';

/**
 * Parameters for creating OffMeshConnectionsHelper.
 */
export type OffMeshConnectionsHelperParams = {
  offMeshConnections?: OffMeshConnectionParams[];
  entryCircleMaterial?: Material;
  exitCircleMaterial?: Material;
  lineMaterial?: Material;
};

/**
 * Represents an off-mesh connection between two points.
 */
export type OffMeshConnectionParams = {
  startPosition: Vec3;
  endPosition: Vec3;
  radius: number;
  bidirectional: boolean;
};

export class OffMeshConnectionsHelper extends Entity {
  offMeshConnections: OffMeshConnectionParams[];

  entryCircleMaterial: Material;

  exitCircleMaterial: Material;

  lineMaterial: Material;

  constructor(params: OffMeshConnectionsHelperParams) {
    super();

    this.offMeshConnections = params.offMeshConnections || [];

    // Initialize materials
    if (params.entryCircleMaterial) {
      this.entryCircleMaterial = params.entryCircleMaterial;
    } else {
      this.entryCircleMaterial = new StandardMaterial();

      if ('diffuse' in this.entryCircleMaterial) {
        this.entryCircleMaterial.diffuse = new Color(0, 1, 0); // Green
      }

      if ('useLighting' in this.entryCircleMaterial) {
        this.entryCircleMaterial.useLighting = false;
      }

      this.entryCircleMaterial.update();
    }

    this.exitCircleMaterial =
      params.exitCircleMaterial || new StandardMaterial();

    if (params.exitCircleMaterial) {
      this.exitCircleMaterial = params.exitCircleMaterial;
    } else {
      if ('diffuse' in this.exitCircleMaterial) {
        this.exitCircleMaterial.diffuse = new Color(0, 0, 1); // Blue
      }
      if ('useLighting' in this.exitCircleMaterial) {
        this.exitCircleMaterial.useLighting = false;
      }
      this.exitCircleMaterial.update();
    }

    if (params.lineMaterial) {
      this.lineMaterial = params.lineMaterial;
    } else {
      this.lineMaterial = new StandardMaterial();
      if ('diffuse' in this.lineMaterial) {
        this.lineMaterial.diffuse = new Color(1, 0, 0); // Red
      }
      if ('useLighting' in this.lineMaterial) {
        this.lineMaterial.useLighting = false;
      }
      this.lineMaterial.update();
    }

    this.updateHelper();
  }

  /**
   * Updates the visual representation of the off-mesh connections.
   */
  updateHelper() {
    // Remove all child entities
    while (this.children.length > 0) {
      this.children[0].destroy();
    }

    const graphicsDevice = (this as any).app.graphicsDevice;

    for (const offMeshConnection of this.offMeshConnections) {
      // Create circle mesh at start position
      const circleMesh = createCircleMesh(
        graphicsDevice,
        offMeshConnection.radius,
        16
      );
      const circleEntity = new Entity();
      circleEntity.addComponent('render', {
        meshInstances: [new MeshInstance(circleMesh, this.entryCircleMaterial)],
      });
      circleEntity.setPosition(offMeshConnection.startPosition);
      circleEntity.setLocalEulerAngles(-90, 0, 0); // Rotate to lie flat on XZ plane
      this.addChild(circleEntity);

      // Create circle mesh at end position
      const endCircleEntity = new Entity();
      endCircleEntity.addComponent('render', {
        meshInstances: [
          new MeshInstance(
            circleMesh,
            offMeshConnection.bidirectional
              ? this.entryCircleMaterial
              : this.exitCircleMaterial
          ),
        ],
      });
      endCircleEntity.setPosition(offMeshConnection.endPosition);
      endCircleEntity.setLocalEulerAngles(-90, 0, 0); // Rotate to lie flat on XZ plane
      this.addChild(endCircleEntity);

      // Create curve between points
      const start = offMeshConnection.startPosition.clone();
      const end = offMeshConnection.endPosition.clone();
      const middle = new Vec3().add2(start, end).mulScalar(0.5);
      middle.y *= 1.2; // Elevate the middle point for a curve effect

      // Generate points along a quadratic Bezier curve
      const curvePoints = generateBezierCurve([start, middle, end], 50);

      // Create line mesh
      const lineMesh = createLineMesh(graphicsDevice, curvePoints);

      const lineEntity = new Entity();
      lineEntity.addComponent('render', {
        meshInstances: [new MeshInstance(lineMesh, this.lineMaterial)],
      });
      this.addChild(lineEntity);
    }
  }
}

/**
 * Creates a circle mesh.
 * @param {GraphicsDevice} graphicsDevice - The graphics device.
 * @param {number} radius - Radius of the circle.
 * @param {number} segments - Number of segments.
 * @returns {Mesh} - The circle mesh.
 */
function createCircleMesh(
  graphicsDevice: GraphicsDevice,
  radius: number,
  segments: number
): Mesh {
  const positions: number[] = [];
  const indices: number[] = [];

  // Create circle vertices
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    positions.push(x, 0, z);
  }

  // Center point
  positions.push(0, 0, 0);
  const centerIndex = positions.length / 3 - 1;

  // Create indices
  for (let i = 0; i < segments; i++) {
    indices.push(i, (i + 1) % segments, centerIndex);
  }

  return createMesh(graphicsDevice, positions, {
    indices: indices,
  });
}

/**
 * Generates points along a quadratic Bezier curve.
 * @param {Vec3[]} points - Control points.
 * @param {number} numPoints - Number of points to generate.
 * @returns {Vec3[]} - Points along the curve.
 */
function generateBezierCurve(points: Vec3[], numPoints: number): Vec3[] {
  const curvePoints: Vec3[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const point = bezierQuadratic(points[0], points[1], points[2], t);
    curvePoints.push(point);
  }
  return curvePoints;
}

/**
 * Computes a point on a quadratic Bezier curve.
 * @param {Vec3} p0 - Start point.
 * @param {Vec3} p1 - Control point.
 * @param {Vec3} p2 - End point.
 * @param {number} t - Parameter between 0 and 1.
 * @returns {Vec3} - Point on the curve.
 */
function bezierQuadratic(p0: Vec3, p1: Vec3, p2: Vec3, t: number): Vec3 {
  const oneMinusT = 1 - t;
  const x =
    oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x;
  const y =
    oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y;
  const z =
    oneMinusT * oneMinusT * p0.z + 2 * oneMinusT * t * p1.z + t * t * p2.z;
  return new Vec3(x, y, z);
}

/**
 * Creates a line mesh from an array of points.
 * @param {GraphicsDevice} graphicsDevice - The graphics device.
 * @param {Vec3[]} points - Points of the line.
 * @returns {Mesh} - The line mesh.
 */
function createLineMesh(graphicsDevice: GraphicsDevice, points: Vec3[]): Mesh {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < points.length; i++) {
    positions.push(points[i].x, points[i].y, points[i].z);
  }

  for (let i = 0; i < points.length - 1; i++) {
    indices.push(i, i + 1);
  }

  return createMesh(graphicsDevice, positions, {
    indices: indices,
    primitiveType: PRIMITIVE_LINES,
  });
}
