import { init, NavMeshQuery } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { createExample } from './common/example-base';
import { loadGLTF } from './common/load-gltf';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

/* instruction overlay */
const instructions = document.createElement('div');
instructions.className = 'mc-info mc-hint';
instructions.textContent = 'use wasd or arrow keys to move';
document.body.appendChild(instructions);

/* controllable capsule */
const capsule = new THREE.Group();
capsule.position.set(-4.128, 0.266, 4.852);

const capsuleMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.2, 1, 32),
    new THREE.MeshStandardMaterial({ color: 'blue' }),
);
capsuleMesh.position.y = 0.5;
capsule.add(capsuleMesh);
scene.add(capsule);

/* keyboard controls */
const controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
};

const keyControlMap: Record<string, keyof typeof controls> = {
    w: 'forward',
    s: 'backward',
    a: 'left',
    d: 'right',
    ArrowUp: 'forward',
    ArrowDown: 'backward',
    ArrowLeft: 'left',
    ArrowRight: 'right',
};

window.addEventListener('keydown', (event) => {
    const control = keyControlMap[event.key];
    if (control) {
        controls[control] = true;
    }
});

window.addEventListener('keyup', (event) => {
    const control = keyControlMap[event.key];
    if (control) {
        controls[control] = false;
    }
});

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
const cellSize = 0.05;

const walkableRadius = 0.3;
const walkableHeight = 0.35;

const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: cellSize,
    ch: 0.2,
    walkableHeight: Math.round(walkableHeight / cellSize),
    walkableRadius: Math.round(walkableRadius / cellSize),
});

let navMeshQuery: NavMeshQuery | undefined;

if (success && navMesh) {
    scene.add(createNavMeshHelper(navMesh));
    navMeshQuery = new NavMeshQuery(navMesh);
}

/* chase camera + movement loop */
const timer = new THREE.Timer();
timer.connect(document);
const _targetCameraPosition = new THREE.Vector3();

function update() {
    requestAnimationFrame(update);

    timer.update();

    const delta = timer.getDelta();

    if (navMeshQuery) {
        const { forward, backward, left, right } = controls;

        const velocity = new THREE.Vector3();

        if (forward) velocity.z -= 1;
        if (backward) velocity.z += 1;
        if (left) velocity.x -= 1;
        if (right) velocity.x += 1;

        velocity.normalize();

        velocity.multiplyScalar(1 - 0.001 ** delta).multiplyScalar(0.5);

        const { point, polyRef } = navMeshQuery.findClosestPoint({
            x: capsule.position.x,
            y: capsule.position.y,
            z: capsule.position.z,
        });

        const movementTarget = new THREE.Vector3()
            .copy(point)
            .clone()
            .add(velocity);

        const { resultPosition } = navMeshQuery.moveAlongSurface(
            polyRef,
            point,
            movementTarget,
        );

        const polyHeightResult = navMeshQuery.getPolyHeight(
            polyRef,
            resultPosition,
        );

        capsule.position.set(
            resultPosition.x,
            polyHeightResult.success
                ? polyHeightResult.height
                : resultPosition.y,
            resultPosition.z,
        );

        const targetCameraPosition = _targetCameraPosition.copy(
            capsule.position,
        );

        targetCameraPosition.y += 10;
        targetCameraPosition.z += 10;

        camera.position.copy(targetCameraPosition);
        camera.lookAt(capsule.position);
    }

    renderer.render(scene, camera);
}

update();
