import { init } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { DEG2RAD } from 'three/src/math/MathUtils.js';
import GUI from 'lil-gui';
import { createExample } from './common/example-base';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

const DEGREES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(0, 15, 28);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.set(0, 0, 0);

/* build a row of ramps at increasing slope angles */
const group = new THREE.Group();
scene.add(group);

const meshes: THREE.Mesh[] = [];

DEGREES.forEach((degrees, idx) => {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 5),
        new THREE.MeshBasicMaterial({ color: '#ccc' }),
    );
    mesh.rotation.x = degrees * DEG2RAD;
    mesh.position.x = (-DEGREES.length * 5) / 2 + idx * 5;
    group.add(mesh);
    meshes.push(mesh);
});

/* nav mesh generation, regenerated on config change */
let navMesh: ReturnType<typeof threeToSoloNavMesh>['navMesh'] | undefined;
let navMeshHelper: ReturnType<typeof createNavMeshHelper> | undefined;

const config = { walkableSlopeAngle: 24 };

const regenerate = () => {
    if (navMeshHelper) {
        scene.remove(navMeshHelper);
        navMeshHelper.dispose();
        navMeshHelper = undefined;
    }

    if (navMesh) {
        navMesh.destroy();
        navMesh = undefined;
    }

    const result = threeToSoloNavMesh(meshes, {
        cs: 0.05,
        ch: 0.05,
        walkableSlopeAngle: config.walkableSlopeAngle,
    });

    if (result.success && result.navMesh) {
        navMesh = result.navMesh;
        navMeshHelper = createNavMeshHelper(navMesh);
        scene.add(navMeshHelper);
    }
};

regenerate();

/* gui */
const gui = new GUI();
gui.add(config, 'walkableSlopeAngle', 5, 50, 1).onChange(regenerate);

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
