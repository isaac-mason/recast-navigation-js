import { init } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(0, 20, 32);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.set(0, 0, 0);

/* build an indexed and a non-indexed box geometry */
const boxGeometry = new THREE.BoxGeometry(10, 10, 10);
const nonIndexedBoxGeometry = boxGeometry.clone().toNonIndexed();

const meshes: THREE.Mesh[] = [];

const indexedMesh = new THREE.Mesh(
    boxGeometry,
    new THREE.MeshStandardMaterial({ color: '#ccc' }),
);
indexedMesh.position.set(8, 0, 0);
scene.add(indexedMesh);
meshes.push(indexedMesh);

const nonIndexedMesh = new THREE.Mesh(
    nonIndexedBoxGeometry,
    new THREE.MeshStandardMaterial({ color: '#ccc' }),
);
nonIndexedMesh.position.set(-8, 0, 0);
scene.add(nonIndexedMesh);
meshes.push(nonIndexedMesh);

/* generate the nav mesh */
const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: 0.15,
    ch: 0.2,
    walkableRadius: 0.6,
    walkableClimb: 2.1,
    walkableSlopeAngle: 60,
});

if (success && navMesh) {
    scene.add(createNavMeshHelper(navMesh));
}

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
