#include "RecastDebugDraw.h"

void RecastDebugDraw::debugDrawHeightfieldSolid(duDebugDraw *dd, const rcHeightfield &hf)
{
    duDebugDrawHeightfieldSolid(dd, hf);
}

void RecastDebugDraw::debugDrawHeightfieldWalkable(duDebugDraw *dd, const rcHeightfield &hf)
{
    duDebugDrawHeightfieldWalkable(dd, hf);
}

void RecastDebugDraw::debugDrawCompactHeightfieldSolid(duDebugDraw *dd, const rcCompactHeightfield &chf)
{
    duDebugDrawCompactHeightfieldSolid(dd, chf);
}

void RecastDebugDraw::debugDrawCompactHeightfieldRegions(duDebugDraw *dd, const rcCompactHeightfield &chf)
{
    duDebugDrawCompactHeightfieldRegions(dd, chf);
}

void RecastDebugDraw::debugDrawCompactHeightfieldDistance(duDebugDraw *dd, const rcCompactHeightfield &chf)
{
    duDebugDrawCompactHeightfieldDistance(dd, chf);
}

void RecastDebugDraw::debugDrawHeightfieldLayer(duDebugDraw *dd, const rcHeightfieldLayer &layer, const int idx)
{
    duDebugDrawHeightfieldLayer(dd, layer, idx);
}

void RecastDebugDraw::debugDrawHeightfieldLayers(duDebugDraw *dd, const rcHeightfieldLayerSet &lset)
{
    duDebugDrawHeightfieldLayers(dd, lset);
}

void RecastDebugDraw::debugDrawRegionConnections(duDebugDraw *dd, const rcContourSet &cset, const float alpha = 1.0f)
{
    duDebugDrawRegionConnections(dd, cset, alpha);
}

void RecastDebugDraw::debugDrawRawContours(duDebugDraw *dd, const rcContourSet &cset, const float alpha = 1.0f)
{
    duDebugDrawRawContours(dd, cset, alpha);
}

void RecastDebugDraw::debugDrawContours(duDebugDraw *dd, const rcContourSet &cset, const float alpha = 1.0f)
{
    duDebugDrawContours(dd, cset, alpha);
}

void RecastDebugDraw::debugDrawPolyMesh(duDebugDraw *dd, const rcPolyMesh &mesh)
{
    duDebugDrawPolyMesh(dd, mesh);
}

void RecastDebugDraw::debugDrawPolyMeshDetail(duDebugDraw *dd, const rcPolyMeshDetail &dmesh)
{
    duDebugDrawPolyMeshDetail(dd, dmesh);
}
