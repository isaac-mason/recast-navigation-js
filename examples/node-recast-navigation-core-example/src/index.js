import R from '@recast-navigation/core';
import { BoxGeometry, Mesh } from 'three';

/**
 * @type {typeof import('@recast-navigation/core').default}
 */
const Recast = await R();

const navMesh = new Recast.NavMesh();

const groundMesh = new Mesh(new BoxGeometry(5, 0.5, 5));

const config = new Recast.rcConfig();

config.borderSize = 0;
config.tileSize = 0;
config.cs = 0.2;
config.ch = 0.2;
config.walkableSlopeAngle = 35;
config.walkableHeight = 1;
config.walkableClimb = 1;
config.walkableRadius = 1;
config.maxEdgeLen = 12;
config.maxSimplificationError = 1.3;
config.minRegionArea = 8;
config.mergeRegionArea = 20;
config.maxVertsPerPoly = 6;
config.detailSampleDist = 6;
config.detailSampleMaxError = 1;

const positions = groundMesh.geometry.attributes.position.array;
const indices = groundMesh.geometry.index.array;
const offset = positions.length / 3;

navMesh.build(positions, offset, indices, indices.length, config);

const closestPoint = navMesh.getClosestPoint(new Recast.Vec3(2, 1, 2));

console.log(closestPoint.x, closestPoint.y, closestPoint.z);
