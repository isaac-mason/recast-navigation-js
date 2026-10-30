import { Crowd, init, NavMeshQuery } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
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
const agentHeight = 0.5;
const agentRadius = 0.15;
const cellSize = 0.05;

const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: cellSize,
    ch: 0.2,
    walkableRadius: Math.round(agentRadius / cellSize),
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
    height: agentHeight,
    maxAcceleration: 4.0,
    maxSpeed: 1.0,
    collisionQueryRange: 0.5,
    pathOptimizationRange: 0.0,
});

/* render the agent manually as a red cylinder */
const agentGroup = new THREE.Group();
const agentMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(agentRadius, agentRadius, agentHeight, 32),
    new THREE.MeshStandardMaterial({ color: 'red' }),
);
agentMesh.position.y = agentHeight / 2;
agentGroup.add(agentMesh);
scene.add(agentGroup);

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

    const { point: target } = navMeshQuery.findClosestPoint(point);

    if (event.button === 2) {
        agent.teleport(target);
        agentTarget = undefined;
    } else if (event.button === 0) {
        agent.requestMoveTarget(target);
        agentTarget = new THREE.Vector3().copy(target as THREE.Vector3);
    }

    updateAgentPath();
});

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

/* start loop */
const clock = new THREE.Clock();

function update() {
    requestAnimationFrame(update);

    const delta = Math.min(clock.getDelta(), 0.1);

    orbitControls.update();

    /* fixed timestep with interpolation */
    crowd.update(1 / 60, delta);
    agentGroup.position.copy(agent.interpolatedPosition);

    if (agentTarget) {
        updateAgentPath();
    }

    renderer.render(scene, camera);
}

update();
