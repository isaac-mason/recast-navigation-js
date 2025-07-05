import { DebugDrawer, getPositionsAndIndices } from '@recast-navigation/three';
import { type NavMesh, importNavMesh, init as initRecast } from 'recast-navigation';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import NavMeshWorker from './navmesh-worker?worker';

import './index.css';

const init = async () => {
  await initRecast();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  const rootDomElement = document.body.querySelector('#root')!;
  rootDomElement.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(10, 10, 10);

  const scene = new THREE.Scene();

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };

  onResize();

  window.addEventListener('resize', onResize);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.2, 10),
    new THREE.MeshBasicMaterial({ color: 0x999999 }),
  );
  scene.add(ground);

  const obstacle = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshBasicMaterial({ color: 0x333333 }),
  );
  obstacle.position.set(0, 1, 0);
  scene.add(obstacle);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  scene.add(pointLight);

  new OrbitControls(camera, renderer.domElement);

  const [positions, indices] = getPositionsAndIndices([ground, obstacle]);

  const navMeshConfig = {
    cs: 0.05,
    ch: 0.2,
  };

  const debugDrawer = new DebugDrawer();
  scene.add(debugDrawer);

  const worker = new NavMeshWorker();

  let navMesh: NavMesh | undefined;

  worker.onmessage = (event) => {
    const navMeshExport = event.data;

    const result = importNavMesh(navMeshExport);

    navMesh = result.navMesh;

    debugDrawer.clear();
    debugDrawer.drawNavMesh(navMesh);
  };

  worker.postMessage({ positions, indices, config: navMeshConfig }, [
    positions.buffer,
    indices.buffer,
  ]);

  const loop = () => {
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };

  loop();
};

init();
