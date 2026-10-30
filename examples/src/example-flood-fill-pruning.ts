import {
    floodFillPruneNavMesh,
    init,
    type NavMesh,
    NavMeshQuery,
    rgbToDuRgba,
} from 'recast-navigation';
import { DebugDrawer, threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { loadGLTF } from './common/load-gltf';

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

/* flood fill start point */
let point = new THREE.Vector3(0.8, 0.26, 3.3);

/* the flood fill prune is destructive, so we regenerate the nav mesh each time */
let navMesh: NavMesh | undefined;
let debug: DebugDrawer | undefined;

const regenerate = () => {
    if (debug) {
        scene.remove(debug);
        debug.dispose();
        debug = undefined;
    }

    if (navMesh) {
        navMesh.destroy();
        navMesh = undefined;
    }

    const cellSize = 0.05;
    const agentRadius = 0.1;

    const result = threeToSoloNavMesh(meshes, {
        cs: cellSize,
        ch: 0.2,
        walkableRadius: Math.ceil(agentRadius / cellSize),
    });

    if (!result.success || !result.navMesh) return;

    navMesh = result.navMesh;

    const navMeshQuery = new NavMeshQuery(navMesh);

    const nearestPolyResult = navMeshQuery.findNearestPoly(point, {
        halfExtents: { x: 2, y: 2, z: 2 },
    });

    navMeshQuery.destroy();

    if (!nearestPolyResult.success) return;

    // floodFillPruneNavMesh iterates nav mesh tiles on the JS side
    // (getTileAndPolyByRefUnsafe -> tile.links), which throws in the current
    // wasm build. Guard it so the (unpruned) nav mesh still renders.
    try {
        floodFillPruneNavMesh(navMesh, [nearestPolyResult.nearestRef]);
    } catch (error) {
        console.warn('floodFillPruneNavMesh failed (wasm tile binding)', error);
    }

    debug = new DebugDrawer();
    debug.drawNavMeshPolysWithFlags(navMesh, 1, rgbToDuRgba(0x0000ff));
    scene.add(debug);
};

regenerate();

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
    const hit = getPointerIntersection(event, meshes);
    if (!hit) return;

    point = hit.clone();
    regenerate();
});

/* info overlay */
const infoDiv = document.createElement('div');
infoDiv.style.cssText =
    'position:absolute;top:0;padding:25px;color:white;font-family:monospace;user-select:none;z-index:1;';
infoDiv.innerText = 'click to set flood fill start point';
document.body.appendChild(infoDiv);

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();
