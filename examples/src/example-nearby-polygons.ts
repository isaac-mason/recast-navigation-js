import {
    init,
    type NavMesh,
    NavMeshQuery,
    statusToReadableString,
} from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui';
import { createExample } from './common/example-base';
import { loadGLTF } from './common/load-gltf';
import { createNavMeshHelper } from './common/nav-mesh-debug';

await init();

const config = {
    selectType: 'cube' as 'cube' | 'circle',
};

/* setup example scene */
const container = document.getElementById('root')!;
const { scene, camera, renderer } = createExample(container);

camera.position.set(0, 10, 10);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

/* instruction overlay */
const instructions = document.createElement('div');
instructions.className = 'mc-info mc-hint';
instructions.textContent = 'Click to select polygons';
document.body.appendChild(instructions);

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
const { success, navMesh } = threeToSoloNavMesh(meshes, {
    cs: 0.05,
    ch: 0.2,

    // Avoids extracting triangles
    maxVertsPerPoly: 3,
});

const touchMaterial = new THREE.MeshBasicMaterial({
    color: 'blue',
    transparent: true,
    opacity: 0.3,
});

const volumeMaterial = new THREE.MeshBasicMaterial({
    color: 'green',
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthTest: false,
});

/* group holding highlighted polygons, cleared on each click */
const highlightsGroup = new THREE.Group();
scene.add(highlightsGroup);

/* mesh showing the query volume */
let volumeMesh: THREE.Mesh | undefined;

if (success && navMesh) {
    scene.add(createNavMeshHelper(navMesh));

    const navMeshQuery = new NavMeshQuery(navMesh);

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

    const clearHighlights = () => {
        for (const child of [...highlightsGroup.children]) {
            highlightsGroup.remove(child);
            if (child instanceof THREE.Mesh) child.geometry.dispose();
        }
    };

    const onClick = (event: PointerEvent) => {
        if (!navMesh) return;

        const point = getPointerIntersection(event, meshes);
        if (!point) return;

        const clickedPosition = point.clone();
        if (config.selectType === 'cube') {
            clickedPosition.setY(point.y + 0.5);
        }

        const { nearestRef: startRef } =
            navMeshQuery.findNearestPoly(clickedPosition);
        console.info('findNearestPoly', startRef);

        const maxPolys = 100;

        const findPolysAroundCircleResult = navMeshQuery.findPolysAroundCircle(
            startRef,
            clickedPosition,
            1,
            { maxPolys },
        );
        console.info('findPolysAroundCircle', findPolysAroundCircleResult);
        console.info(
            'findPolysAroundCircle status',
            statusToReadableString(findPolysAroundCircleResult.status),
        );

        const halfExtents = { x: 0.5, y: 0.5, z: 0.5 };
        const queryPolygonsResult = navMeshQuery.queryPolygons(
            clickedPosition,
            halfExtents,
            { maxPolys },
        );
        console.info('queryPolygons', queryPolygonsResult);

        let polyRefs: number[] = [];

        if (config.selectType === 'circle') {
            polyRefs = findPolysAroundCircleResult.resultRefs.slice(
                0,
                findPolysAroundCircleResult.resultCount,
            );
        } else {
            polyRefs = queryPolygonsResult.polyRefs;
        }

        const decodedPolyRefs = polyRefs.map((polyRef) =>
            navMesh.decodePolyId(polyRef),
        );
        console.info('decodedPolyRefs', decodedPolyRefs);

        const touchedPolyIds: { [tilePolyId: number]: boolean } = {};
        for (const { tilePolygonIndex } of decodedPolyRefs) {
            touchedPolyIds[tilePolygonIndex] = true;
        }

        /* build highlight geometry for each selected polygon */
        clearHighlights();

        const enabledPolyIds = Object.keys(touchedPolyIds)
            .map(Number)
            .filter((polyId) => touchedPolyIds[polyId]);

        // polyRefToGeom reads nav mesh tile geometry on the JS side
        // (getTileAndPolyByRef -> tile.polys/verts), which throws in the current
        // wasm build. Guard so a click never breaks the render loop; the queried
        // poly ids are still logged/known even if the highlight can't be drawn.
        try {
            for (const polyId of enabledPolyIds) {
                const salt = navMesh.getTile(0).salt();
                const polyRef = navMesh.encodePolyId(salt, 0, polyId);

                const geometry = polyRefToGeom(polyRef, navMesh);

                const mesh = new THREE.Mesh(geometry, touchMaterial);
                highlightsGroup.add(mesh);
            }
        } catch (error) {
            console.warn('polyRefToGeom failed (wasm tile binding)', error);
        }

        /* update query volume visual */
        if (volumeMesh) {
            scene.remove(volumeMesh);
            volumeMesh.geometry.dispose();
            volumeMesh = undefined;
        }

        if (config.selectType === 'cube') {
            volumeMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                volumeMaterial,
            );
            volumeMesh.position.copy(clickedPosition);
        } else {
            volumeMesh = new THREE.Mesh(
                new THREE.CircleGeometry(1, 24),
                volumeMaterial,
            );
            volumeMesh.rotation.set(-Math.PI / 2, 0, 0);
            volumeMesh.position.copy(clickedPosition);
        }

        scene.add(volumeMesh);
    };

    renderer.domElement.addEventListener('pointerdown', onClick);
    renderer.domElement.addEventListener('contextmenu', (e) =>
        e.preventDefault(),
    );

    /* gui */
    const gui = new GUI();
    gui.add(config, 'selectType', ['cube', 'circle']);
}

/* start loop */
function update() {
    requestAnimationFrame(update);
    orbitControls.update();
    renderer.render(scene, camera);
}

update();

function polyRefToGeom(
    polyRef: number,
    navMesh: NavMesh,
): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    const vertices = [] as THREE.Vector3Tuple[];
    const triangles = [] as number[][];

    // Only one tile because we use `threeToSoloNavMesh`
    const { poly, tile } = navMesh.getTileAndPolyByRef(polyRef);

    const vertexIds = range(poly.vertCount()).map((i) => poly.verts(i));
    const allVertices = range(tile.header()!.vertCount() * 3).reduce(
        (agg, i) =>
            i % 3 === 2
                ? agg.concat([
                      [tile.verts(i - 2), tile.verts(i - 1), tile.verts(i)],
                  ])
                : agg,
        [] as THREE.Vector3Tuple[],
    );

    triangles.push(range(vertexIds.length).map((x) => x + vertices.length));
    vertices.push(...vertexIds.map((id) => allVertices![id]));

    geom.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3),
    );
    geom.setIndex(triangles.flat());

    return geom;
}

/**
 * @param n A non-negative integer
 * @returns Array `[0, ..., n-1]`
 */
function range(n: number) {
    return [...Array(n)].map((_, i) => i);
}
