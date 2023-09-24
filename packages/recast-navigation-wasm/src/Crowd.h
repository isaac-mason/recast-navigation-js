#pragma once

#include "../recastnavigation/Detour/Include/DetourCommon.h"
#include "../recastnavigation/DetourCrowd/Include/DetourCrowd.h"

class CrowdUtils
{
public:
    int getActiveAgentCount(dtCrowd *crowd);

    bool overOffMeshConnection(dtCrowd *crowd, int idx);

    void agentTeleport(dtCrowd *crowd, int idx, const float *destination, const float *halfExtents, dtQueryFilter *filter);
};
