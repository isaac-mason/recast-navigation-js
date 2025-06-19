#pragma once

#include "../../recastnavigation/DebugUtils/Include/DebugDraw.h"
#include "../../recastnavigation/DebugUtils/Include/RecastDebugDraw.h"
#include "../Arrays.h"

class RecastDebugDraw
{
public:
    void debugDrawTriMesh(duDebugDraw* dd, const FloatArray *verts, int nverts, const IntArray *tris, const FloatArray *normals, int ntris, const UnsignedCharArray *flags, const float texScale);
    void debugDrawTriMeshNoFlags(duDebugDraw* dd, const FloatArray *verts, int nverts, const IntArray *tris, const FloatArray *normals, int ntris, const float texScale);
    void debugDrawTriMeshSlope(duDebugDraw* dd, const FloatArray *verts, int nverts, const IntArray *tris, const FloatArray *normals, int ntris, const float walkableSlopeAngle, const float texScale);

    void debugDrawHeightfieldSolid(duDebugDraw *dd, const rcHeightfield &hf);
    void debugDrawHeightfieldWalkable(duDebugDraw *dd, const rcHeightfield &hf);
    void debugDrawCompactHeightfieldSolid(duDebugDraw *dd, const rcCompactHeightfield &chf);
    void debugDrawCompactHeightfieldRegions(duDebugDraw *dd, const rcCompactHeightfield &chf);
    void debugDrawCompactHeightfieldDistance(duDebugDraw *dd, const rcCompactHeightfield &chf);
    void debugDrawHeightfieldLayer(duDebugDraw *dd, const rcHeightfieldLayer &layer, const int idx);
    void debugDrawHeightfieldLayers(duDebugDraw *dd, const rcHeightfieldLayerSet &lset);
    void debugDrawRegionConnections(duDebugDraw *dd, const rcContourSet &cset, const float alpha);
    void debugDrawRawContours(duDebugDraw *dd, const rcContourSet &cset, const float alpha);
    void debugDrawContours(duDebugDraw *dd, const rcContourSet &cset, const float alpha);
    void debugDrawPolyMesh(duDebugDraw *dd, const rcPolyMesh &mesh);
    void debugDrawPolyMeshDetail(duDebugDraw *dd, const rcPolyMeshDetail &dmesh);
};
