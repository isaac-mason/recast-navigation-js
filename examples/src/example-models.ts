import { init } from 'recast-navigation';
import { threeToTiledNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { loadGLTF } from './common/load-gltf';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(-100, 75, -75);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.set(15, 15, -51);

/* load the dungeon environment */
const model = await loadGLTF('./dungeon.gltf');
scene.add(model.scene);

const meshes: THREE.Mesh[] = [];
model.scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
        meshes.push(object);
    }
});

/* generate a tiled nav mesh */
const { success, navMesh } = threeToTiledNavMesh(
    meshes,
    {
        cs: 0.05,
        ch: 0.2,
        walkableHeight: 1,
        walkableClimb: 2.5,
        walkableRadius: 1,
        borderSize: 0.2,
        tileSize: 32,
    },
    false,
);

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
