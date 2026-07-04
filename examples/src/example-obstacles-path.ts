import { init, NavMeshQuery, type BoxObstacle } from 'recast-navigation';
import { threeToTileCache, TileCacheHelper, DebugDrawer } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls, TransformControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { createLine } from './common/line';

await init();

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(0, 15, 15);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.set(0, 0, 0);

/* procedural ground */
const meshes: THREE.Mesh[] = [];

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
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

/* nav mesh debug drawer (redrawn after tile cache changes) */
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
        const r = tileCache!.update(navMesh!);
        upToDate = r.upToDate;
    }
}

/* box obstacle, moved with a draggable transform gizmo */
const boxPosition = { x: -2, z: 1 };
let boxObstacle: BoxObstacle | undefined;

// draggable proxy mesh — the gizmo moves this and the obstacle follows
const boxProxy = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({
        color: 0x2196f3,
        transparent: true,
        opacity: 0.35,
    }),
);
boxProxy.position.set(boxPosition.x, 1, boxPosition.z);
boxProxy.rotation.y = 0.2;
scene.add(boxProxy);

let pathLine: THREE.Object3D | undefined;

function update() {
    /* remove existing obstacle */
    if (boxObstacle) {
        const { success } = tileCache!.removeObstacle(boxObstacle);
        if (success) {
            boxObstacle = undefined;
        }
    }

    /* add box obstacle at current position */
    const addResult = tileCache!.addBoxObstacle(
        new THREE.Vector3(boxPosition.x, 1, boxPosition.z),
        { x: 1, y: 1, z: 1 },
        0.2,
    );
    if (addResult.success) {
        boxObstacle = addResult.obstacle;
    }

    fullUpdate();
    tileCacheHelper.update();
    redrawNavMesh();

    /* compute path */
    const { point: start } = navMeshQuery.findClosestPoint({ x: -8, y: 0, z: 8 });
    const { point: end } = navMeshQuery.findClosestPoint({ x: 8, y: 0, z: -8 });
    const { path } = navMeshQuery.computePath(start, end);

    if (pathLine) {
        scene.remove(pathLine);
        pathLine = undefined;
    }

    if (path) {
        const points = path.map(
            (v) => [v.x, v.y + 0.1, v.z] as THREE.Vector3Tuple,
        );
        pathLine = createLine(points, 'orange');
        scene.add(pathLine);
    }
}

/* draggable transform gizmo for the obstacle */
const gizmo = new TransformControls(camera, renderer.domElement);
gizmo.showY = false; // constrain movement to the ground plane (X/Z)
gizmo.attach(boxProxy);
scene.add(gizmo.getHelper());
gizmo.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value;
});
gizmo.addEventListener('objectChange', () => {
    boxPosition.x = boxProxy.position.x;
    boxPosition.z = boxProxy.position.z;
    update();
});

/* initial build */
update();

/* start loop */
function loop() {
    requestAnimationFrame(loop);
    orbitControls.update();
    renderer.render(scene, camera);
}

loop();
