const THREE = require('three');
const Recast = require('recast-navigation');
const RecastGenerators = require('recast-navigation/generators');
const RecastThree = require('recast-navigation/three');

Recast.init().then(() => {
  console.log(RecastThree);

  const groundMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, 5));

  /**
   * @type {import('recast-navigation/generators').SoloNavMeshGeneratorConfig}
   */
  const config = {
    borderSize: 0,
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

  const { navMesh } = RecastGenerators.generateSoloNavMesh(positions, indices, config);

  const navMeshQuery = new Recast.NavMeshQuery(navMesh);

  const { point: closestPoint } = navMeshQuery.findClosestPoint({ x: 2, y: 1, z: 2 });

  console.log(closestPoint.x, closestPoint.y, closestPoint.z);
});
