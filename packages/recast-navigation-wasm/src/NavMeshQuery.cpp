#include "./NavMeshQuery.h"

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
    delete[] pathArray;

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

dtStatus NavMeshQuery::findPolysAroundCircle(dtPolyRef startRef, const float *centerPos, const float radius, const dtQueryFilter *filter, UnsignedIntArray *resultRef, UnsignedIntArray *resultParent, FloatArray *resultCost, IntRef *resultCount, const int maxResult)
{
    return m_navQuery->findPolysAroundCircle(startRef, centerPos, radius, filter, resultRef->data, resultParent->data, resultCost->data, &resultCount->value, maxResult);
}

dtStatus NavMeshQuery::queryPolygons(const float *center, const float *halfExtents, const dtQueryFilter *filter, UnsignedIntArray *polys, IntRef *polyCount, const int maxPolys)
{
    return m_navQuery->queryPolygons(center, halfExtents, filter, polys->data, &polyCount->value, maxPolys);
}

dtStatus NavMeshQuery::raycast(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, const unsigned int options, dtRaycastHit *hit, dtPolyRef prevRef)
{
    return m_navQuery->raycast(startRef, startPos, endPos, filter, options, hit, prevRef);
}

dtStatus NavMeshQuery::findClosestPoint(const float *position, const float *halfExtents, const dtQueryFilter *filter, UnsignedIntRef *resultPolyRef, Vec3 *resultPoint, BoolRef *resultPosOverPoly)
{
    dtPolyRef polyRef;
    Vec3 resDetour;
    dtStatus status = m_navQuery->findNearestPoly(position, halfExtents, filter, &polyRef, 0);

    if (dtStatusFailed(status))
    {
        return status;
    }

    status = m_navQuery->closestPointOnPoly(polyRef, position, &resDetour.x, &resultPosOverPoly->value);

    resultPolyRef->value = polyRef;
    resultPoint->x = resDetour.x;
    resultPoint->y = resDetour.y;
    resultPoint->z = resDetour.z;

    return status;
}

dtStatus NavMeshQuery::findRandomPointAroundCircle(dtPolyRef startRef, const float *centerPos, const float radius, const dtQueryFilter *filter, UnsignedIntRef *resultRandomRef, Vec3 *resultRandomPoint)
{
    dtPolyRef randomRef;
    Vec3 resDetour;
    dtStatus status = m_navQuery->findRandomPointAroundCircle(startRef, centerPos, radius, filter, &FastRand::r01, &randomRef, &resDetour.x);

    resultRandomRef->value = randomRef;
    resultRandomPoint->x = resDetour.x;
    resultRandomPoint->y = resDetour.y;
    resultRandomPoint->z = resDetour.z;

    return status;
}

dtStatus NavMeshQuery::moveAlongSurface(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, Vec3 *resultPos, UnsignedIntArray *visited, int maxVisitedSize)
{
    int size = 0;
    unsigned int *visitedArray = new unsigned int[maxVisitedSize];

    dtStatus status = m_navQuery->moveAlongSurface(startRef, startPos, endPos, filter, &resultPos->x, visitedArray, &size, maxVisitedSize);

    visited->copy(visitedArray, size);
    delete[] visitedArray;

    return status;
}

dtStatus NavMeshQuery::findRandomPoint(const dtQueryFilter *filter, UnsignedIntRef *resultRandomRef, Vec3 *resultRandomPoint)
{
    dtPolyRef randomRef;
    Vec3 resDetour;
    dtStatus status = m_navQuery->findRandomPoint(filter, &FastRand::r01, &randomRef, &resDetour.x);

    resultRandomRef->value = randomRef;
    resultRandomPoint->x = resDetour.x;
    resultRandomPoint->y = resDetour.y;
    resultRandomPoint->z = resDetour.z;

    return status;
}

dtStatus NavMeshQuery::getPolyHeight(dtPolyRef ref, const float *pos, FloatRef *height)
{
    return m_navQuery->getPolyHeight(ref, pos, &height->value);
}

dtStatus NavMeshQuery::initSlicedFindPath(dtPolyRef startRef, dtPolyRef endRef,
    const float* startPos, const float* endPos,
    const dtQueryFilter* filter, const unsigned int options) {

    return m_navQuery->initSlicedFindPath(startRef, endRef, startPos, endPos, filter, options);
}

dtStatus NavMeshQuery::updateSlicedFindPath(const int maxIter, IntRef *doneIters) {
    return m_navQuery->updateSlicedFindPath(maxIter, &doneIters->value);
}

dtStatus NavMeshQuery::finalizeSlicedFindPath(UnsignedIntArray *path, IntRef *pathCount, const int maxPath) {
    return m_navQuery->finalizeSlicedFindPath(path->data, &pathCount->value, maxPath);
}

dtStatus NavMeshQuery::finalizeSlicedFindPathPartial(UnsignedIntArray *existing, const int existingSize,
    UnsignedIntArray *path, IntRef *pathCount, const int maxPath) {
    return m_navQuery->finalizeSlicedFindPathPartial(existing->data, existingSize, path->data, &pathCount->value, maxPath);
}

void NavMeshQuery::destroy()
{
    dtFreeNavMeshQuery(m_navQuery);
}
