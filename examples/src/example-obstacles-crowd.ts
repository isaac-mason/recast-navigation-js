import {
    init,
    NavMeshQuery,
    Crowd,
    type BoxObstacle,
    type CylinderObstacle,
} from 'recast-navigation';
import {
    threeToTileCache,
    TileCacheHelper,
    DebugDrawer,
    CrowdHelper,
} from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls, TransformControls } from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui';
import { createExample } from './common/example-base';

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

/* full tile cache update helper */
function fullUpdate() {
    let upToDate = false;
    while (!upToDate) {
        const r = tileCache!.update(navMesh!);
        upToDate = r.upToDate;
    }
}

fullUpdate();

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

/* crowd with a single agent */
const crowd = new Crowd(navMesh, {
    maxAgents: 1,
    maxAgentRadius: 0.2,
});

const { point: agentPosition } = navMeshQuery.findClosestPoint({ x: 0, y: 0, z: 0 });

const agent = crowd.addAgent(agentPosition, {
    radius: 0.2,
    height: 1,
    maxAcceleration: 8,
    maxSpeed: 2,
    collisionQueryRange: 0.5,
    pathOptimizationRange: 0,
    separationWeight: 1,
});

const crowdHelper = new CrowdHelper(crowd);
scene.add(crowdHelper);

/* obstacles, moved with draggable transform gizmos */
const boxPosition = { x: -2, z: 1 };
const cylinderPosition = { x: 1.5, z: -1.5 };

// draggable proxy meshes — the gizmo moves these and the obstacle follows
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

const cylinderProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.5, 24),
    new THREE.MeshStandardMaterial({
        color: 0x4caf50,
        transparent: true,
        opacity: 0.35,
    }),
);
cylinderProxy.position.set(cylinderPosition.x, 0.25, cylinderPosition.z);
scene.add(cylinderProxy);

let boxObstacle: BoxObstacle | undefined;
let cylinderObstacle: CylinderObstacle | undefined;

function rebuildObstacles() {
    if (boxObstacle) {
        tileCache!.removeObstacle(boxObstacle);
        boxObstacle = undefined;
    }
    if (cylinderObstacle) {
        tileCache!.removeObstacle(cylinderObstacle);
        cylinderObstacle = undefined;
    }

    const boxResult = tileCache!.addBoxObstacle(
        new THREE.Vector3(boxPosition.x, 1, boxPosition.z),
        { x: 1, y: 1, z: 1 },
        0.2,
    );
    if (boxResult.success) {
        boxObstacle = boxResult.obstacle;
    }

    const cylinderResult = tileCache!.addCylinderObstacle(
        new THREE.Vector3(cylinderPosition.x, 0, cylinderPosition.z),
        1,
        0.5,
    );
    if (cylinderResult.success) {
        cylinderObstacle = cylinderResult.obstacle;
    }

    fullUpdate();
    tileCacheHelper.update();
    redrawNavMesh();
}

/* initial obstacle build */
rebuildObstacles();

/* draggable transform gizmos for each obstacle */
const gizmos: TransformControls[] = [];

function attachGizmo(object: THREE.Object3D, onChange: () => void) {
    const gizmo = new TransformControls(camera, renderer.domElement);
    gizmo.showY = false; // constrain movement to the ground plane (X/Z)
    gizmo.attach(object);
    scene.add(gizmo.getHelper());
    gizmo.addEventListener('dragging-changed', (event) => {
        orbitControls.enabled = !event.value;
    });
    gizmo.addEventListener('objectChange', onChange);
    gizmos.push(gizmo);
}

attachGizmo(boxProxy, () => {
    boxPosition.x = boxProxy.position.x;
    boxPosition.z = boxProxy.position.z;
    rebuildObstacles();
});
attachGizmo(cylinderProxy, () => {
    cylinderPosition.x = cylinderProxy.position.x;
    cylinderPosition.z = cylinderProxy.position.z;
    rebuildObstacles();
});

/* gui */
const gui = new GUI();

const agentControls = {
    agentMaxAcceleration: 8,
    agentMaxSpeed: 2,
};

const agentFolder = gui.addFolder('agent');
agentFolder
    .add(agentControls, 'agentMaxAcceleration', 0.5, 20, 1)
    .onChange((v: number) => {
        agent.maxAcceleration = v;
    });
agentFolder
    .add(agentControls, 'agentMaxSpeed', 0.5, 10, 1)
    .onChange((v: number) => {
        agent.maxSpeed = v;
    });

/* pointer interaction: raycast against the ground plane */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function getPointerIntersection(
    event: PointerEvent,
    targets: THREE.Object3D[],
): THREE.Vector3 | null {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(targets, true);
    return hits.length ? hits[0].point : null;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
    if (gizmos.some((gizmo) => gizmo.axis)) return; // interacting with a gizmo
    const point = getPointerIntersection(event, [ground]);
    if (!point) return;

    if (event.button === 2) {
        agent.teleport(point);
    } else {
        agent.requestMoveTarget(point);
    }
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

/* start loop */
const clock = new THREE.Clock();

function loop() {
    requestAnimationFrame(loop);

    const delta = Math.min(clock.getDelta(), 0.1);

    crowd.update(delta);
    crowdHelper.update();

    orbitControls.update();
    renderer.render(scene, camera);
}

loop();
