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

#include <list>

#include "./Arrays.h"
#include "./Vec.h"
#include "./NavMesh.h"

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

struct TileCacheMeshProcessJsImpl
{
    TileCacheMeshProcessJsImpl()
    {
    }

    virtual ~TileCacheMeshProcessJsImpl()
    {
    }

    virtual void process(struct dtNavMeshCreateParams *params, UnsignedCharArray *polyAreas, UnsignedShortArray *polyFlags) = 0;
};

struct TileCacheMeshProcessWrapper : public dtTileCacheMeshProcess
{
    TileCacheMeshProcessJsImpl &js;

    TileCacheMeshProcessWrapper(TileCacheMeshProcessJsImpl &inJs) : js(inJs) {}

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

    bool init(const dtTileCacheParams *params, RecastLinearAllocator *allocator, RecastFastLZCompressor *compressor, TileCacheMeshProcessJsImpl &meshProcess);

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
