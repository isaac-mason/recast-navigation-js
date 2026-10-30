import {
    Crowd,
    init,
    NavMeshQuery,
    type OffMeshConnectionParams,
} from 'recast-navigation';
import { CrowdHelper, threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { createLine } from './common/line';
import { loadGLTF } from './common/load-gltf';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

const offMeshConnectionDefaults = {
    radius: 0.3,
    area: 0,
    flags: 1,
    bidirectional: false,
};

const offMeshConnections: OffMeshConnectionParams[] = [
    {
        ...offMeshConnectionDefaults,
        startPosition: {
            x: 4.501361846923828,
            y: 0.36645400524139404,
            z: 2.227370500564575,
        },
        endPosition: {
            x: 6.453944206237793,
            y: 0.4996081590652466,
            z: 1.6987327337265015,
        },
        bidirectional: true,
    },
    {
        ...offMeshConnectionDefaults,
        startPosition: {
            x: 0.2870096266269684,
            y: 3.9292590618133545,
            z: 2.564833402633667,
        },
        endPosition: {
            x: 1.4627689123153687,
            y: 2.778116226196289,
            z: 3.5469906330108643,
        },
    },
    {
        ...offMeshConnectionDefaults,
        startPosition: {
            x: 3.5109636783599854,
            y: 3.1664540767669678,
            z: 2.893442392349243,
        },
        endPosition: {
            x: 3.669801950454712,
            y: 0.36645400524139404,
            z: 2.135521173477173,
        },
    },
];

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(7, 10, 7);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.set(3, 3, 3);

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
const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: 0.05,
    ch: 0.2,
    offMeshConnections,
});

if (!success || !navMesh) {
    throw new Error('failed to generate nav mesh');
}

scene.add(createNavMeshHelper(navMesh));

/* visualize the off mesh connections */
// note: OffMeshConnectionsHelper was removed from @recast-navigation/three in
// favour of DebugDrawer off mesh connection drawing, so we draw them manually.
for (const connection of offMeshConnections) {
    const { startPosition, endPosition } = connection;
    scene.add(createLine([startPosition, endPosition], 'yellow'));

    for (const p of [startPosition, endPosition]) {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(connection.radius ?? 0.3),
            new THREE.MeshStandardMaterial({ color: 'yellow' }),
        );
        sphere.position.set(p.x, p.y, p.z);
        scene.add(sphere);
    }
}

const navMeshQuery = new NavMeshQuery(navMesh);

/* create a crowd with a single agent */
const crowd = new Crowd(navMesh, {
    maxAgents: 1,
    maxAgentRadius: 0.1,
});

const { point: agentPosition } = navMeshQuery.findClosestPoint({
    x: 0,
    y: 3.9,
    z: 2.5,
});

crowd.addAgent(agentPosition, {
    radius: 0.1,
    height: 0.5,
    maxSpeed: 2,
});

const crowdHelper = new CrowdHelper(crowd, {
    agentMaterial: new THREE.MeshStandardMaterial({ color: 'red' }),
});
scene.add(crowdHelper);

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

    const agent = crowd.getAgent(0);
    if (!agent) return;

    const { point: nearest } = navMeshQuery.findClosestPoint(point);
    agent.requestMoveTarget(nearest);
});

/* start loop */
const clock = new THREE.Clock();

function update() {
    requestAnimationFrame(update);

    const delta = Math.min(clock.getDelta(), 0.1);

    orbitControls.update();
    crowd.update(delta);
    crowdHelper.update();

    renderer.render(scene, camera);
}

update();
