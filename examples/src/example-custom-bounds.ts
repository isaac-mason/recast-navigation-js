import { init } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { loadGLTF } from './common/load-gltf';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

const BOUNDS = new THREE.Box3(
    new THREE.Vector3(-3, -1, -5),
    new THREE.Vector3(9, 5, 3),
);

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

/* visualize the custom bounds */
scene.add(new THREE.Box3Helper(BOUNDS));

/* generate the nav mesh constrained to the custom bounds */
const walkableRadiusWorld = 0.1;
const cellSize = 0.05;

const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: cellSize,
    ch: 0.2,
    walkableRadius: Math.ceil(walkableRadiusWorld / cellSize),
    bounds: [BOUNDS.min.toArray(), BOUNDS.max.toArray()],
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
