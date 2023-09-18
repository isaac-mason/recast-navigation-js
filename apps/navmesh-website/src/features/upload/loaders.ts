import {
  Group,
  Mesh,
  MeshStandardMaterial,
  REVISION,
  WebGLRenderer,
} from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`;

const dracoloader = new DRACOLoader().setDecoderPath(
  `${THREE_PATH}/examples/jsm/libs/draco/gltf/`
);

const ktx2Loader = new KTX2Loader().setTranscoderPath(
  `${THREE_PATH}/examples/jsm/libs/basis/`
);

export const gltfLoader = new GLTFLoader()
  .setCrossOrigin('anonymous')
  .setDRACOLoader(dracoloader)
  .setKTX2Loader(ktx2Loader.detectSupport(new WebGLRenderer()))
  .setMeshoptDecoder(MeshoptDecoder);

const loadGltf = async (buffer: ArrayBuffer) => {
  const { scene } = await new Promise<GLTF>((resolve, reject) =>
    gltfLoader.parse(buffer, '', resolve, reject)
  );
  return scene;
};

const objLoader = new OBJLoader().setCrossOrigin('anonymous');

const loadObj = (buffer: ArrayBuffer) => {
  const group = objLoader.parse(new TextDecoder('utf-8').decode(buffer));

  const material = new MeshStandardMaterial({
    color: '#ccc',
  });

  group.traverse((child) => {
    if (child instanceof Mesh) {
      child.material = material;
    }
  });

  return group;
};

const fbxLoader = new FBXLoader().setCrossOrigin('anonymous');

const loadFbx = (buffer: ArrayBuffer) => {
  return fbxLoader.parse(buffer, '');
};

export const loadModel = async (
  buffer: ArrayBuffer,
  file: File
): Promise<Group> => {
  if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
    return loadGltf(buffer);
  } else if (file.name.endsWith('.obj')) {
    return loadObj(buffer);
  } else if (file.name.endsWith('.fbx')) {
    return loadFbx(buffer);
  }

  throw new Error(`Unsupported file type: ${file.name}`);
};
