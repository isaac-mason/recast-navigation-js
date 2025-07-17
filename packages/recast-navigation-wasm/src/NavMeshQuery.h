#pragma once

#include "../recastnavigation/Recast/Include/Recast.h"
#include "../recastnavigation/Detour/Include/DetourStatus.h"
#include "../recastnavigation/Detour/Include/DetourCommon.h"
#include "../recastnavigation/Detour/Include/DetourNavMeshQuery.h"
#include "./Refs.h"
#include "./Arrays.h"
#include "./Vec.h"
#include "./NavMesh.h"

class FastRand
{
public:
    static inline int seed = 1337;

    static inline int fastrand()
    {
        seed = (214013 * seed + 2531011);
        return (seed >> 16) & 0x7FFF;
    }

    static inline float r01()
    {
        return fastrand() / 32767.0f;
    }

    static int getSeed()
    {
        return seed;
    }

    static void setSeed(int newSeed)
    {
        seed = newSeed;
    }
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

    dtStatus findClosestPoint(const float *position, const float *halfExtents, const dtQueryFilter *filter, UnsignedIntRef *resultPolyRef, Vec3 *resultPoint, BoolRef *resultPosOverPoly);

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

    dtStatus findPolysAroundCircle(dtPolyRef startRef, const float *centerPos, const float radius, const dtQueryFilter *filter, UnsignedIntArray *resultRef, UnsignedIntArray *resultParent, FloatArray *resultCost, IntRef *resultCount, const int maxResult);

    dtStatus queryPolygons(const float *center, const float *halfExtents, const dtQueryFilter *filter, UnsignedIntArray *polys, IntRef *polyCount, const int maxPolys);

    dtStatus raycast(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, const unsigned int options, dtRaycastHit *hit, dtPolyRef prevRef);

    dtStatus findRandomPointAroundCircle(dtPolyRef startRef, const float *centerPos, const float radius, const dtQueryFilter *filter, UnsignedIntRef *resultRandomRef, Vec3 *resultRandomPoint);

    dtStatus moveAlongSurface(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, Vec3 *resultPos, UnsignedIntArray *visited, int maxVisitedSize);

    dtStatus findRandomPoint(const dtQueryFilter *filter, UnsignedIntRef *resultRandomRef, Vec3 *resultRandomPoint);

    dtStatus getPolyHeight(dtPolyRef ref, const float *pos, FloatRef *height);

	dtStatus initSlicedFindPath(dtPolyRef startRef, dtPolyRef endRef,
								const float* startPos, const float* endPos,
								const dtQueryFilter* filter, const unsigned int options = 0);

	dtStatus updateSlicedFindPath(const int maxIter, IntRef *doneIters);

	dtStatus finalizeSlicedFindPath(UnsignedIntArray *path, IntRef *pathCount, const int maxPath);
	
	dtStatus finalizeSlicedFindPathPartial(UnsignedIntArray *existing, const int existingSize,
										   UnsignedIntArray *path, IntRef *pathCount, const int maxPath);
    
    void destroy();

};
