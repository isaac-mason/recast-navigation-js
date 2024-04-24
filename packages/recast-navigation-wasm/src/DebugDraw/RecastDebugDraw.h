#pragma once

#include "../../recastnavigation/DebugUtils/Include/DebugDraw.h"
#include "../../recastnavigation/DebugUtils/Include/RecastDebugDraw.h"

class RecastDebugDraw
{
public:
    void debugDrawHeightfieldSolid(duDebugDraw* dd, const rcHeightfield& hf);

    void debugDrawHeightfieldWalkable(duDebugDraw* dd, const rcHeightfield& hf);

    void debugDrawCompactHeightfieldSolid(duDebugDraw* dd, const rcCompactHeightfield& chf);

    void debugDrawCompactHeightfieldRegions(duDebugDraw* dd, const rcCompactHeightfield& chf);

    void debugDrawCompactHeightfieldDistance(duDebugDraw* dd, const rcCompactHeightfield& chf);

    void debugDrawHeightfieldLayer(duDebugDraw* dd, const rcHeightfieldLayer& layer, const int idx);

    void debugDrawHeightfieldLayers(duDebugDraw* dd, const rcHeightfieldLayerSet& lset);

    void debugDrawRegionConnections(duDebugDraw* dd, const rcContourSet& cset, const float alpha);

    void debugDrawRawContours(duDebugDraw* dd, const rcContourSet& cset, const float alpha);

    void debugDrawContours(duDebugDraw* dd, const rcContourSet& cset, const float alpha);

    void debugDrawPolyMesh(duDebugDraw* dd, const rcPolyMesh& mesh);

    void debugDrawPolyMeshDetail(duDebugDraw* dd, const rcPolyMeshDetail& dmesh);
};