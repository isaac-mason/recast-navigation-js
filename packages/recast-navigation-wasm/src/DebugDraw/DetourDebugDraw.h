#pragma once

#include "../../recastnavigation/DebugUtils/Include/DebugDraw.h"
#include "../../recastnavigation/DebugUtils/Include/DetourDebugDraw.h"

class DetourDebugDraw
{
public:
    void debugDrawNavMesh(duDebugDraw* dd, const dtNavMesh& mesh, const int flags);
    void debugDrawNavMeshWithClosedList(struct duDebugDraw* dd, const dtNavMesh& mesh, const dtNavMeshQuery& query, unsigned char flags);
    void debugDrawNavMeshNodes(struct duDebugDraw* dd, const dtNavMeshQuery& query);
    void debugDrawNavMeshBVTree(struct duDebugDraw* dd, const dtNavMesh& mesh);
    void debugDrawNavMeshPortals(struct duDebugDraw* dd, const dtNavMesh& mesh);
    void debugDrawNavMeshPolysWithFlags(struct duDebugDraw* dd, const dtNavMesh& mesh, const unsigned short polyFlags, const unsigned int col);
    void debugDrawNavMeshPoly(struct duDebugDraw* dd, const dtNavMesh& mesh, dtPolyRef ref, const unsigned int col);

    void debugDrawTileCacheLayerAreas(struct duDebugDraw* dd, const dtTileCacheLayer& layer, const float cs, const float ch);
    void debugDrawTileCacheLayerRegions(struct duDebugDraw* dd, const dtTileCacheLayer& layer, const float cs, const float ch);
    void debugDrawTileCacheContours(duDebugDraw* dd, const struct dtTileCacheContourSet& lcset, const float* orig, const float cs, const float ch);
    void debugDrawTileCachePolyMesh(duDebugDraw* dd, const struct dtTileCachePolyMesh& lmesh, const float* orig, const float cs, const float ch);
};
