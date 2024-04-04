#include "./NavMeshQuery.h"

int g_seed = 1337;
inline int fastrand()
{
    g_seed = (214013 * g_seed + 2531011);
    return (g_seed >> 16) & 0x7FFF;
}

inline float r01()
{
    return ((float)fastrand()) * (1.f / 32767.f);
}

NavMeshQuery::NavMeshQuery()
{
    m_navQuery = dtAllocNavMeshQuery();
}

NavMeshQuery::NavMeshQuery(dtNavMeshQuery *navMeshQuery)
{
    m_navQuery = navMeshQuery;
}

dtStatus NavMeshQuery::init(NavMesh *navMesh, const int maxNodes)
{
    const dtNavMesh *nav = navMesh->getNavMesh();
    return m_navQuery->init(nav, maxNodes);
}

dtStatus NavMeshQuery::findPath(dtPolyRef startRef, dtPolyRef endRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, UnsignedIntArray *path, int maxPath)
{
    dtPolyRef *pathArray = new dtPolyRef[maxPath];
    int pathCount;

    dtStatus status = m_navQuery->findPath(startRef, endRef, startPos, endPos, filter, pathArray, &pathCount, maxPath);

    path->copy(pathArray, pathCount);
    return status;
}

dtStatus NavMeshQuery::closestPointOnPoly(dtPolyRef ref, const float *pos, Vec3 *closest, BoolRef *posOverPoly)
{
    return m_navQuery->closestPointOnPoly(ref, pos, &closest->x, &posOverPoly->value);
}

dtStatus NavMeshQuery::findStraightPath(
    const float *startPos,
    const float *endPos,
    UnsignedIntArray *path,
    FloatArray *straightPath,
    UnsignedCharArray *straightPathFlags,
    UnsignedIntArray *straightPathRefs,
    IntRef *straightPathCount,
    const int maxStraightPath,
    const int options)
{
    return m_navQuery->findStraightPath(startPos, endPos, path->data, path->size, straightPath->data, straightPathFlags->data, straightPathRefs->data, &straightPathCount->value, maxStraightPath, options);
}

dtStatus NavMeshQuery::findNearestPoly(const float *center, const float *halfExtents, const dtQueryFilter *filter, UnsignedIntRef *nearestRef, Vec3 *nearestPt, BoolRef *isOverPoly)
{
    return m_navQuery->findNearestPoly(center, halfExtents, filter, &nearestRef->value, &nearestPt->x, &isOverPoly->value);
}

dtStatus NavMeshQuery::findPolysAroundCircle(dtPolyRef startRef, const float *centerPos, const float radius, const dtQueryFilter *filter, dtPolyRef *resultRef, dtPolyRef *resultParent, float *resultCost, int *resultCount, const int maxResult)
{
    return m_navQuery->findPolysAroundCircle(startRef, centerPos, radius, filter, resultRef, resultParent, resultCost, resultCount, maxResult);
}

dtStatus NavMeshQuery::queryPolygons(const float *center, const float *halfExtents, const dtQueryFilter *filter, dtPolyRef *polys, int *polyCount, const int maxPolys)
{
    return m_navQuery->queryPolygons(center, halfExtents, filter, polys, polyCount, maxPolys);
}

dtStatus NavMeshQuery::raycast(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, const unsigned int options, dtRaycastHit *hit, dtPolyRef prevRef)
{
    return m_navQuery->raycast(startRef, startPos, endPos, filter, options, hit, prevRef);
}

Vec3 NavMeshQuery::getClosestPoint(const float *position, const float *halfExtents, const dtQueryFilter *filter)
{
    dtPolyRef polyRef;

    m_navQuery->findNearestPoly(position, halfExtents, filter, &polyRef, 0);

    bool posOverlay;
    Vec3 resDetour;
    dtStatus status = m_navQuery->closestPointOnPoly(polyRef, position, &resDetour.x, &posOverlay);

    if (dtStatusFailed(status))
    {
        return Vec3(0.f, 0.f, 0.f);
    }
    return Vec3(resDetour.x, resDetour.y, resDetour.z);
}

Vec3 NavMeshQuery::getRandomPointAround(const float *position, float maxRadius, const float *halfExtents, const dtQueryFilter *filter)
{
    dtPolyRef polyRef;

    m_navQuery->findNearestPoly(position, halfExtents, filter, &polyRef, 0);

    dtPolyRef randomRef;
    Vec3 resDetour;
    dtStatus status = m_navQuery->findRandomPointAroundCircle(polyRef, position, maxRadius,
                                                              filter, r01,
                                                              &randomRef, &resDetour.x);
    if (dtStatusFailed(status))
    {
        return Vec3(0.f, 0.f, 0.f);
    }

    return Vec3(resDetour.x, resDetour.y, resDetour.z);
}

dtStatus NavMeshQuery::moveAlongSurface(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, Vec3 *resultPos, UnsignedIntArray *visited, int maxVisitedSize)
{
    int size = 0;
    unsigned int *visitedArray = new unsigned int[maxVisitedSize];

    dtStatus status = m_navQuery->moveAlongSurface(startRef, startPos, endPos, filter, &resultPos->x, visitedArray, &size, maxVisitedSize);

    visited->copy(visitedArray, size);

    return status;
}

dtStatus NavMeshQuery::getPolyHeight(dtPolyRef ref, const float *pos, FloatRef *height)
{
    return m_navQuery->getPolyHeight(ref, pos, &height->value);
}

void NavMeshQuery::destroy()
{
    dtFreeNavMeshQuery(m_navQuery);
}
