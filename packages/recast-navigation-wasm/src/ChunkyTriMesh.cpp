#include "./ChunkyTriMesh.h"

bool ChunkyTriMeshUtils::createChunkyTriMesh(const FloatArray *verts, const IntArray *tris, int ntris, int trisPerChunk, rcChunkyTriMesh *chunkyTriMesh)
{
    return rcCreateChunkyTriMesh(verts->data, tris->data, ntris, trisPerChunk, chunkyTriMesh);
}

int ChunkyTriMeshUtils::getChunksOverlappingRect(rcChunkyTriMesh *chunkyTriMesh, float *tbmin, float *tbmax, IntArray *ids, const int maxIds)
{
    return rcGetChunksOverlappingRect(chunkyTriMesh, tbmin, tbmax, ids->data, maxIds);
}

IntArray *ChunkyTriMeshUtils::getChunkyTriMeshNodeTris(rcChunkyTriMesh *chunkyTriMesh, int nodeIndex)
{
    rcChunkyTriMeshNode &node = chunkyTriMesh->nodes[nodeIndex];
    int *tris = &chunkyTriMesh->tris[node.i * 3];

    IntArray *result = new IntArray;
    result->view(tris);

    return result;
}
