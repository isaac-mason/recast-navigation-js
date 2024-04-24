#include "DetourDebugDraw.h"

void DetourDebugDraw::debugDrawNavMesh(duDebugDraw* dd, const dtNavMesh& mesh, const int flags)
{
    duDebugDrawNavMesh(dd, mesh, flags);
}
void DetourDebugDraw::debugDrawNavMeshWithClosedList(struct duDebugDraw* dd, const dtNavMesh& mesh, const dtNavMeshQuery& query, unsigned char flags)
{
    duDebugDrawNavMeshWithClosedList(dd, mesh, query, flags);
}
void DetourDebugDraw::debugDrawNavMeshNodes(struct duDebugDraw* dd, const dtNavMeshQuery& query)
{
    duDebugDrawNavMeshNodes(dd, query);
}
void DetourDebugDraw::debugDrawNavMeshBVTree(struct duDebugDraw* dd, const dtNavMesh& mesh)
{
    duDebugDrawNavMeshBVTree(dd, mesh);
}
void DetourDebugDraw::debugDrawNavMeshPortals(struct duDebugDraw* dd, const dtNavMesh& mesh)
{
    duDebugDrawNavMeshPortals(dd, mesh);
}
void DetourDebugDraw::debugDrawNavMeshPolysWithFlags(struct duDebugDraw* dd, const dtNavMesh& mesh, const unsigned short polyFlags, const unsigned int col)
{
    duDebugDrawNavMeshPolysWithFlags(dd, mesh, polyFlags, col);
}
void DetourDebugDraw::debugDrawNavMeshPoly(struct duDebugDraw* dd, const dtNavMesh& mesh, dtPolyRef ref, const unsigned int col)
{
    duDebugDrawNavMeshPoly(dd, mesh, ref, col);
}

void DetourDebugDraw::debugDrawTileCacheLayerAreas(struct duDebugDraw* dd, const dtTileCacheLayer& layer, const float cs, const float ch)
{
    duDebugDrawTileCacheLayerAreas(dd, layer, cs, ch);
}
void DetourDebugDraw::debugDrawTileCacheLayerRegions(struct duDebugDraw* dd, const dtTileCacheLayer& layer, const float cs, const float ch)
{
    duDebugDrawTileCacheLayerRegions(dd, layer, cs, ch);
}
void DetourDebugDraw::debugDrawTileCacheContours(duDebugDraw* dd, const struct dtTileCacheContourSet& lcset, const float* orig, const float cs, const float ch)
{
    duDebugDrawTileCacheContours(dd, lcset, orig, cs, ch);
}
void DetourDebugDraw::debugDrawTileCachePolyMesh(duDebugDraw* dd, const struct dtTileCachePolyMesh& lmesh, const float* orig, const float cs, const float ch)
{
    duDebugDrawTileCachePolyMesh(dd, lmesh, orig, cs, ch);
}
