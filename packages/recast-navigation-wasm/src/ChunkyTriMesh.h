#pragma once

#include "../recastnavigation/RecastDemo/Include/ChunkyTriMesh.h"
#include "./Arrays.h"

class ChunkyTriMeshUtils
{
public:
    bool createChunkyTriMesh(const FloatArray *verts, const IntArray *tris, int ntris, int trisPerChunk, rcChunkyTriMesh *chunkyTriMesh);

    int getChunksOverlappingRect(rcChunkyTriMesh *chunkyTriMesh, float *tbmin, float *tbmax, IntArray *ids, const int maxIds);

    IntArray *getChunkyTriMeshNodeTris(rcChunkyTriMesh *chunkyTriMesh, int nodeIndex);
};
