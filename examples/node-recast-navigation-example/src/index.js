import { init, NavMesh } from 'recast-navigation';
import { BoxGeometry, Mesh } from 'three';

await init();

const navMesh = new NavMesh();

const groundMesh = new Mesh(new BoxGeometry(5, 0.5, 5));

/**
 * @type {import('recast-navigation').NavMeshConfig}
 */
const config = {
  borderSize: 0,
  tileSize: 0,
  cs: 0.2,
  ch: 0.2,
  walkableSlopeAngle: 35,
  walkableHeight: 1,
  walkableClimb: 1,
  walkableRadius: 1,
  maxEdgeLen: 12,
  maxSimplificationError: 1.3,
  minRegionArea: 8,
  mergeRegionArea: 20,
  maxVertsPerPoly: 6,
  detailSampleDist: 6,
  detailSampleMaxError: 1,
};

const positions = groundMesh.geometry.attributes.position.array;
const indices = groundMesh.geometry.index.array;

navMesh.build(positions, indices, config);

const closestPoint = navMesh.getClosestPoint({ x: 2, y: 1, z: 2 });

console.log(closestPoint.x, closestPoint.y, closestPoint.z);
