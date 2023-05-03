#pragma once
#include "../recastnavigation/Recast/Include/Recast.h"
#include "../recastnavigation/Detour/Include/DetourNavMesh.h"
#include "../recastnavigation/Detour/Include/DetourCommon.h"
#include "../recastnavigation/Detour/Include/DetourNavMeshBuilder.h"
#include "../recastnavigation/DetourCrowd/Include/DetourCrowd.h"
#include "../recastnavigation/DetourTileCache/Include/DetourTileCache.h"
#include "../recastnavigation/DetourTileCache/Include/DetourTileCacheBuilder.h"
#include "../recastnavigation/RecastDemo/Contrib/fastlz/fastlz.h"

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
struct TileCacheData;

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

struct Triangle
{
    Vec3 mPoint[3];

    Triangle() {}

    const Vec3 &getPoint(long n)
    {
        if (n < 2)
        {
            return mPoint[n];
        }
        return mPoint[2];
    }
};

struct NavPath
{
    std::vector<Vec3> mPoints;

    int getPointCount() { return int(mPoints.size()); }

    const Vec3 &getPoint(int n)
    {
        if (n < int(mPoints.size()))
        {
            return mPoints[n];
        }
        return mPoints.back();
    }
};

struct DebugNavMesh
{
    std::vector<Triangle> mTriangles;

    int getTriangleCount() { return int(mTriangles.size()); }

    const Triangle &getTriangle(int n)
    {
        if (n < int(mTriangles.size()))
        {
            return mTriangles[n];
        }
        return mTriangles.back();
    }
};

struct NavMeshCreateParams
{
    dtNavMeshCreateParams params;

    dtNavMeshCreateParams getParams()
    {
        return params;
    }

    void setVerts(unsigned short *verts)
    {
        params.verts = verts;
    }

    void setVertCount(int vertCount)
    {
        params.vertCount = vertCount;
    }

    void setPolys(unsigned short *polys)
    {
        params.polys = polys;
    }

    void setPolyFlags(unsigned short *polyFlags)
    {
        params.polyFlags = polyFlags;
    }

    void setPolyAreas(unsigned char *polyAreas)
    {
        params.polyAreas = polyAreas;
    }

    void setPolyCount(int polyCount)
    {
        params.polyCount = polyCount;
    }

    void setNvp(int nvp)
    {
        params.nvp = nvp;
    }

    void setDetailMeshes(unsigned int *detailMeshes)
    {
        params.detailMeshes = detailMeshes;
    }

    void setDetailVerts(float *detailVerts)
    {
        params.detailVerts = detailVerts;
    }

    void setDetailVertsCount(int detailVertsCount)
    {
        params.detailVertsCount = detailVertsCount;
    }

    void setDetailTris(unsigned char *detailTris)
    {
        params.detailTris = detailTris;
    }

    void setDetailTriCount(int detailTriCount)
    {
        params.detailTriCount = detailTriCount;
    }

    void setOffMeshConVerts(float *offMeshConVerts)
    {
        params.offMeshConVerts = offMeshConVerts;
    }

    void setOffMeshConRad(float *offMeshConRad)
    {
        params.offMeshConRad = offMeshConRad;
    }

    void setOffMeshConFlags(unsigned short *offMeshConFlags)
    {
        params.offMeshConFlags = offMeshConFlags;
    }

    void setOffMeshConAreas(unsigned char *offMeshConAreas)
    {
        params.offMeshConAreas = offMeshConAreas;
    }

    void setOffMeshConDir(unsigned char *offMeshConDir)
    {
        params.offMeshConDir = offMeshConDir;
    }

    void setOffMeshConUserID(unsigned int *offMeshConUserID)
    {
        params.offMeshConUserID = offMeshConUserID;
    }

    void setOffMeshConCount(int offMeshConCount)
    {
        params.offMeshConCount = offMeshConCount;
    }

    void setUserId(unsigned int userId)
    {
        params.userId = userId;
    }

    void setTileX(int tileX)
    {
        params.tileX = tileX;
    }

    void setTileY(int tileY)
    {
        params.tileY = tileY;
    }

    void setTileLayer(int tileLayer)
    {
        params.tileLayer = tileLayer;
    }

    void setBmin(float *bmin)
    {
        params.bmin[0] = bmin[0];
        params.bmin[1] = bmin[1];
        params.bmin[2] = bmin[2];
    }

    void setBmax(float *bmax)
    {
        params.bmax[0] = bmax[0];
        params.bmax[1] = bmax[1];
        params.bmax[2] = bmax[2];
    }

    void setWalkableHeight(float walkableHeight)
    {
        params.walkableHeight = walkableHeight;
    }

    void setWalkableRadius(float walkableRadius)
    {
        params.walkableRadius = walkableRadius;
    }

    void setWalkableClimb(float walkableClimb)
    {
        params.walkableClimb = walkableClimb;
    }

    void setCs(float cs)
    {
        params.cs = cs;
    }

    void setCh(float ch)
    {
        params.ch = ch;
    }

    void setBuildBvTree(bool buildBvTree)
    {
        params.buildBvTree = buildBvTree;
    }
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
            dtFree(buffer);
    }

    void resize(const size_t cap)
    {
        if (buffer)
            dtFree(buffer);
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
            return 0;
        if (top + size > capacity)
            return 0;
        unsigned char *mem = &buffer[top];
        top += size;
        return mem;
    }

    virtual void free(void * /* ptr */)
    {
        // Empty
    }
};

struct RecastMeshProcess : public dtTileCacheMeshProcess
{
    inline RecastMeshProcess() {}

    virtual void process(struct dtNavMeshCreateParams *params,
                         unsigned char *polyAreas, unsigned short *polyFlags)
    {
        // Update poly flags from areas.
        for (int i = 0; i < params->polyCount; ++i)
        {
            polyAreas[i] = 0;
            polyFlags[i] = 1; // SAMPLE_POLYFLAGS_WALK
        }

        // Pass in off-mesh connections.
        params->offMeshConVerts = 0;  // m_geom->getOffMeshConnectionVerts();
        params->offMeshConRad = 0;    // m_geom->getOffMeshConnectionRads();
        params->offMeshConDir = 0;    // m_geom->getOffMeshConnectionDirs();
        params->offMeshConAreas = 0;  // m_geom->getOffMeshConnectionAreas();
        params->offMeshConFlags = 0;  // m_geom->getOffMeshConnectionFlags();
        params->offMeshConUserID = 0; // m_geom->getOffMeshConnectionId();
        params->offMeshConCount = 0;  // m_geom->getOffMeshConnectionCount();
    }
};

struct CreateNavMeshDataResult
{
    bool success;
    unsigned char *navMeshData;
    int navMeshDataSize;
};

struct NavMeshAddTileResult
{
    unsigned int status;
    unsigned int tileRef;
};

class NavMeshBuilder
{
public:
    CreateNavMeshDataResult createNavMeshData(NavMeshCreateParams &params);
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

    TileCache() : m_tileCache(0), m_talloc(32000) {}

    bool init(const dtTileCacheParams &params);
    TileCacheAddTileResult addTile(unsigned char *data, const int dataSize, unsigned char flags);
    dtStatus buildNavMeshTile(const dtCompressedTileRef *ref, NavMesh *navMesh);
    dtStatus buildNavMeshTilesAt(const int tx, const int ty, NavMesh *navMesh);
    TileCacheUpdateResult update(NavMesh *navMesh);
    dtObstacleRef *addCylinderObstacle(const Vec3 &position, float radius, float height);
    dtObstacleRef *addBoxObstacle(const Vec3 &position, const Vec3 &extent, float angle);
    void removeObstacle(dtObstacleRef *obstacle);
    void destroy();

protected:
    std::list<dtObstacleRef> m_obstacles;

    RecastLinearAllocator m_talloc;
    RecastFastLZCompressor m_tcomp;
    RecastMeshProcess m_tmproc;
};

class NavMesh
{
public:
    dtNavMesh *m_navMesh;

    NavMesh() : m_navMesh(0) {}

    bool initSolo(unsigned char *data, const int dataSize, const int flags);

    bool initTiled(const dtNavMeshParams *params);

    void destroy();

    NavMeshAddTileResult addTile(unsigned char *data, int dataSize, int flags, dtTileRef lastRef);

    DebugNavMesh getDebugNavMesh();

    dtNavMesh *getNavMesh()
    {
        return m_navMesh;
    }

protected:
    void navMeshPoly(
        DebugNavMesh &debugNavMesh,
        const dtNavMesh &mesh,
        dtPolyRef ref);

    void navMeshPolysWithFlags(
        DebugNavMesh &debugNavMesh,
        const dtNavMesh &mesh,
        const unsigned short polyFlags);
};

class NavMeshQuery
{
    Vec3 m_defaultQueryExtent;

public:
    dtNavMeshQuery *m_navQuery;

    NavMeshQuery(NavMesh *navMesh, const int maxNodes);

    Vec3 getClosestPoint(const Vec3 &position);
    Vec3 getRandomPointAround(const Vec3 &position, float maxRadius);
    Vec3 moveAlong(const Vec3 &position, const Vec3 &destination);
    NavPath computePath(const Vec3 &start, const Vec3 &end) const;
    void destroy();

    void setDefaultQueryExtent(const Vec3 &extent)
    {
        m_defaultQueryExtent = extent;
    }

    Vec3 getDefaultQueryExtent() const
    {
        return m_defaultQueryExtent;
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

    const NavMesh &getNavMesh()
    {
        return *navMesh;
    }

    const TileCache &getTileCache()
    {
        return *tileCache;
    }
};

class NavMeshImporter
{
public:
    NavMeshImporter() {}

    NavMeshImporterResult importNavMesh(NavMeshExport *navMeshExport);
};

struct NavMeshGeneratorResult
{
    bool success;
    NavMesh *navMesh;
    TileCache *tileCache;

    const NavMesh &getNavMesh()
    {
        return *navMesh;
    }

    const TileCache &getTileCache()
    {
        return *tileCache;
    }
};

class NavMeshGenerator
{
    rcPolyMesh *m_pmesh;
    rcPolyMeshDetail *m_dmesh;
    unsigned char *m_navData;

public:
    NavMeshGenerator() : m_pmesh(0), m_dmesh(0), m_navData(0) {}

    NavMeshGeneratorResult generate(
        const float *positions,
        const int positionCount,
        const int *indices,
        const int indexCount,
        const rcConfig &config);

    void destroy();

protected:
    NavMeshGeneratorResult *computeTiledNavMesh(
        rcConfig &cfg,
        NavMeshIntermediates &intermediates,
        const float *verts,
        int nverts,
        const int *tris,
        int ntris);

    NavMeshGeneratorResult *computeSoloNavMesh(
        rcConfig &cfg,
        rcContext &ctx,
        NavMeshIntermediates &intermediates,
        bool keepInterResults,
        const float *verts,
        int nverts,
        const int *tris,
        int ntris);

    int rasterizeTileLayers(
        NavMesh *navMesh,
        TileCache *tileCache,
        const int tx,
        const int ty,
        const rcConfig &cfg,
        TileCacheData *tiles,
        const int maxTiles,
        NavMeshIntermediates &intermediates,
        const float *verts,
        int nverts);
};

class Crowd
{
public:
    Crowd(const int maxAgents, const float maxAgentRadius, NavMesh *navMesh);

    void destroy();

    int addAgent(const Vec3 &pos, const dtCrowdAgentParams *params);

    void removeAgent(const int idx);

    void update(const float dt);

    int getAgentCount();

    int getActiveAgentCount();

    Vec3 getAgentPosition(int idx);

    Vec3 getAgentVelocity(int idx);

    Vec3 getAgentNextTargetPath(int idx);

    int getAgentState(int idx);

    bool overOffMeshConnection(int idx);

    void agentGoto(int idx, const Vec3 &destination);

    void agentResetMoveTarget(int idx);

    void agentTeleport(int idx, const Vec3 &destination);

    dtCrowdAgentParams getAgentParameters(const int idx);

    void setAgentParameters(const int idx, const dtCrowdAgentParams *params);

    void setDefaultQueryExtent(const Vec3 &extent)
    {
        m_defaultQueryExtent = extent;
    }

    Vec3 getDefaultQueryExtent() const
    {
        return m_defaultQueryExtent;
    }

    NavPath getCorners(const int idx);

protected:
    dtCrowd *m_crowd;
    Vec3 m_defaultQueryExtent;
};
