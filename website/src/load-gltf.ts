import {
  DRACOLoader,
  type GLTF,
  GLTFLoader,
} from 'three/examples/jsm/Addons.js';
import dracoWasmUrl from 'three/examples/jsm/libs/draco/draco_decoder.wasm?url';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const dracoDecoderPath = dracoWasmUrl.substring(
  0,
  dracoWasmUrl.lastIndexOf('/') + 1,
);

export const loadGLTF = (url: string): Promise<GLTF> => {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(dracoDecoderPath);

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  return gltfLoader.loadAsync(url);
};
