import { init } from 'recast-navigation';
import { DebugDrawer, threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createExample } from './common/example-base';
import { loadGLTF } from './common/load-gltf';

await init();

const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);
camera.position.set(0, 10, 10);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

const model = await loadGLTF('./nav_test.glb');
scene.add(model.scene);
model.scene.visible = false;

const meshes: THREE.Mesh[] = [];
model.scene.traverse((o) => {
    if (o instanceof THREE.Mesh) meshes.push(o);
});

const { success, navMesh, intermediates } = threeToSoloNavMesh(
    meshes,
    {
        cs: 0.05,
        ch: 0.2,
        walkableHeight: 1,
        walkableClimb: 2.5,
        walkableRadius: 1,
        borderSize: 0.2,
    },
    true,
);

if (success) {
    const debugDrawer = new DebugDrawer();
    debugDrawer.drawPolyMeshDetail(intermediates.polyMeshDetail!);
    scene.add(debugDrawer);
}

function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}
update();
