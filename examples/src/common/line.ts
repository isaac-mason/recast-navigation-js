import * as THREE from 'three';
import { Line2, LineGeometry, LineMaterial } from 'three/examples/jsm/Addons.js';

export type LinePoint = THREE.Vector3 | THREE.Vector3Tuple | { x: number; y: number; z: number };

const toTuple = (p: LinePoint): THREE.Vector3Tuple => {
    if (Array.isArray(p)) return p;
    return [p.x, p.y, p.z];
};

/**
 * Creates a thick world-space line through the given points.
 * Uses Line2 / LineMaterial so the line has a consistent width.
 */
export const createLine = (
    points: LinePoint[],
    color: THREE.ColorRepresentation = 'orange',
    linewidth = 0.1,
): Line2 => {
    const positions: number[] = [];
    for (const p of points) {
        const [x, y, z] = toTuple(p);
        positions.push(x, y, z);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const material = new LineMaterial({
        color: new THREE.Color(color).getHex(),
        linewidth,
        worldUnits: true,
    });

    return new Line2(geometry, material);
};
