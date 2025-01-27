import { NavMeshHelper, threeToSoloNavMesh } from '@recast-navigation/three';
import { init as initRecast } from 'recast-navigation';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import './styles.css';

const init = async () => {
  await initRecast();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  const rootDomElement = document.body.querySelector('#root');
  rootDomElement.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
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

  const geometry = new THREE.BoxGeometry(10, 0.2, 10);
  const material = new THREE.MeshBasicMaterial({ color: 0x333333 });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  scene.add(pointLight);

  new OrbitControls(camera, renderer.domElement);

  const { success, navMesh } = threeToSoloNavMesh([mesh]);

  if (success) {
    const navMeshHelper = new NavMeshHelper(navMesh);

    scene.add(navMeshHelper);
  }

  const loop = () => {
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };

  loop();
};

init();
