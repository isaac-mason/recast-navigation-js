import { Crowd, init, NavMeshQuery } from 'recast-navigation';
import { CrowdHelper, threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { createLine } from './common/line';
import { loadGLTF } from './common/load-gltf';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(0, 10, 10);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

/* load the nav test environment */
const model = await loadGLTF('./nav_test.glb');
scene.add(model.scene);

const meshes: THREE.Mesh[] = [];
model.scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
        meshes.push(object);
    }
});

/* generate the nav mesh */
const agentRadius = 0.1;
const cellSize = 0.05;

const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: cellSize,
    ch: 0.2,
    walkableRadius: Math.ceil(agentRadius / cellSize),
});

if (!success || !navMesh) {
    throw new Error('failed to generate nav mesh');
}

scene.add(createNavMeshHelper(navMesh));

const navMeshQuery = new NavMeshQuery(navMesh);

/* create a crowd with a single agent */
const crowd = new Crowd(navMesh, { maxAgents: 1, maxAgentRadius: 0.2 });

const { point: agentPosition } = navMeshQuery.findClosestPoint({
    x: -2.9,
    y: 2.366,
    z: 0.9,
});

const agent = crowd.addAgent(agentPosition, {
    radius: agentRadius,
    height: 0.5,
    maxAcceleration: 4.0,
    maxSpeed: 1.0,
    collisionQueryRange: 0.5,
    pathOptimizationRange: 0.0,
});

const crowdHelper = new CrowdHelper(crowd, {
    agentMaterial: new THREE.MeshStandardMaterial({ color: 'red' }),
});
scene.add(crowdHelper);

/* agent path visualization */
const targetSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.15),
    new THREE.MeshStandardMaterial({ color: 'blue' }),
);
targetSphere.visible = false;
scene.add(targetSphere);

let agentTarget: THREE.Vector3 | undefined;
let pathLine: THREE.Object3D | undefined;

function updateAgentPath() {
    if (pathLine) {
        scene.remove(pathLine);
        pathLine = undefined;
    }

    if (!agentTarget) {
        targetSphere.visible = false;
        return;
    }

    targetSphere.visible = true;
    targetSphere.position.copy(agentTarget);

    const position = agent.position();
    const points: THREE.Vector3Tuple[] = [
        [position.x, position.y + 0.1, position.z],
        ...agent.corners().map((c) => [c.x, c.y + 0.1, c.z] as THREE.Vector3Tuple),
    ];

    pathLine = createLine(points, 'blue');
    scene.add(pathLine);
}

/* pointer interaction */
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
    const point = getPointerIntersection(event, meshes);
    if (!point) return;

    const { nearestPoint } = navMeshQuery.findNearestPoly(point);

    if (event.button === 2) {
        agent.teleport(nearestPoint);
        agentTarget = undefined;
    } else if (event.button === 0) {
        agent.requestMoveTarget(nearestPoint);
        agentTarget = new THREE.Vector3().copy(nearestPoint as THREE.Vector3);
    }

    updateAgentPath();
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

/* info overlay */
const infoDiv = document.createElement('div');
infoDiv.style.cssText =
    'position:absolute;top:0;padding:25px;color:white;font-family:monospace;user-select:none;z-index:1;';
document.body.appendChild(infoDiv);

/* start loop */
const timer = new THREE.Timer();
timer.connect(document);

function update() {
    requestAnimationFrame(update);

    timer.update();

    const delta = Math.min(timer.getDelta(), 0.1);

    orbitControls.update();
    crowd.update(delta);
    crowdHelper.update();

    if (agentTarget) {
        updateAgentPath();
    }

    const target = agent.target();
    const nextTarget = agent.nextTargetInPath();
    infoDiv.innerText =
        `agent target: ${target.x.toFixed(3)}, ${target.y.toFixed(3)}, ${target.z.toFixed(3)}\n` +
        `agent next target in path: ${nextTarget.x.toFixed(3)}, ${nextTarget.y.toFixed(3)}, ${nextTarget.z.toFixed(3)}`;

    renderer.render(scene, camera);
}

update();
