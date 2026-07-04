import {
    exportNavMesh,
    importNavMesh,
    init,
    type NavMesh,
} from 'recast-navigation';
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

/* nav mesh generation config */
const config = {
    borderSize: 0,
    tileSize: 0,
    cs: 0.2,
    ch: 0.2,
    walkableSlopeAngle: 60,
    walkableHeight: 2,
    walkableClimb: 2,
    walkableRadius: 0.2,
    maxEdgeLen: 12,
    maxSimplificationError: 1.3,
    minRegionArea: 8,
    mergeRegionArea: 20,
    maxVertsPerPoly: 6,
    detailSampleDist: 6,
    detailSampleMaxError: 1,
};

/* state */
let navMesh: NavMesh | undefined;
let navMeshExport: Uint8Array | undefined;
let navMeshHelper: ReturnType<typeof createNavMeshHelper> | undefined;

const showHelper = () => {
    if (navMeshHelper) {
        scene.remove(navMeshHelper);
        navMeshHelper.dispose();
        navMeshHelper = undefined;
    }

    if (navMesh) {
        navMeshHelper = createNavMeshHelper(navMesh);
        scene.add(navMeshHelper);
    }
};

const actions = {
    generate: () => {
        const result = threeToSoloNavMesh(meshes, config);
        navMesh = result.navMesh;
        showHelper();
    },
    reset: () => {
        navMesh = undefined;
        showHelper();
    },
    save: () => {
        if (!navMesh) return;
        navMeshExport = exportNavMesh(navMesh);
    },
    load: () => {
        if (!navMeshExport) return;
        navMesh = importNavMesh(navMeshExport).navMesh;
        showHelper();
    },
};

/* gui */
const gui = new GUI();

const generationFolder = gui.addFolder('generation');
generationFolder.add(config, 'borderSize');
generationFolder.add(config, 'tileSize');
generationFolder.add(config, 'cs');
generationFolder.add(config, 'ch');
generationFolder.add(config, 'walkableSlopeAngle');
generationFolder.add(config, 'walkableHeight');
generationFolder.add(config, 'walkableClimb');
generationFolder.add(config, 'walkableRadius');
generationFolder.add(config, 'maxEdgeLen');
generationFolder.add(config, 'maxSimplificationError');
generationFolder.add(config, 'minRegionArea');
generationFolder.add(config, 'mergeRegionArea');
generationFolder.add(config, 'maxVertsPerPoly');
generationFolder.add(config, 'detailSampleDist');
generationFolder.add(config, 'detailSampleMaxError');

gui.add(actions, 'generate').name('Generate');
gui.add(actions, 'reset').name('Reset');
gui.add(actions, 'save').name('Save');
gui.add(actions, 'load').name('Load');

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
