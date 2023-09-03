#pragma once
#include "../recastnavigation/Recast/Include/Recast.h"
#include "../recastnavigation/Detour/Include/DetourStatus.h"
#include "../recastnavigation/Detour/Include/DetourNavMesh.h"
#include "../recastnavigation/Detour/Include/DetourCommon.h"
#include "../recastnavigation/Detour/Include/DetourNavMeshBuilder.h"
#include "../recastnavigation/DetourCrowd/Include/DetourCrowd.h"
#include "../recastnavigation/DetourTileCache/Include/DetourTileCache.h"
#include "../recastnavigation/DetourTileCache/Include/DetourTileCacheBuilder.h"
#include "../recastnavigation/RecastDemo/Contrib/fastlz/fastlz.h"
#include "../recastnavigation/RecastDemo/Include/ChunkyTriMesh.h"

#include <vector>
#include <iostream>
#include <list>

class dtNavMeshQuery;
class dtNavMesh;
class MeshLoader;
class NavMesh;
struct rcPolyMesh;
class rcPolyMeshDetail;
struct rcConfig;
struct NavMeshIntermediates;

template <typename T>
struct PrimitiveRefTemplate
{
    T value;
};

struct BoolRef : public PrimitiveRefTemplate<bool>
{
};

struct IntRef : public PrimitiveRefTemplate<int>
{
};

struct UnsignedIntRef : public PrimitiveRefTemplate<unsigned int>
{
};

struct UnsignedCharRef : public PrimitiveRefTemplate<unsigned char>
{
};

struct UnsignedShortRef : public PrimitiveRefTemplate<unsigned short>
{
};

struct FloatRef : public PrimitiveRefTemplate<float>
{
};

template <typename T>
struct ArrayWrapperTemplate
{
    T *data;
    int size;
    bool isView;

    void free()
    {
        if (!isView)
        {
            delete[] data;
        }

        size = 0;
        this->data = 0;
    }

    void copy(const T *data, int size)
    {
        free();
        this->data = new T[size];
        memcpy(this->data, data, size * sizeof(T));
        this->size = size;
        this->isView = false;
    }

    void view(T *data)
    {
        this->data = data;
        this->size = 0;
        this->isView = true;
    }

    void resize(int size)
    {
        free();
        data = new T[size];
        memset(data, 0, size * sizeof(T));
        this->size = size;
        this->isView = false;
    }

    T get(int index)
    {
        return data[index];
    }

    void set(int index, T value)
    {
        data[index] = value;
    }
};

struct IntArray : public ArrayWrapperTemplate<int>
{
};

struct UnsignedIntArray : public ArrayWrapperTemplate<unsigned int>
{
};

struct UnsignedCharArray : public ArrayWrapperTemplate<unsigned char>
{
};

struct UnsignedShortArray : public ArrayWrapperTemplate<unsigned short>
{
};

struct FloatArray : public ArrayWrapperTemplate<float>
{
};

struct Vec3
{
    float x, y, z;

    Vec3() {}
    Vec3(float v) : x(v), y(v), z(v) {}
    Vec3(float x, float y, float z) : x(x), y(y), z(z) {}

    void isMinOf(const Vec3 &v)
    {
        x = std::min(x, v.x);
        y = std::min(y, v.y);
        z = std::min(z, v.z);
    }

    void isMaxOf(const Vec3 &v)
    {
        x = std::max(x, v.x);
        y = std::max(y, v.y);
        z = std::max(z, v.z);
    }

    float operator[](int index)
    {
        return ((float *)&x)[index];
    }
};

struct Vec2
{
    float x, y;

    Vec2() {}
    Vec2(float v) : x(v), y(v) {}
    Vec2(float x, float y) : x(x), y(y) {}
};

struct RecastFastLZCompressor : public dtTileCacheCompressor
{
    virtual int maxCompressedSize(const int bufferSize)
    {
        return (int)(bufferSize * 1.05f);
    }

    virtual dtStatus compress(const unsigned char *buffer, const int bufferSize,
                              unsigned char *compressed, const int /*maxCompressedSize*/, int *compressedSize)
    {
        *compressedSize = fastlz_compress((const void *const)buffer, bufferSize, compressed);
        return DT_SUCCESS;
    }

    virtual dtStatus decompress(const unsigned char *compressed, const int compressedSize,
                                unsigned char *buffer, const int maxBufferSize, int *bufferSize)
    {
        *bufferSize = fastlz_decompress(compressed, compressedSize, buffer, maxBufferSize);
        return *bufferSize < 0 ? DT_FAILURE : DT_SUCCESS;
    }
};

struct RecastLinearAllocator : public dtTileCacheAlloc
{
    unsigned char *buffer;
    size_t capacity;
    size_t top;
    size_t high;

    RecastLinearAllocator(const size_t cap) : buffer(0), capacity(0), top(0), high(0)
    {
        resize(cap);
    }

    ~RecastLinearAllocator()
    {
        if (buffer)
        {
            dtFree(buffer);
        }
    }

    void resize(const size_t cap)
    {
        if (buffer)
        {
            dtFree(buffer);
        }

        buffer = (unsigned char *)dtAlloc(cap, DT_ALLOC_PERM);
        capacity = cap;
    }

    virtual void reset()
    {
        high = dtMax(high, top);
        top = 0;
    }

    virtual void *alloc(const size_t size)
    {
        if (!buffer)
        {
            return 0;
        }

        if (top + size > capacity)
        {
            return 0;
        }

        unsigned char *mem = &buffer[top];
        top += size;
        return mem;
    }

    virtual void free(void * /* ptr */)
    {
        // Empty
    }
};

struct TileCacheMeshProcessAbstract
{
    TileCacheMeshProcessAbstract()
    {
    }

    virtual ~TileCacheMeshProcessAbstract()
    {
    }

    virtual void process(struct dtNavMeshCreateParams *params, UnsignedCharArray *polyAreas, UnsignedShortArray *polyFlags) = 0;
};

struct TileCacheMeshProcessWrapper : public dtTileCacheMeshProcess
{
    TileCacheMeshProcessAbstract &js;

    TileCacheMeshProcessWrapper(TileCacheMeshProcessAbstract &inJs) : js(inJs) {}

    virtual void process(struct dtNavMeshCreateParams *params, unsigned char *polyAreas, unsigned short *polyFlags)
    {
        UnsignedCharArray *polyAreasView = new UnsignedCharArray();
        polyAreasView->view(polyAreas);

        UnsignedShortArray *polyFlagsView = new UnsignedShortArray();
        polyFlagsView->view(polyFlags);

        js.process(params, polyAreasView, polyFlagsView);
    }
};

struct TileCacheAddTileResult
{
    unsigned int status;
    unsigned int tileRef;
};

struct TileCacheUpdateResult
{
    unsigned int status;
    bool upToDate;
};

class TileCache
{
public:
    dtTileCache *m_tileCache;

    TileCache() : m_tileCache(0)
    {
        m_tileCache = dtAllocTileCache();
    }

    bool init(const dtTileCacheParams *params, RecastLinearAllocator *allocator, RecastFastLZCompressor *compressor, TileCacheMeshProcessAbstract &meshProcess);

    TileCacheAddTileResult addTile(UnsignedCharArray *data, unsigned char flags);

    dtStatus buildNavMeshTile(const dtCompressedTileRef *ref, NavMesh *navMesh);

    dtStatus buildNavMeshTilesAt(const int tx, const int ty, NavMesh *navMesh);

    TileCacheUpdateResult update(NavMesh *navMesh);

    dtObstacleRef *addCylinderObstacle(const Vec3 &position, float radius, float height);

    dtObstacleRef *addBoxObstacle(const Vec3 &position, const Vec3 &extent, float angle);

    void removeObstacle(dtObstacleRef *obstacle);

    void destroy();

protected:
    std::list<dtObstacleRef> m_obstacles;

    dtTileCacheAlloc *m_talloc;
    RecastFastLZCompressor *m_tcomp;
    TileCacheMeshProcessWrapper *m_tmproc;
};

struct NavMeshRemoveTileResult
{
    unsigned int status;
    unsigned char *data;
    int dataSize;
};

struct NavMeshCalcTileLocResult
{
    int tileX;
    int tileY;
};

struct NavMeshGetTilesAtResult
{
    const dtMeshTile *tiles;
    int tileCount;
};

struct NavMeshGetTileAndPolyByRefResult
{
    dtStatus status;
    const dtMeshTile *tile;
    const dtPoly *poly;
};

struct NavMeshStoreTileStateResult
{
    dtStatus status;
    unsigned char *data;
    int dataSize;
};

class NavMesh
{
public:
    dtNavMesh *m_navMesh;

    NavMesh()
    {
        m_navMesh = dtAllocNavMesh();
    }

    NavMesh(dtNavMesh *navMesh)
    {
        m_navMesh = navMesh;
    }

    bool initSolo(UnsignedCharArray *navMeshData);

    bool initTiled(const dtNavMeshParams *params);

    dtStatus addTile(UnsignedCharArray *navMeshData, int flags, dtTileRef lastRef, UnsignedIntRef *tileRef);

    NavMeshRemoveTileResult removeTile(dtTileRef ref);

    dtNavMesh *getNavMesh()
    {
        return m_navMesh;
    }

    NavMeshCalcTileLocResult calcTileLoc(const float *pos) const;

    const dtMeshTile *getTileAt(const int tx, const int ty, const int tlayer) const;

    NavMeshGetTilesAtResult getTilesAt(const int x, const int y, const int maxTiles) const;

    dtTileRef getTileRefAt(int x, int y, int layer) const;

    dtTileRef getTileRef(const dtMeshTile *tile) const;

    const dtMeshTile *getTileByRef(dtTileRef ref) const;

    int getMaxTiles() const;

    const dtMeshTile *getTile(int i) const;

    NavMeshGetTileAndPolyByRefResult getTileAndPolyByRef(const dtPolyRef ref) const;

    NavMeshGetTileAndPolyByRefResult getTileAndPolyByRefUnsafe(const dtPolyRef ref) const;

    bool isValidPolyRef(dtPolyRef ref) const;

    dtPolyRef getPolyRefBase(const dtMeshTile *tile) const;

    dtStatus getOffMeshConnectionPolyEndPoints(dtPolyRef prevRef, dtPolyRef polyRef, Vec3 *startPos, Vec3 *endPos) const;

    const dtOffMeshConnection *getOffMeshConnectionByRef(dtPolyRef ref) const;

    dtStatus setPolyFlags(dtPolyRef ref, unsigned short flags);

    dtStatus getPolyFlags(dtPolyRef ref, UnsignedShortRef *flags) const;

    dtStatus setPolyArea(dtPolyRef ref, unsigned char area);

    dtStatus getPolyArea(dtPolyRef ref, UnsignedCharRef *area) const;

    int getTileStateSize(const dtMeshTile *tile) const;

    NavMeshStoreTileStateResult storeTileState(const dtMeshTile *tile, const int maxDataSize) const;

    dtStatus restoreTileState(dtMeshTile *tile, const unsigned char *data, const int maxDataSize);

    void destroy();
};

struct NavMeshQueryRaycastResult
{
    dtStatus status;
    dtRaycastHit *raycastHit;
};

class NavMeshQuery
{
public:
    dtNavMeshQuery *m_navQuery;

    NavMeshQuery()
    {
        m_navQuery = 0;
    }

    NavMeshQuery(dtNavMeshQuery *navMeshQuery)
    {
        m_navQuery = navMeshQuery;
    }

    void init(NavMesh *navMesh, const int maxNodes)
    {
        m_navQuery = dtAllocNavMeshQuery();

        const dtNavMesh *nav = navMesh->getNavMesh();
        m_navQuery->init(nav, maxNodes);
    }

    dtStatus findPath(dtPolyRef startRef, dtPolyRef endRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, UnsignedIntArray *path, int maxPath)
    {
        dtPolyRef *pathArray = new dtPolyRef[maxPath];
        int pathCount;

        dtStatus status = m_navQuery->findPath(startRef, endRef, startPos, endPos, filter, pathArray, &pathCount, maxPath);

        path->copy(pathArray, pathCount);
        return status;
    }

    dtStatus closestPointOnPoly(dtPolyRef ref, const float *pos, Vec3 *closest, BoolRef *posOverPoly)
    {
        return m_navQuery->closestPointOnPoly(ref, pos, &closest->x, &posOverPoly->value);
    }

    dtStatus findStraightPath(
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

    dtStatus findNearestPoly(const float *center, const float *halfExtents, const dtQueryFilter *filter, UnsignedIntRef *nearestRef, Vec3 *nearestPt, BoolRef *isOverPoly)
    {
        return m_navQuery->findNearestPoly(center, halfExtents, filter, &nearestRef->value, &nearestPt->x, &isOverPoly->value);
    }

    dtStatus raycast(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, const unsigned int options, dtRaycastHit *hit, dtPolyRef prevRef)
    {
        return m_navQuery->raycast(startRef, startPos, endPos, filter, options, hit, prevRef);
    }

    Vec3 getClosestPoint(const float *position, const float *halfExtents, const dtQueryFilter *filter)
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

    Vec3 getRandomPointAround(const float *position, float maxRadius, const float *halfExtents, const dtQueryFilter *filter);

    dtStatus moveAlongSurface(dtPolyRef startRef, const float *startPos, const float *endPos, const dtQueryFilter *filter, Vec3 *resultPos, UnsignedIntArray *visited, int maxVisitedSize)
    {
        int size = 0;
        unsigned int *visitedArray = new unsigned int[maxVisitedSize];

        dtStatus status = m_navQuery->moveAlongSurface(startRef, startPos, endPos, filter, &resultPos->x, visitedArray, &size, maxVisitedSize);

        visited->copy(visitedArray, size);

        return status;
    }

    dtStatus getPolyHeight(dtPolyRef ref, const float *pos, FloatRef *height)
    {
        return m_navQuery->getPolyHeight(ref, pos, &height->value);
    }

    void destroy()
    {
        dtFreeNavMeshQuery(m_navQuery);
    }
};

class CrowdUtils
{
public:
    int getActiveAgentCount(dtCrowd *crowd);

    bool overOffMeshConnection(dtCrowd *crowd, int idx);

    void agentTeleport(dtCrowd *crowd, int idx, const float *destination, const float *halfExtents, dtQueryFilter *filter);
};

class Detour
{
public:
    int FAILURE = DT_FAILURE;
    int SUCCESS = DT_SUCCESS;
    int IN_PROGRESS = DT_IN_PROGRESS;
    int STATUS_DETAIL_MASK = DT_STATUS_DETAIL_MASK;
    int WRONG_MAGIC = DT_WRONG_MAGIC;
    int WRONG_VERSION = DT_WRONG_VERSION;
    int OUT_OF_MEMORY = DT_OUT_OF_MEMORY;
    int INVALID_PARAM = DT_INVALID_PARAM;
    int BUFFER_TOO_SMALL = DT_BUFFER_TOO_SMALL;
    int OUT_OF_NODES = DT_OUT_OF_NODES;
    int PARTIAL_RESULT = DT_PARTIAL_RESULT;
    int ALREADY_OCCUPIED = DT_ALREADY_OCCUPIED;

    int VERTS_PER_POLYGON = DT_VERTS_PER_POLYGON;
    int NAVMESH_MAGIC = DT_NAVMESH_MAGIC;
    int NAVMESH_VERSION = DT_NAVMESH_VERSION;
    int NAVMESH_STATE_MAGIC = DT_NAVMESH_STATE_MAGIC;
    int NAVMESH_STATE_VERSION = DT_NAVMESH_STATE_VERSION;

    int TILECACHE_MAGIC = DT_TILECACHE_MAGIC;
    int TILECACHE_VERSION = DT_TILECACHE_VERSION;
    unsigned char TILECACHE_NULL_AREA = DT_TILECACHE_NULL_AREA;
    unsigned char TILECACHE_WALKABLE_AREA = DT_TILECACHE_WALKABLE_AREA;
    unsigned short TILECACHE_NULL_IDX = DT_TILECACHE_NULL_IDX;

    bool statusSucceed(dtStatus status)
    {
        return dtStatusSucceed(status);
    }

    bool statusFailed(dtStatus status)
    {
        return dtStatusFailed(status);
    }

    bool statusInProgress(dtStatus status)
    {
        return dtStatusInProgress(status);
    }

    bool statusDetail(dtStatus status, unsigned int detail)
    {
        return dtStatusDetail(status, detail);
    }

    dtCrowd *allocCrowd()
    {
        return dtAllocCrowd();
    }

    void freeCrowd(dtCrowd *crowd)
    {
        dtFreeCrowd(crowd);
    }
};

struct CreateNavMeshDataResult
{
    bool success;
    UnsignedCharArray *navMeshData;
};

class DetourNavMeshBuilder
{
public:
    void setPolyMeshCreateParams(dtNavMeshCreateParams *navMeshCreateParams, rcPolyMesh *polyMesh)
    {
        navMeshCreateParams->verts = polyMesh->verts;
        navMeshCreateParams->vertCount = polyMesh->nverts;
        navMeshCreateParams->polys = polyMesh->polys;
        navMeshCreateParams->polyAreas = polyMesh->areas;
        navMeshCreateParams->polyFlags = polyMesh->flags;
        navMeshCreateParams->polyCount = polyMesh->npolys;
        navMeshCreateParams->nvp = polyMesh->nvp;

        rcVcopy(navMeshCreateParams->bmin, polyMesh->bmin);
        rcVcopy(navMeshCreateParams->bmax, polyMesh->bmax);
    }

    void setPolyMeshDetailCreateParams(dtNavMeshCreateParams *navMeshCreateParams, rcPolyMeshDetail *polyMeshDetail)
    {
        navMeshCreateParams->detailMeshes = polyMeshDetail->meshes;
        navMeshCreateParams->detailVerts = polyMeshDetail->verts;
        navMeshCreateParams->detailVertsCount = polyMeshDetail->nverts;
        navMeshCreateParams->detailTris = polyMeshDetail->tris;
        navMeshCreateParams->detailTriCount = polyMeshDetail->ntris;
    }

    void setOffMeshConCount(dtNavMeshCreateParams *navMeshCreateParams, size_t n)
    {
        float *offMeshConVerts = new float[n * 3 * 2];
        float *offMeshConRad = new float[n];
        unsigned char *offMeshConDirs = new unsigned char[n];
        unsigned char *offMeshConAreas = new unsigned char[n];
        unsigned short *offMeshConFlags = new unsigned short[n];
        unsigned int *offMeshConUserId = new unsigned int[n];
        int offMeshConCount = n;

        navMeshCreateParams->offMeshConVerts = offMeshConVerts;
        navMeshCreateParams->offMeshConRad = offMeshConRad;
        navMeshCreateParams->offMeshConDir = offMeshConDirs;
        navMeshCreateParams->offMeshConAreas = offMeshConAreas;
        navMeshCreateParams->offMeshConFlags = offMeshConFlags;
        navMeshCreateParams->offMeshConUserID = offMeshConUserId;
        navMeshCreateParams->offMeshConCount = offMeshConCount;
    }

    CreateNavMeshDataResult *createNavMeshData(dtNavMeshCreateParams &params)
    {
        CreateNavMeshDataResult *result = new CreateNavMeshDataResult;

        UnsignedCharArray *navMeshData = new UnsignedCharArray;
        result->navMeshData = navMeshData;

        if (!dtCreateNavMeshData(&params, &navMeshData->data, &navMeshData->size))
        {
            result->success = false;
            navMeshData->data = 0;
            navMeshData->size = 0;
        }
        else
        {
            result->success = true;
        }

        return result;
    }
};

struct RecastCalcBoundsResult
{
    float bmin[3];
    float bmax[3];
};

struct RecastCalcGridSizeResult
{
    int width;
    int height;
};

class Recast
{
public:
    unsigned short BORDER_REG = RC_BORDER_REG;
    unsigned short MULTIPLE_REGS = RC_MULTIPLE_REGS;
    int BORDER_VERTEX = RC_BORDER_VERTEX;
    int AREA_BORDER = RC_AREA_BORDER;
    int CONTOUR_REG_MASK = RC_CONTOUR_REG_MASK;
    unsigned short MESH_NULL_IDX = RC_MESH_NULL_IDX;
    unsigned char NULL_AREA = RC_NULL_AREA;
    unsigned char WALKABLE_AREA = RC_WALKABLE_AREA;
    int NOT_CONNECTED = RC_NOT_CONNECTED;

    RecastCalcBoundsResult *calcBounds(const FloatArray *verts, int nv)
    {
        RecastCalcBoundsResult *result = new RecastCalcBoundsResult;

        rcCalcBounds(verts->data, nv, result->bmin, result->bmax);

        return result;
    }

    RecastCalcGridSizeResult *calcGridSize(const float *bmin, const float *bmax, float cs)
    {
        RecastCalcGridSizeResult *result = new RecastCalcGridSizeResult;

        rcCalcGridSize(bmin, bmax, cs, &result->width, &result->height);

        return result;
    }

    bool createHeightfield(rcContext *ctx, rcHeightfield &hf, int width, int height, const float *bmin, const float *bmax, float cs, float ch)
    {
        return rcCreateHeightfield(ctx, hf, width, height, bmin, bmax, cs, ch);
    }

    void markWalkableTriangles(rcContext *ctx, const float walkableSlopeAngle, const FloatArray *verts, int nv, const IntArray *tris, int nt, UnsignedCharArray *areas)
    {
        rcMarkWalkableTriangles(ctx, walkableSlopeAngle, verts->data, nv, tris->data, nt, areas->data);
    }

    void clearUnwalkableTriangles(rcContext *ctx, const float walkableSlopeAngle, const FloatArray *verts, int nv, const IntArray *tris, int nt, UnsignedCharArray *areas)
    {
        rcClearUnwalkableTriangles(ctx, walkableSlopeAngle, verts->data, nv, tris->data, nt, areas->data);
    }

    bool rasterizeTriangles(rcContext *ctx, const FloatArray *verts, const int nv, const IntArray *tris, UnsignedCharArray *areas, const int nt, rcHeightfield &solid, const int flagMergeThr)
    {
        return rcRasterizeTriangles(ctx, verts->data, nv, tris->data, areas->data, nt, solid, flagMergeThr);
    }

    void filterLowHangingWalkableObstacles(rcContext *ctx, const int walkableClimb, rcHeightfield &solid)
    {
        rcFilterLowHangingWalkableObstacles(ctx, walkableClimb, solid);
    }

    void filterLedgeSpans(rcContext *ctx, const int walkableHeight, const int walkableClimb, rcHeightfield &solid)
    {
        rcFilterLedgeSpans(ctx, walkableHeight, walkableClimb, solid);
    }

    void filterWalkableLowHeightSpans(rcContext *ctx, const int walkableHeight, rcHeightfield &solid)
    {
        rcFilterWalkableLowHeightSpans(ctx, walkableHeight, solid);
    }

    int getHeightFieldSpanCount(rcContext *ctx, rcHeightfield &solid)
    {
        return rcGetHeightFieldSpanCount(ctx, solid);
    }

    bool buildCompactHeightfield(rcContext *ctx, const int walkableHeight, const int walkableClimb, rcHeightfield &hf, rcCompactHeightfield &chf)
    {
        return rcBuildCompactHeightfield(ctx, walkableHeight, walkableClimb, hf, chf);
    }

    bool erodeWalkableArea(rcContext *ctx, int radius, rcCompactHeightfield &chf)
    {
        return rcErodeWalkableArea(ctx, radius, chf);
    }

    bool medianFilterWalkableArea(rcContext *ctx, rcCompactHeightfield &chf)
    {
        return rcMedianFilterWalkableArea(ctx, chf);
    }

    void markBoxArea(rcContext *ctx, const float *bmin, const float *bmax, unsigned char areaId, rcCompactHeightfield &chf)
    {
        rcMarkBoxArea(ctx, bmin, bmax, areaId, chf);
    }

    void markConvexPolyArea(rcContext *ctx, const FloatArray *verts, int nverts, const float hmin, const float hmax, unsigned char areaId, rcCompactHeightfield &chf)
    {
        rcMarkConvexPolyArea(ctx, verts->data, nverts, hmin, hmax, areaId, chf);
    }

    void markCylinderArea(rcContext *ctx, const float *pos, const float r, const float h, unsigned char areaId, rcCompactHeightfield &chf)
    {
        rcMarkCylinderArea(ctx, pos, r, h, areaId, chf);
    }

    bool buildDistanceField(rcContext *ctx, rcCompactHeightfield &chf)
    {
        return rcBuildDistanceField(ctx, chf);
    }

    bool buildRegions(rcContext *ctx, rcCompactHeightfield &chf, const int borderSize, const int minRegionArea, const int mergeRegionArea)
    {
        return rcBuildRegions(ctx, chf, borderSize, minRegionArea, mergeRegionArea);
    }

    bool buildLayerRegions(rcContext *ctx, rcCompactHeightfield &chf, const int borderSize, const int minRegionArea)
    {
        return rcBuildLayerRegions(ctx, chf, borderSize, minRegionArea);
    }

    bool buildRegionsMonotone(rcContext *ctx, rcCompactHeightfield &chf, const int borderSize, const int minRegionArea, const int mergeRegionArea)
    {
        return rcBuildRegionsMonotone(ctx, chf, borderSize, minRegionArea, mergeRegionArea);
    }

    void setCon(rcCompactSpan &s, int dir, int i)
    {
        rcSetCon(s, dir, i);
    }

    int getCon(const rcCompactSpan &s, int dir)
    {
        return rcGetCon(s, dir);
    }

    int getDirOffsetX(int dir)
    {
        return rcGetDirOffsetX(dir);
    }

    int getDirOffsetY(int dir)
    {
        return rcGetDirOffsetY(dir);
    }

    int getDirForOffset(int x, int y)
    {
        return rcGetDirForOffset(x, y);
    }

    bool buildHeightfieldLayers(rcContext *ctx, rcCompactHeightfield &chf, const int borderSize, const int walkableHeight, rcHeightfieldLayerSet &lset)
    {
        return rcBuildHeightfieldLayers(ctx, chf, borderSize, walkableHeight, lset);
    }

    bool buildContours(rcContext *ctx, rcCompactHeightfield &chf, const float maxError, const int maxEdgeLen, rcContourSet &cset, const int buildFlags)
    {
        return rcBuildContours(ctx, chf, maxError, maxEdgeLen, cset, buildFlags);
    }

    bool buildPolyMesh(rcContext *ctx, rcContourSet &cset, const int nvp, rcPolyMesh &mesh)
    {
        return rcBuildPolyMesh(ctx, cset, nvp, mesh);
    }

    bool mergePolyMeshes(rcContext *ctx, rcPolyMesh **meshes, const int nmeshes, rcPolyMesh &mesh)
    {
        return rcMergePolyMeshes(ctx, meshes, nmeshes, mesh);
    }

    bool buildPolyMeshDetail(rcContext *ctx, const rcPolyMesh &mesh, const rcCompactHeightfield &chf, const float sampleDist, const float sampleMaxError, rcPolyMeshDetail &dmesh)
    {
        return rcBuildPolyMeshDetail(ctx, mesh, chf, sampleDist, sampleMaxError, dmesh);
    }

    bool copyPolyMesh(rcContext *ctx, const rcPolyMesh &src, rcPolyMesh &dst)
    {
        return rcCopyPolyMesh(ctx, src, dst);
    }

    bool mergePolyMeshDetails(rcContext *ctx, rcPolyMeshDetail **meshes, const int nmeshes, rcPolyMeshDetail &mesh)
    {
        return rcMergePolyMeshDetails(ctx, meshes, nmeshes, mesh);
    }

    UnsignedCharArray *getHeightfieldLayerHeights(rcHeightfieldLayer *heightfieldLayer)
    {
        UnsignedCharArray *array = new UnsignedCharArray();
        array->view(heightfieldLayer->heights);
        return array;
    }

    UnsignedCharArray *getHeightfieldLayerAreas(rcHeightfieldLayer *heightfieldLayer)
    {
        UnsignedCharArray *array = new UnsignedCharArray();
        array->view(heightfieldLayer->areas);
        return array;
    }

    UnsignedCharArray *getHeightfieldLayerCons(rcHeightfieldLayer *heightfieldLayer)
    {
        UnsignedCharArray *array = new UnsignedCharArray();
        array->view(heightfieldLayer->cons);
        return array;
    }

    rcHeightfield *allocHeightfield()
    {
        return rcAllocHeightfield();
    }

    void freeHeightfield(rcHeightfield *hf)
    {
        rcFreeHeightField(hf);
    }

    rcCompactHeightfield *allocCompactHeightfield()
    {
        return rcAllocCompactHeightfield();
    }

    void freeCompactHeightfield(rcCompactHeightfield *chf)
    {
        rcFreeCompactHeightfield(chf);
    }

    rcHeightfieldLayerSet *allocHeightfieldLayerSet()
    {
        return rcAllocHeightfieldLayerSet();
    }

    void freeHeightfieldLayerSet(rcHeightfieldLayerSet *lset)
    {
        rcFreeHeightfieldLayerSet(lset);
    }

    rcContourSet *allocContourSet()
    {
        return rcAllocContourSet();
    }

    void freeContourSet(rcContourSet *cset)
    {
        rcFreeContourSet(cset);
    }

    rcPolyMesh *allocPolyMesh()
    {
        return rcAllocPolyMesh();
    }

    void freePolyMesh(rcPolyMesh *pmesh)
    {
        rcFreePolyMesh(pmesh);
    }

    rcPolyMeshDetail *allocPolyMeshDetail()
    {
        return rcAllocPolyMeshDetail();
    }

    void freePolyMeshDetail(rcPolyMeshDetail *dmesh)
    {
        rcFreePolyMeshDetail(dmesh);
    }
};

class ChunkyTriMesh
{
public:
    bool createChunkyTriMesh(const FloatArray *verts, const IntArray *tris, int ntris, int trisPerChunk, rcChunkyTriMesh *chunkyTriMesh)
    {
        return rcCreateChunkyTriMesh(verts->data, tris->data, ntris, trisPerChunk, chunkyTriMesh);
    }

    int getChunksOverlappingRect(rcChunkyTriMesh *chunkyTriMesh, float *tbmin, float *tbmax, IntArray *ids, const int maxIds)
    {
        return rcGetChunksOverlappingRect(chunkyTriMesh, tbmin, tbmax, ids->data, maxIds);
    }

    IntArray *getChunkyTriMeshNodeTris(rcChunkyTriMesh *chunkyTriMesh, int nodeIndex)
    {
        rcChunkyTriMeshNode &node = chunkyTriMesh->nodes[nodeIndex];
        int *tris = &chunkyTriMesh->tris[node.i * 3];

        IntArray *result = new IntArray;
        result->view(tris);

        return result;
    }
};

class DetourTileCacheBuilder
{
public:
    int buildTileCacheLayer(
        dtTileCacheCompressor *comp,
        dtTileCacheLayerHeader *header,
        const UnsignedCharArray *heights,
        const UnsignedCharArray *areas,
        const UnsignedCharArray *cons,
        UnsignedCharArray *tileCacheData)
    {
        return dtBuildTileCacheLayer(comp, header, heights->data, areas->data, cons->data, &tileCacheData->data, &tileCacheData->size);
    }
};

struct NavMeshExport
{
    void *dataPointer;
    int size;
};

class NavMeshExporter
{
public:
    NavMeshExporter() {}

    NavMeshExport exportNavMesh(NavMesh *navMesh, TileCache *tileCache) const;
    void freeNavMeshExport(NavMeshExport *navMeshExport);
};

struct NavMeshImporterResult
{
    bool success;
    NavMesh *navMesh;
    TileCache *tileCache;
    RecastLinearAllocator *allocator;
    RecastFastLZCompressor *compressor;
};

class NavMeshImporter
{
public:
    NavMeshImporter() {}

    NavMeshImporterResult importNavMesh(NavMeshExport *navMeshExport, TileCacheMeshProcessAbstract &meshProcess);
};
