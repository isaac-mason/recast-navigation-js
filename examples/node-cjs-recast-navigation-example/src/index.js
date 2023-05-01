const THREE = require('three');

Promise.all([
  import('recast-navigation'),
  import('recast-navigation/three')
]).then(([Recast, RecastThree]) => {  
  Recast.init().then(() => {
    console.log(RecastThree);

    const navMeshGenerator = new Recast.NavMeshGenerator();

    const groundMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 5));

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

    const { navMesh } = navMeshGenerator.generate(positions, indices, config);

    const navMeshQuery = new Recast.NavMeshQuery({ navMesh });

    const closestPoint = navMeshQuery.getClosestPoint({ x: 2, y: 1, z: 2 });

    console.log(closestPoint.x, closestPoint.y, closestPoint.z);
  });
});
