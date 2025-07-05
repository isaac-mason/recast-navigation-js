import type { Object3DNode } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      /** `object` assumed to extend `THREE.Object3D` */
      primitive: Object3DNode<THREE.Object3D, THREE.Object3D> & {
        object: THREE.Object3D;
      };
    }
  }
}
