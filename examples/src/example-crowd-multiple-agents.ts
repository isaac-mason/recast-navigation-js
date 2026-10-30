import { Crowd, init, NavMeshQuery } from 'recast-navigation';
import { CrowdHelper, threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
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
const maxAgentRadius = 0.15;
const cellSize = 0.05;

const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: cellSize,
    ch: 0.2,
    walkableRadius: Math.ceil(maxAgentRadius / cellSize),
});

if (!success || !navMesh) {
    throw new Error('failed to generate nav mesh');
}

scene.add(createNavMeshHelper(navMesh));

const navMeshQuery = new NavMeshQuery(navMesh);

/* create a crowd with multiple agents */
const crowd = new Crowd(navMesh, {
    maxAgents: 10,
    maxAgentRadius,
});

for (let i = 0; i < 10; i++) {
    const { randomPoint: position } = navMeshQuery.findRandomPointAroundCircle(
        { x: -2, y: 0, z: 3 },
        1,
    );

    crowd.addAgent(position, {
        radius: 0.1 + Math.random() * 0.05,
        height: 0.5,
        maxAcceleration: 4.0,
        maxSpeed: 1.0,
        separationWeight: 1.0,
    });
}

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

    const { point: target } = navMeshQuery.findClosestPoint(point);

    for (const agent of crowd.getAgents()) {
        agent.requestMoveTarget(target);
    }
});

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

    renderer.render(scene, camera);
}

update();
