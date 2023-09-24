#pragma once

#include "../recastnavigation/Recast/Include/Recast.h"
#include "../recastnavigation/Detour/Include/DetourStatus.h"
#include "../recastnavigation/Detour/Include/DetourCommon.h"
#include "../recastnavigation/Detour/Include/DetourNavMeshQuery.h"
#include "./Refs.h"
#include "./Arrays.h"
#include "./Vec.h"
#include "./NavMesh.h"

struct NavMeshQueryRaycastResult
{
    dtStatus status;
    dtRaycastHit *raycastHit;
};

class NavMeshQuery
{
public:
    dtNavMeshQuery *m_navQuery;

    NavMeshQuery();

    NavMeshQuery(dtNavMeshQuery *navMeshQuery);

    dtStatus init(NavMesh *navMesh, const int maxNodes);

    dtStatus findPath(dtPolyRef startRef, dtPolyRef endRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, UnsignedIntArray *path, int maxPath);

    dtStatus closestPointOnPoly(dtPolyRef ref, const float *pos, Vec3 *closest, BoolRef *posOverPoly);

    dtStatus findStraightPath(
        const float *startPos,
        const float *endPos,
        UnsignedIntArray *path,
        FloatArray *straightPath,
        UnsignedCharArray *straightPathFlags,
        UnsignedIntArray *straightPathRefs,
        IntRef *straightPathCount,
        const int maxStraightPath,
        const int options);

    dtStatus findNearestPoly(const float *center, const float *halfExtents, const dtQueryFilter *filter, UnsignedIntRef *nearestRef, Vec3 *nearestPt, BoolRef *isOverPoly);

    dtStatus raycast(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, const unsigned int options, dtRaycastHit *hit, dtPolyRef prevRef);

    Vec3 getClosestPoint(const float *position, const float *halfExtents, const dtQueryFilter *filter);

    Vec3 getRandomPointAround(const float *position, float maxRadius, const float *halfExtents, const dtQueryFilter *filter);

    dtStatus moveAlongSurface(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, Vec3 *resultPos, UnsignedIntArray *visited, int maxVisitedSize);

    dtStatus getPolyHeight(dtPolyRef ref, const float *pos, FloatRef *height);

    void destroy();
};
