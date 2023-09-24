#include "./Crowd.h"

int CrowdUtils::getActiveAgentCount(dtCrowd *crowd)
{
    return crowd->getActiveAgents(NULL, crowd->getAgentCount());
}

bool CrowdUtils::overOffMeshConnection(dtCrowd *crowd, int idx)
{
    const dtCrowdAgent *agent = crowd->getAgent(idx);
    const float triggerRadius = agent->params.radius * 2.25f;
    if (!agent->ncorners)
        return false;
    const bool offMeshConnection = (agent->cornerFlags[agent->ncorners - 1] & DT_STRAIGHTPATH_OFFMESH_CONNECTION) ? true : false;
    if (offMeshConnection)
    {
        const float distSq = dtVdist2DSqr(agent->npos, &agent->cornerVerts[(agent->ncorners - 1) * 3]);
        if (distSq < triggerRadius * triggerRadius)
        {
            return true;
        }
    }
    return false;
}

void CrowdUtils::agentTeleport(dtCrowd *crowd, int idx, const float *destination, const float *halfExtents, dtQueryFilter *filter)
{
    if (idx < 0 || idx > crowd->getAgentCount())
    {
        return;
    }

    dtPolyRef polyRef = 0;

    crowd->getNavMeshQuery()->findNearestPoly(destination, halfExtents, filter, &polyRef, 0);

    dtCrowdAgent *ag = crowd->getEditableAgent(idx);

    float nearest[3];
    dtVcopy(nearest, destination);

    ag->corridor.reset(polyRef, nearest);
    ag->boundary.reset();
    ag->partial = false;

    ag->topologyOptTime = 0;
    ag->targetReplanTime = 0;
    ag->nneis = 0;

    dtVset(ag->dvel, 0, 0, 0);
    dtVset(ag->nvel, 0, 0, 0);
    dtVset(ag->vel, 0, 0, 0);
    dtVcopy(ag->npos, nearest);

    ag->desiredSpeed = 0;

    if (polyRef)
    {
        ag->state = DT_CROWDAGENT_STATE_WALKING;
    }
    else
    {
        ag->state = DT_CROWDAGENT_STATE_INVALID;
    }

    ag->targetState = DT_CROWDAGENT_TARGET_NONE;
}
