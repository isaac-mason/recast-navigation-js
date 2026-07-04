import {
    init,
    NavMeshQuery,
    Detour,
    statusDetail,
    statusToReadableString,
} from 'recast-navigation';
import { threeToTileCache, TileCacheHelper, DebugDrawer } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { createLine } from './common/line';

await init();

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(0, 28, 28);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.set(0, 0, 0);

/* procedural ground */
const meshes: THREE.Mesh[] = [];

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 25),
    new THREE.MeshStandardMaterial({ color: '#ccc' }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
meshes.push(ground);

/* generate the tile cache nav mesh */
const { success, navMesh, tileCache } = threeToTileCache(meshes, {
    ch: 0.05,
    cs: 0.1,
    tileSize: 32,
});

if (!success || !navMesh || !tileCache) {
    throw new Error('failed to generate nav mesh');
}

const navMeshQuery = new NavMeshQuery(navMesh);

/* nav mesh debug drawer */
const navMeshDebug = new DebugDrawer();
navMeshDebug.position.y += 0.01;
scene.add(navMeshDebug);

function redrawNavMesh() {
    navMeshDebug.reset();
    navMeshDebug.drawNavMesh(navMesh!);
}

/* tile cache helper (draws obstacles) */
const tileCacheHelper = new TileCacheHelper(tileCache, {
    obstacleMaterial: new THREE.MeshBasicMaterial({ color: 'red', wireframe: true }),
});
tileCacheHelper.position.y += 0.01;
scene.add(tileCacheHelper);

/* full tile cache update helper */
function fullUpdate() {
    let upToDate = false;
    while (!upToDate) {
        const result = tileCache!.update(navMesh!);
        upToDate = result.upToDate;
        console.log(
            'tileCache.update status:',
            statusToReadableString(result.status),
        );
    }
}

/* create a grid of alternating box and cylinder obstacles */
const boxObstacleSize = new THREE.Vector3(0.3, 1, 0.3);
const cylinderRadius = 0.3;

let obstacles = 0;
for (let x = -10; x < 10; x += 2) {
    for (let z = -10; z < 10; z += 2) {
        obstacles += 1;

        const obstaclePosition = new THREE.Vector3(x, 0, z);

        const createObstacle = () => {
            if (obstacles % 2 === 0) {
                return tileCache.addBoxObstacle(
                    obstaclePosition,
                    boxObstacleSize,
                    0.2,
                );
            }
            return tileCache.addCylinderObstacle(
                obstaclePosition,
                cylinderRadius,
                1,
            );
        };

        const result = createObstacle();

        if (
            !result.success &&
            statusDetail(result.status, Detour.DT_BUFFER_TOO_SMALL)
        ) {
            fullUpdate();
            createObstacle();
        }
    }
}

fullUpdate();
tileCacheHelper.update();
redrawNavMesh();

/* compute a path across the field of obstacles */
const { point: start } = navMeshQuery.findClosestPoint({ x: -8, y: 0, z: 10 });
const { point: end } = navMeshQuery.findClosestPoint({ x: 8, y: 0, z: -10 });
const { path } = navMeshQuery.computePath(start, end);

if (path) {
    const points = path.map(
        (v) => [v.x, v.y + 0.1, v.z] as THREE.Vector3Tuple,
    );
    scene.add(createLine(points, 'orange'));
}

/* start loop */
function loop() {
    requestAnimationFrame(loop);
    orbitControls.update();
    renderer.render(scene, camera);
}

loop();
