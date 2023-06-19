import { REVISION, WebGLRenderer } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
// @ts-expect-error missing type
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

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
