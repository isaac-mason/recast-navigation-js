import * as THREE from 'three';

export type Visual = {
    object: THREE.Object3D;
    dispose: () => void;
};

/**
 * Creates a flag visual (pole + flag) commonly used to mark positions in examples.
 */
export function createFlag(color: number): Visual {
    const poleGeom = new THREE.BoxGeometry(0.06, 1.2, 0.06);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(0, 0.6, 0);

    const flagGeom = new THREE.BoxGeometry(0.32, 0.22, 0.02);
    const flagMat = new THREE.MeshStandardMaterial({ color });
    const flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(0.18, 1.0, 0);

    const group = new THREE.Group();
    group.add(pole);
    group.add(flag);

    return {
        object: group,
        dispose: () => {
            poleGeom.dispose();
            poleMat.dispose();
            flagGeom.dispose();
            flagMat.dispose();
        },
    };
}
