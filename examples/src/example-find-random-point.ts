import { init, NavMeshQuery, setRandomSeed } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui';
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
setRandomSeed(1337);

const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: 0.05,
    ch: 0.2,
});

const pointSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 32, 32),
    new THREE.MeshBasicMaterial({ color: 'blue' }),
);
scene.add(pointSphere);

if (success && navMesh) {
    scene.add(createNavMeshHelper(navMesh));

    const navMeshQuery = new NavMeshQuery(navMesh);

    const newRandomPoint = () => {
        const result = navMeshQuery.findRandomPoint();
        if (!result) return;

        const point = result.randomPoint;
        pointSphere.position.set(point.x, point.y, point.z);
    };

    newRandomPoint();

    /* gui */
    const gui = new GUI();
    gui.add({ 'New Random Point': newRandomPoint }, 'New Random Point');
}

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
