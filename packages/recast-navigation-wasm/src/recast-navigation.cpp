#include "recast-navigation.h"
#include "Recast.h"
#include "DetourNavMesh.h"
#include "DetourCommon.h"
#include "DetourNavMeshBuilder.h"
#include "DetourNavMesh.h"
#include "DetourNavMeshQuery.h"
#include "ChunkyTriMesh.h"

#include <stdio.h>
#include <vector>
#include <float.h>
#include <algorithm>
#include <math.h>
#include <sstream>

void Log(const char *str)
{
    std::cout << std::string(str) << std::endl;
}

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

struct TileCacheData
{
    unsigned char *data;
    int dataSize;
};

CreateNavMeshDataResult NavMeshBuilder::createNavMeshData(dtNavMeshCreateParams &navMeshCreateParams)
{
    CreateNavMeshDataResult *createNavMeshDataResult = new CreateNavMeshDataResult;

    unsigned char *navMeshData;
    int navMeshDataSize = 0;

    if (!dtCreateNavMeshData(&navMeshCreateParams, &createNavMeshDataResult->navMeshData, &createNavMeshDataResult->navMeshDataSize))
    {
        Log("Could not build NavMeshData");

        createNavMeshDataResult->success = false;
        createNavMeshDataResult->navMeshData = 0;
        createNavMeshDataResult->navMeshDataSize = 0;
    }
    else
    {
        createNavMeshDataResult->success = true;
        createNavMeshDataResult->navMeshData = navMeshData;
        createNavMeshDataResult->navMeshDataSize = navMeshDataSize;
    }

    return *createNavMeshDataResult;
}

bool TileCache::init(const dtTileCacheParams &params)
{
    m_tileCache = dtAllocTileCache();
    if (!m_tileCache)
    {
        return false;
    }

    dtStatus status = m_tileCache->init(&params, &m_talloc, &m_tcomp, &m_tmproc);
    if (dtStatusFailed(status))
    {
        return false;
    }

    return true;
};

TileCacheAddTileResult TileCache::addTile(unsigned char *data, const int dataSize, unsigned char flags)
{
    TileCacheAddTileResult *result = new TileCacheAddTileResult;

    dtStatus status = m_tileCache->addTile(data, dataSize, flags, &result->tileRef);
    result->status = status;

    return *result;
}

dtStatus TileCache::buildNavMeshTile(const dtCompressedTileRef *ref, NavMesh *navMesh)
{
    return m_tileCache->buildNavMeshTile(*ref, navMesh->getNavMesh());
};

dtStatus TileCache::buildNavMeshTilesAt(const int tx, const int ty, NavMesh *navMesh)
{
    return m_tileCache->buildNavMeshTilesAt(tx, ty, navMesh->getNavMesh());
};

TileCacheUpdateResult TileCache::update(NavMesh *navMesh)
{
    TileCacheUpdateResult *result = new TileCacheUpdateResult;
    dtStatus status = m_tileCache->update(0, navMesh->getNavMesh(), &result->upToDate);

    result->status = status;

    return *result;
};

dtObstacleRef *TileCache::addCylinderObstacle(const Vec3 &position, float radius, float height)
{
    dtObstacleRef ref(-1);
    if (!m_tileCache)
    {
        return nullptr;
    }

    m_tileCache->addObstacle(&position.x, radius, height, &ref);
    m_obstacles.push_back(ref);
    return &m_obstacles.back();
}

dtObstacleRef *TileCache::addBoxObstacle(const Vec3 &position, const Vec3 &extent, float angle)
{
    dtObstacleRef ref(-1);
    if (!m_tileCache)
    {
        return nullptr;
    }

    m_tileCache->addBoxObstacle(&position.x, &extent.x, angle, &ref);
    m_obstacles.push_back(ref);
    return &m_obstacles.back();
}

void TileCache::removeObstacle(dtObstacleRef *obstacle)
{
    if (!m_tileCache || !obstacle || *obstacle == -1)
    {
        return;
    }

    m_tileCache->removeObstacle(*obstacle);
    auto iter = std::find(m_obstacles.begin(), m_obstacles.end(), *obstacle);
    if (iter != m_obstacles.end())
    {
        m_obstacles.erase(iter);
    }
}

void TileCache::destroy()
{
    if (m_tileCache)
    {
        dtFreeTileCache(m_tileCache);
    }

    m_talloc.reset();
}

NavMeshQuery::NavMeshQuery(NavMesh *navMesh, const int maxNodes)
{
    m_defaultQueryExtent = 1.0f;

    m_navQuery = dtAllocNavMeshQuery();

    const dtNavMesh *nav = navMesh->getNavMesh();
    m_navQuery->init(nav, maxNodes);
}

Vec3 NavMeshQuery::getClosestPoint(const Vec3 &position)
{
    dtQueryFilter filter;
    filter.setIncludeFlags(0xffff);
    filter.setExcludeFlags(0);

    dtPolyRef polyRef;

    Vec3 pos(position.x, position.y, position.z);
    m_navQuery->findNearestPoly(&pos.x, &m_defaultQueryExtent.x, &filter, &polyRef, 0);

    bool posOverlay;
    Vec3 resDetour;
    dtStatus status = m_navQuery->closestPointOnPoly(polyRef, &pos.x, &resDetour.x, &posOverlay);

    if (dtStatusFailed(status))
    {
        return Vec3(0.f, 0.f, 0.f);
    }
    return Vec3(resDetour.x, resDetour.y, resDetour.z);
}

Vec3 NavMeshQuery::getRandomPointAround(const Vec3 &position, float maxRadius)
{
    dtQueryFilter filter;
    filter.setIncludeFlags(0xffff);
    filter.setExcludeFlags(0);

    dtPolyRef polyRef;

    Vec3 pos(position.x, position.y, position.z);

    m_navQuery->findNearestPoly(&pos.x, &m_defaultQueryExtent.x, &filter, &polyRef, 0);

    dtPolyRef randomRef;
    Vec3 resDetour;
    dtStatus status = m_navQuery->findRandomPointAroundCircle(polyRef, &position.x, maxRadius,
                                                              &filter, r01,
                                                              &randomRef, &resDetour.x);
    if (dtStatusFailed(status))
    {
        return Vec3(0.f, 0.f, 0.f);
    }

    return Vec3(resDetour.x, resDetour.y, resDetour.z);
}

Vec3 NavMeshQuery::moveAlong(const Vec3 &position, const Vec3 &destination)
{
    dtQueryFilter filter;
    filter.setIncludeFlags(0xffff);
    filter.setExcludeFlags(0);

    dtPolyRef polyRef;

    Vec3 pos(position.x, position.y, position.z);
    Vec3 dest(destination.x, destination.y, destination.z);

    m_navQuery->findNearestPoly(&pos.x, &m_defaultQueryExtent.x, &filter, &polyRef, 0);

    Vec3 resDetour;
    dtPolyRef visitedPoly[128];
    int visitedPolyCount;
    dtStatus status = m_navQuery->moveAlongSurface(polyRef, &pos.x, &dest.x,
                                                   &filter,
                                                   &resDetour.x, visitedPoly, &visitedPolyCount, sizeof(visitedPoly) / sizeof(dtPolyRef));
    if (dtStatusFailed(status))
    {
        return Vec3(0.f, 0.f, 0.f);
    }
    return Vec3(resDetour.x, resDetour.y, resDetour.z);
}

NavPath NavMeshQuery::computePath(const Vec3 &start, const Vec3 &end) const
{
    NavPath navpath;
    static const int MAX_POLYS = 256;
    float straightPath[MAX_POLYS * 3];

    dtPolyRef startRef;
    dtPolyRef endRef;

    dtQueryFilter filter;
    filter.setIncludeFlags(0xffff);
    filter.setExcludeFlags(0);

    Vec3 posStart(start.x, start.y, start.z);
    Vec3 posEnd(end.x, end.y, end.z);

    m_navQuery->findNearestPoly(&posStart.x, &m_defaultQueryExtent.x, &filter, &startRef, 0);
    m_navQuery->findNearestPoly(&posEnd.x, &m_defaultQueryExtent.x, &filter, &endRef, 0);

    dtPolyRef polys[MAX_POLYS];
    int npolys;

    m_navQuery->findPath(startRef, endRef, &posStart.x, &posEnd.x, &filter, polys, &npolys, MAX_POLYS);
    int mNstraightPath = 0;
    if (npolys)
    {
        unsigned char straightPathFlags[MAX_POLYS];
        dtPolyRef straightPathPolys[MAX_POLYS];
        int straightPathOptions;
        bool posOverPoly;
        Vec3 closestEnd = posEnd;

        if (polys[npolys - 1] != endRef)
        {
            m_navQuery->closestPointOnPoly(polys[npolys - 1], &end.x, &closestEnd.x, &posOverPoly);
        }
        straightPathOptions = 0;
        m_navQuery->findStraightPath(&posStart.x, &closestEnd.x, polys, npolys,
                                     straightPath, straightPathFlags,
                                     straightPathPolys, &mNstraightPath, MAX_POLYS, straightPathOptions);

        navpath.mPoints.resize(mNstraightPath);
        for (int i = 0; i < mNstraightPath; i++)
        {
            navpath.mPoints[i] = Vec3(straightPath[i * 3], straightPath[i * 3 + 1], straightPath[i * 3 + 2]);
        }
    }
    return navpath;
}

void NavMeshQuery::destroy()
{
    dtFreeNavMeshQuery(m_navQuery);
}

struct NavMeshIntermediates
{
    ~NavMeshIntermediates()
    {
        if (m_solid)
        {
            rcFreeHeightField(m_solid);
        }
        if (m_chf)
        {
            rcFreeCompactHeightfield(m_chf);
        }
        if (m_cset)
        {
            rcFreeContourSet(m_cset);
        }
        if (m_lset)
        {
            rcFreeHeightfieldLayerSet(m_lset);
        }
        if (m_chunkyMesh)
        {
            delete m_chunkyMesh;
        }
    }

    rcHeightfield *m_solid = nullptr;
    rcCompactHeightfield *m_chf = nullptr;
    rcContourSet *m_cset = nullptr;
    rcHeightfieldLayerSet *m_lset = nullptr;
    rcChunkyTriMesh *m_chunkyMesh = nullptr;
};

static const int NAVMESHSET_MAGIC = 'M' << 24 | 'S' << 16 | 'E' << 8 | 'T'; //'MSET';
static const int NAVMESHSET_VERSION = 1;
static const int TILECACHESET_MAGIC = 'T' << 24 | 'S' << 16 | 'E' << 8 | 'T'; //'TSET';
static const int TILECACHESET_VERSION = 1;

struct RecastHeader
{
    int magic;
    int version;
    int numTiles;
};

struct TileCacheSetHeader
{
    dtNavMeshParams meshParams;
    dtTileCacheParams cacheParams;
};

struct TileCacheTileHeader
{
    dtCompressedTileRef tileRef;
    int dataSize;
};

struct NavMeshSetHeader
{
    dtNavMeshParams params;
};

struct NavMeshTileHeader
{
    dtTileRef tileRef;
    int dataSize;
};

NavMeshExport NavMeshExporter::exportNavMesh(NavMesh *navMesh, TileCache *tileCache) const
{
    if (!navMesh->m_navMesh)
    {
        return {0, 0};
    }

    unsigned char *bits = nullptr;
    size_t bitsSize = 0;

    const dtNavMesh *m_navMesh = navMesh->m_navMesh;
    const dtTileCache *m_tileCache = tileCache->m_tileCache;

    if (m_tileCache)
    {
        // tilecache set
        // Store header.
        RecastHeader recastHeader;
        TileCacheSetHeader header;
        recastHeader.magic = TILECACHESET_MAGIC;
        recastHeader.version = TILECACHESET_VERSION;
        recastHeader.numTiles = 0;
        for (int i = 0; i < m_tileCache->getTileCount(); ++i)
        {
            const dtCompressedTile *tile = m_tileCache->getTile(i);
            if (!tile || !tile->header || !tile->dataSize)
                continue;
            recastHeader.numTiles++;
        }
        memcpy(&header.cacheParams, m_tileCache->getParams(), sizeof(dtTileCacheParams));
        memcpy(&header.meshParams, m_navMesh->getParams(), sizeof(dtNavMeshParams));

        bits = (unsigned char *)realloc(bits, bitsSize + sizeof(RecastHeader));
        memcpy(&bits[bitsSize], &recastHeader, sizeof(RecastHeader));
        bitsSize += sizeof(RecastHeader);

        bits = (unsigned char *)realloc(bits, bitsSize + sizeof(TileCacheSetHeader));
        memcpy(&bits[bitsSize], &header, sizeof(TileCacheSetHeader));
        bitsSize += sizeof(TileCacheSetHeader);

        // Store tiles.
        for (int i = 0; i < m_tileCache->getTileCount(); ++i)
        {
            const dtCompressedTile *tile = m_tileCache->getTile(i);
            if (!tile || !tile->header || !tile->dataSize)
                continue;

            TileCacheTileHeader tileHeader;
            tileHeader.tileRef = m_tileCache->getTileRef(tile);
            tileHeader.dataSize = tile->dataSize;

            bits = (unsigned char *)realloc(bits, bitsSize + sizeof(tileHeader));
            memcpy(&bits[bitsSize], &tileHeader, sizeof(tileHeader));
            bitsSize += sizeof(tileHeader);

            bits = (unsigned char *)realloc(bits, bitsSize + tile->dataSize);
            memcpy(&bits[bitsSize], tile->data, tile->dataSize);
            bitsSize += tile->dataSize;
        }
    }
    else
    {
        // Mesh set
        // Store header.
        RecastHeader recastHeader;
        NavMeshSetHeader header;
        recastHeader.magic = NAVMESHSET_MAGIC;
        recastHeader.version = NAVMESHSET_VERSION;
        recastHeader.numTiles = 0;
        for (int i = 0; i < m_navMesh->getMaxTiles(); ++i)
        {
            const dtMeshTile *tile = m_navMesh->getTile(i);
            if (!tile || !tile->header || !tile->dataSize)
                continue;
            recastHeader.numTiles++;
        }
        memcpy(&header.params, m_navMesh->getParams(), sizeof(dtNavMeshParams));
        bits = (unsigned char *)realloc(bits, bitsSize + sizeof(RecastHeader));
        memcpy(&bits[bitsSize], &recastHeader, sizeof(RecastHeader));
        bitsSize += sizeof(RecastHeader);

        bits = (unsigned char *)realloc(bits, bitsSize + sizeof(NavMeshSetHeader));
        memcpy(&bits[bitsSize], &header, sizeof(NavMeshSetHeader));
        bitsSize += sizeof(NavMeshSetHeader);

        // Store tiles.
        for (int i = 0; i < m_navMesh->getMaxTiles(); ++i)
        {
            const dtMeshTile *tile = m_navMesh->getTile(i);
            if (!tile || !tile->header || !tile->dataSize)
                continue;

            NavMeshTileHeader tileHeader;
            tileHeader.tileRef = m_navMesh->getTileRef(tile);
            tileHeader.dataSize = tile->dataSize;

            bits = (unsigned char *)realloc(bits, bitsSize + sizeof(tileHeader));
            memcpy(&bits[bitsSize], &tileHeader, sizeof(tileHeader));
            bitsSize += sizeof(tileHeader);

            bits = (unsigned char *)realloc(bits, bitsSize + tile->dataSize);
            memcpy(&bits[bitsSize], tile->data, tile->dataSize);
            bitsSize += tile->dataSize;
        }
    }

    NavMeshExport navMeshExport;
    navMeshExport.dataPointer = bits;
    navMeshExport.size = int(bitsSize);

    return navMeshExport;
}

void NavMeshExporter::freeNavMeshExport(NavMeshExport *navMeshExport)
{
    free(navMeshExport->dataPointer);
}

int NavMeshGenerator::rasterizeTileLayers(
    NavMesh *navMesh,
    TileCache *tileCache,
    const int tx,
    const int ty,
    const rcConfig &cfg,
    TileCacheData *tiles,
    const int maxTiles,
    NavMeshIntermediates &intermediates,
    const float *verts,
    int nverts,
    const int maxLayers)
{
    RecastFastLZCompressor comp;

    // Tile bounds.
    const float tcs = cfg.tileSize * cfg.cs;

    rcConfig tcfg;
    memcpy(&tcfg, &cfg, sizeof(tcfg));

    tcfg.bmin[0] = cfg.bmin[0] + tx * tcs;
    tcfg.bmin[1] = cfg.bmin[1];
    tcfg.bmin[2] = cfg.bmin[2] + ty * tcs;
    tcfg.bmax[0] = cfg.bmin[0] + (tx + 1) * tcs;
    tcfg.bmax[1] = cfg.bmax[1];
    tcfg.bmax[2] = cfg.bmin[2] + (ty + 1) * tcs;
    tcfg.bmin[0] -= tcfg.borderSize * tcfg.cs;
    tcfg.bmin[2] -= tcfg.borderSize * tcfg.cs;
    tcfg.bmax[0] += tcfg.borderSize * tcfg.cs;
    tcfg.bmax[2] += tcfg.borderSize * tcfg.cs;

    NavMeshIntermediates tileIntermediates;

    // Allocate voxel heightfield where we rasterize our input data to.
    tileIntermediates.m_solid = rcAllocHeightfield();
    if (!tileIntermediates.m_solid)
    {
        Log("buildNavigation: Out of memory 'solid'.");
        return 0;
    }
    rcContext ctx;

    if (!rcCreateHeightfield(&ctx, *tileIntermediates.m_solid, tcfg.width, tcfg.height, tcfg.bmin, tcfg.bmax, tcfg.cs, tcfg.ch))
    {
        Log("buildNavigation: Could not create solid heightfield.");
        return 0;
    }

    rcChunkyTriMesh *chunkyMesh = intermediates.m_chunkyMesh;

    float tbmin[2], tbmax[2];
    tbmin[0] = tcfg.bmin[0];
    tbmin[1] = tcfg.bmin[2];
    tbmax[0] = tcfg.bmax[0];
    tbmax[1] = tcfg.bmax[2];

    int cid[512]; // TODO: Make grow when returning too many items.
    const int ncid = rcGetChunksOverlappingRect(chunkyMesh, tbmin, tbmax, cid, 512);
    if (!ncid)
    {
        return 0; // empty
    }

    for (int i = 0; i < ncid; ++i)
    {
        const rcChunkyTriMeshNode &node = chunkyMesh->nodes[cid[i]];
        const int *tris = &chunkyMesh->tris[node.i * 3];
        const int ntris = node.n;

        // Allocate array that can hold triangle area types.
        unsigned char *triareas = new unsigned char[ntris];

        // Find triangles which are walkable based on their slope and rasterize them.
        // If your input data is multiple meshes, you can transform them here, calculate
        // the are type for each of the meshes and rasterize them.
        memset(triareas, 0, ntris * sizeof(unsigned char));
        rcMarkWalkableTriangles(&ctx, cfg.walkableSlopeAngle, verts, nverts, tris, ntris, triareas);
        bool success = rcRasterizeTriangles(&ctx, verts, nverts, tris, triareas, ntris, *tileIntermediates.m_solid, tcfg.walkableClimb);

        delete[] triareas;

        if (!success)
        {
            return 0;
        }
    }

    // Once all geometry is rasterized, we do initial pass of filtering to
    // remove unwanted overhangs caused by the conservative rasterization
    // as well as filter spans where the character cannot possibly stand.

    rcFilterLowHangingWalkableObstacles(&ctx, tcfg.walkableClimb, *tileIntermediates.m_solid);
    rcFilterLedgeSpans(&ctx, tcfg.walkableHeight, tcfg.walkableClimb, *tileIntermediates.m_solid);
    rcFilterWalkableLowHeightSpans(&ctx, tcfg.walkableHeight, *tileIntermediates.m_solid);

    tileIntermediates.m_chf = rcAllocCompactHeightfield();
    if (!tileIntermediates.m_chf)
    {
        Log("buildNavigation: Out of memory 'chf'.");
        return 0;
    }
    if (!rcBuildCompactHeightfield(&ctx, tcfg.walkableHeight, tcfg.walkableClimb, *tileIntermediates.m_solid, *tileIntermediates.m_chf))
    {
        Log("buildNavigation: Could not build compact data.");
        return 0;
    }

    // Erode the walkable area by agent radius.
    if (!rcErodeWalkableArea(&ctx, tcfg.walkableRadius, *tileIntermediates.m_chf))
    {
        Log("buildNavigation: Could not erode.");
        return 0;
    }

    tileIntermediates.m_lset = rcAllocHeightfieldLayerSet();
    if (!tileIntermediates.m_lset)
    {
        Log("buildNavigation: Out of memory 'lset'.");
        return 0;
    }
    if (!rcBuildHeightfieldLayers(&ctx, *tileIntermediates.m_chf, tcfg.borderSize, tcfg.walkableHeight, *tileIntermediates.m_lset))
    {
        Log("buildNavigation: Could not build heighfield layers.");
        return 0;
    }

    int ntiles = 0;
    TileCacheData ctiles[maxLayers];
    for (int i = 0; i < rcMin(tileIntermediates.m_lset->nlayers, maxLayers); ++i)
    {
        TileCacheData *tile = &ctiles[ntiles++];
        const rcHeightfieldLayer *layer = &tileIntermediates.m_lset->layers[i];

        // Store header
        dtTileCacheLayerHeader header;
        header.magic = DT_TILECACHE_MAGIC;
        header.version = DT_TILECACHE_VERSION;

        // Tile layer location in the navmesh.
        header.tx = tx;
        header.ty = ty;
        header.tlayer = i;
        dtVcopy(header.bmin, layer->bmin);
        dtVcopy(header.bmax, layer->bmax);

        // Tile info.
        header.width = (unsigned char)layer->width;
        header.height = (unsigned char)layer->height;
        header.minx = (unsigned char)layer->minx;
        header.maxx = (unsigned char)layer->maxx;
        header.miny = (unsigned char)layer->miny;
        header.maxy = (unsigned char)layer->maxy;
        header.hmin = (unsigned short)layer->hmin;
        header.hmax = (unsigned short)layer->hmax;

        dtStatus status = dtBuildTileCacheLayer(&comp, &header, layer->heights, layer->areas, layer->cons,
                                                &tile->data, &tile->dataSize);
        if (dtStatusFailed(status))
        {
            return 0;
        }
    }

    // Transfer ownsership of tile data from build context to the caller.
    int n = 0;
    for (int i = 0; i < rcMin(ntiles, maxTiles); ++i)
    {
        tiles[n++] = ctiles[i];
        ctiles[i].data = 0;
        ctiles[i].dataSize = 0;
    }

    return n;
}

NavMeshGeneratorResult *NavMeshGenerator::computeSoloNavMesh(
    rcConfig &cfg,
    rcContext &ctx,
    NavMeshIntermediates &intermediates,
    bool keepInterResults,
    const float *verts,
    int nverts,
    const int *tris,
    int ntris)
{
    NavMeshGeneratorResult *result = new NavMeshGeneratorResult;
    result->success = false;

    //
    // Step 2. Rasterize input polygon soup.
    //

    // Allocate voxel heightfield where we rasterize our input data to.
    intermediates.m_solid = rcAllocHeightfield();
    if (!intermediates.m_solid)
    {
        Log("buildNavigation: Out of memory 'solid'.");
        return result;
    }
    if (!rcCreateHeightfield(&ctx, *intermediates.m_solid, cfg.width, cfg.height, cfg.bmin, cfg.bmax, cfg.cs, cfg.ch))
    {
        Log("buildNavigation: Could not create solid heightfield.");
        return result;
    }

    // Find triangles which are walkable based on their slope and rasterize them.
    // If your input data is multiple meshes, you can transform them here, calculate
    // the are type for each of the meshes and rasterize them.
    unsigned char *triareas = new unsigned char[ntris];
    memset(triareas, 0, ntris * sizeof(unsigned char));
    rcMarkWalkableTriangles(&ctx, cfg.walkableSlopeAngle, verts, nverts, tris, ntris, triareas);
    rcRasterizeTriangles(&ctx, verts, nverts, tris, triareas, ntris, *intermediates.m_solid, cfg.walkableClimb);
    delete[] triareas;

    //
    // Step 3. Filter walkables surfaces.
    //

    // Once all geoemtry is rasterized, we do initial pass of filtering to
    // remove unwanted overhangs caused by the conservative rasterization
    // as well as filter spans where the character cannot possibly stand.

    rcFilterLowHangingWalkableObstacles(&ctx, cfg.walkableClimb, *intermediates.m_solid);
    rcFilterLedgeSpans(&ctx, cfg.walkableHeight, cfg.walkableClimb, *intermediates.m_solid);
    rcFilterWalkableLowHeightSpans(&ctx, cfg.walkableHeight, *intermediates.m_solid);

    //
    // Step 4. Partition walkable surface to simple regions.
    //

    // Compact the heightfield so that it is faster to handle from now on.
    // This will result more cache coherent data as well as the neighbours
    // between walkable cells will be calculated.

    intermediates.m_chf = rcAllocCompactHeightfield();
    if (!intermediates.m_chf)
    {
        Log("buildNavigation: Out of memory 'chf'.");
        return result;
    }

    if (!rcBuildCompactHeightfield(&ctx, cfg.walkableHeight, cfg.walkableClimb, *intermediates.m_solid, *intermediates.m_chf))
    {
        Log("buildNavigation: Could not build compact data.");
        return result;
    }

    if (!keepInterResults)
    {
        rcFreeHeightField(intermediates.m_solid);
        intermediates.m_solid = nullptr;
    }

    if (!rcErodeWalkableArea(&ctx, cfg.walkableRadius, *intermediates.m_chf))
    {
        Log("buildNavigation: Could not erode.");
        return result;
    }

    // Prepare for region partitioning, by calculating Distance field along the walkable surface.
    if (!rcBuildDistanceField(&ctx, *intermediates.m_chf))
    {
        Log("buildNavigation: Could not build Distance field.");
        return result;
    }

    // Partition the walkable surface into simple regions without holes.
    if (!rcBuildRegions(&ctx, *intermediates.m_chf, cfg.borderSize, cfg.minRegionArea, cfg.mergeRegionArea))
    {
        Log("buildNavigation: Could not build regions.");
        return result;
    }

    //
    // Step 5. Trace and simplify region contours.
    //

    // Create contours.

    intermediates.m_cset = rcAllocContourSet();
    if (!intermediates.m_cset)
    {
        Log("buildNavigation: Out of memory 'cset'.");
        return result;
    }
    if (!rcBuildContours(&ctx, *intermediates.m_chf, cfg.maxSimplificationError, cfg.maxEdgeLen, *intermediates.m_cset))
    {
        Log("buildNavigation: Could not create contours.");
        return result;
    }

    //
    // Step 6. Build polygons mesh from contours.
    //

    m_pmesh = rcAllocPolyMesh();
    if (!m_pmesh)
    {
        Log("buildNavigation: Out of memory 'pmesh'.");
        return result;
    }
    if (!rcBuildPolyMesh(&ctx, *intermediates.m_cset, cfg.maxVertsPerPoly, *m_pmesh))
    {
        Log("buildNavigation: Could not triangulate contours.");
        return result;
    }

    //
    // Step 7. Create detail mesh which allows to access approximate height on each polygon.
    //
    m_dmesh = rcAllocPolyMeshDetail();
    if (!m_dmesh)
    {
        Log("buildNavigation: Out of memory 'pmdtl'.");
        return result;
    }

    if (!rcBuildPolyMeshDetail(&ctx, *m_pmesh, *intermediates.m_chf, cfg.detailSampleDist, cfg.detailSampleMaxError, *m_dmesh))
    {
        Log("buildNavigation: Could not build detail mesh.");
        return result;
    }

    if (!keepInterResults)
    {
        rcFreeCompactHeightfield(intermediates.m_chf);
        intermediates.m_chf = nullptr;
        rcFreeContourSet(intermediates.m_cset);
        intermediates.m_cset = nullptr;
    }

    //
    // (Optional) Step 8. Create Detour data from Recast poly mesh.
    //

    // Only build the detour navmesh if we do not exceed the limit.
    if (cfg.maxVertsPerPoly <= DT_VERTS_PER_POLYGON)
    {
        rcPolyMesh *pmesh = m_pmesh;
        rcPolyMeshDetail *dmesh = m_dmesh;

        int navDataSize = 0;

        // Update poly flags from areas.
        for (int i = 0; i < pmesh->npolys; ++i)
        {
            if (pmesh->areas[i] == RC_WALKABLE_AREA)
            {
                pmesh->areas[i] = 0;
            }
            if (pmesh->areas[i] == 0)
            {
                pmesh->flags[i] = 1;
            }
        }

        dtNavMeshCreateParams params;
        memset(&params, 0, sizeof(params));
        params.verts = pmesh->verts;
        params.vertCount = pmesh->nverts;
        params.polys = pmesh->polys;
        params.polyAreas = pmesh->areas;
        params.polyFlags = pmesh->flags;
        params.polyCount = pmesh->npolys;
        params.nvp = pmesh->nvp;
        params.detailMeshes = dmesh->meshes;
        params.detailVerts = dmesh->verts;
        params.detailVertsCount = dmesh->nverts;
        params.detailTris = dmesh->tris;
        params.detailTriCount = dmesh->ntris;
        // optional connection between areas
        params.offMeshConVerts = 0;  // geom->getOffMeshConnectionVerts();
        params.offMeshConRad = 0;    // geom->getOffMeshConnectionRads();
        params.offMeshConDir = 0;    // geom->getOffMeshConnectionDirs();
        params.offMeshConAreas = 0;  // geom->getOffMeshConnectionAreas();
        params.offMeshConFlags = 0;  // geom->getOffMeshConnectionFlags();
        params.offMeshConUserID = 0; // geom->getOffMeshConnectionId();
        params.offMeshConCount = 0;  // geom->getOffMeshConnectionCount();
        params.walkableHeight = cfg.walkableHeight;
        params.walkableRadius = cfg.walkableRadius;
        params.walkableClimb = cfg.walkableClimb;
        rcVcopy(params.bmin, pmesh->bmin);
        rcVcopy(params.bmax, pmesh->bmax);
        params.cs = cfg.cs;
        params.ch = cfg.ch;
        params.buildBvTree = true;

        if (!dtCreateNavMeshData(&params, &m_navData, &navDataSize))
        {
            Log("Could not build Detour navmesh.");
            return result;
        }

        NavMesh *navMesh = new NavMesh;

        if (!navMesh->initSolo(m_navData, navDataSize, DT_TILE_FREE_DATA))
        {
            Log("Could not init solo Detour navmesh");
            return result;
        }

        result->navMesh = navMesh;
    }

    result->success = true;
    return result;
}

NavMeshGeneratorResult *NavMeshGenerator::computeTiledNavMesh(
    rcConfig &cfg,
    NavMeshIntermediates &intermediates,
    const float *verts,
    int nverts,
    const int *tris,
    int ntris,
    const int expectedLayersPerTile,
    const int maxLayers)
{
    NavMeshGeneratorResult *result = new NavMeshGeneratorResult;
    result->success = false;

    TileCache *tileCache = new TileCache;
    NavMesh *navMesh = new NavMesh;

    const int ts = (int)cfg.tileSize;
    const int tw = (cfg.width + ts - 1) / ts;
    const int th = (cfg.height + ts - 1) / ts;

    // Generation params.
    cfg.borderSize = cfg.walkableRadius + 3; // Reserve enough padding.
    cfg.width = cfg.tileSize + cfg.borderSize * 2;
    cfg.height = cfg.tileSize + cfg.borderSize * 2;

    // Tile cache params.
    dtTileCacheParams tcparams;
    memset(&tcparams, 0, sizeof(tcparams));
    rcVcopy(tcparams.orig, cfg.bmin);
    tcparams.cs = cfg.cs;
    tcparams.ch = cfg.ch;
    tcparams.width = cfg.tileSize;
    tcparams.height = cfg.tileSize;
    tcparams.walkableHeight = cfg.walkableHeight;
    tcparams.walkableRadius = cfg.walkableRadius;
    tcparams.walkableClimb = cfg.walkableClimb;
    tcparams.maxSimplificationError = cfg.maxSimplificationError;
    tcparams.maxTiles = tw * th * expectedLayersPerTile;
    tcparams.maxObstacles = 128;

    if (!tileCache->init(tcparams))
    {
        Log("buildTiledNavMesh: Could not init tile cache.");
        return result;
    }

    dtNavMeshParams params;
    memset(&params, 0, sizeof(params));
    rcVcopy(params.orig, cfg.bmin);
    params.tileWidth = cfg.tileSize * cfg.cs;
    params.tileHeight = cfg.tileSize * cfg.cs;
    // Max tiles and max polys affect how the tile IDs are caculated.
    // There are 22 bits available for identifying a tile and a polygon.
    int tileBits = rcMin((int)dtIlog2(dtNextPow2(tw * th * expectedLayersPerTile)), 14);
    if (tileBits > 14)
        tileBits = 14;
    int polyBits = 22 - tileBits;
    params.maxTiles = 1 << tileBits;
    params.maxPolys = 1 << polyBits;

    if (!navMesh->initTiled(&params))
    {
        Log("buildTiledNavMesh: Could not init tiled navmesh.");
        return result;
    }

    intermediates.m_chunkyMesh = new rcChunkyTriMesh;
    if (!rcCreateChunkyTriMesh(verts, tris, ntris, 256, intermediates.m_chunkyMesh))
    {
        Log("buildTiledNavMesh: Unable to create chunky trimesh.");
        return result;
    }

    // Preprocess tiles.
    for (int y = 0; y < th; ++y)
    {
        for (int x = 0; x < tw; ++x)
        {
            TileCacheData tiles[maxLayers];
            memset(tiles, 0, sizeof(tiles));
            int ntiles = rasterizeTileLayers(navMesh, tileCache, x, y, cfg, tiles, maxLayers, intermediates, verts, nverts, maxLayers);
            for (int i = 0; i < ntiles; ++i)
            {
                TileCacheData *tile = &tiles[i];
                TileCacheAddTileResult result = tileCache->addTile(tile->data, tile->dataSize, DT_COMPRESSEDTILE_FREE_DATA);

                if (dtStatusFailed(result.status))
                {
                    Log("buildTiledNavMesh: Failed adding tile to tile cache.");
                    dtFree(tile->data);
                    tile->data = 0;
                    continue;
                }
            }
        }
    }

    // Build initial meshes
    for (int y = 0; y < th; ++y)
    {
        for (int x = 0; x < tw; ++x)
        {
            tileCache->buildNavMeshTilesAt(x, y, navMesh);
        }
    }

    result->success = true;
    result->tileCache = tileCache;
    result->navMesh = navMesh;

    return result;
}

NavMeshGeneratorResult NavMeshGenerator::generate(
    const float *positions,
    const int positionCount,
    const int *indices,
    const int indexCount,
    const rcConfig &config,
    const int expectedLayersPerTile,
    const int maxLayers)
{
    if (m_pmesh)
    {
        rcFreePolyMesh(m_pmesh);
    }
    if (m_dmesh)
    {
        rcFreePolyMeshDetail(m_dmesh);
    }
    if (m_navData)
    {
        dtFree(m_navData);
    }

    NavMeshIntermediates intermediates;
    std::vector<Vec3> triangleIndices;
    const float *pv = &positions[0];
    const int *t = &indices[0];

    // mesh conversion
    Vec3 bbMin(FLT_MAX);
    Vec3 bbMax(-FLT_MAX);
    triangleIndices.resize(indexCount);
    for (unsigned int i = 0; i < indexCount; i++)
    {
        int ind = (*t++) * 3;
        Vec3 v(pv[ind], pv[ind + 1], pv[ind + 2]);
        bbMin.isMinOf(v);
        bbMax.isMaxOf(v);
        triangleIndices[i] = v;
    }

    float *verts = new float[triangleIndices.size() * 3];
    int nverts = triangleIndices.size();
    for (unsigned int i = 0; i < triangleIndices.size(); i++)
    {
        verts[i * 3 + 0] = triangleIndices[i].x;
        verts[i * 3 + 1] = triangleIndices[i].y;
        verts[i * 3 + 2] = triangleIndices[i].z;
    }
    int ntris = triangleIndices.size() / 3;
    int *tris = new int[triangleIndices.size()];
    for (unsigned int i = 0; i < triangleIndices.size(); i++)
    {
        tris[i] = triangleIndices.size() - i - 1;
    }

    bool keepInterResults = false;

    rcConfig cfg = config;
    cfg.walkableHeight = config.walkableHeight;
    cfg.walkableClimb = config.walkableClimb;
    cfg.walkableRadius = config.walkableRadius;
    cfg.maxEdgeLen = config.maxEdgeLen;
    cfg.maxSimplificationError = config.maxSimplificationError;
    cfg.minRegionArea = (int)rcSqr(config.minRegionArea);     // Note: area = size*size
    cfg.mergeRegionArea = (int)rcSqr(config.mergeRegionArea); // Note: area = size*size
    cfg.maxVertsPerPoly = (int)config.maxVertsPerPoly;
    cfg.detailSampleDist = config.detailSampleDist < 0.9f ? 0 : config.cs * config.detailSampleDist;
    cfg.detailSampleMaxError = config.ch * config.detailSampleMaxError;

    // Set the area where the navigation will be build.
    // Here the bounds of the input mesh are used, but the
    // area could be specified by an user defined box, etc.
    // float bmin[3] = {-20.f, 0.f, -20.f};
    // float bmax[3] = { 20.f, 1.f,  20.f};
    rcVcopy(cfg.bmin, &bbMin.x);
    rcVcopy(cfg.bmax, &bbMax.x);
    rcCalcGridSize(cfg.bmin, cfg.bmax, cfg.cs, &cfg.width, &cfg.height);

    rcContext ctx;

    if (config.tileSize)
    {
        NavMeshGeneratorResult *result = computeTiledNavMesh(cfg, intermediates, verts, nverts, tris, ntris, expectedLayersPerTile, maxLayers);
        if (!result->success)
        {
            Log("Unable to compute tiled navmesh");
        }

        return *result;
    }
    else
    {
        NavMeshGeneratorResult *result = computeSoloNavMesh(cfg, ctx, intermediates, keepInterResults, verts, nverts, tris, ntris);
        if (!result->success)
        {
            Log("Unable to compute solo navmesh");
        }

        return *result;
    }
}

NavMeshImporterResult NavMeshImporter::importNavMesh(NavMeshExport *navMeshExport)
{
    NavMeshImporterResult *result = new NavMeshImporterResult;
    result->success = false;

    unsigned char *bits = (unsigned char *)navMeshExport->dataPointer;

    // Read header.
    RecastHeader recastHeader;
    size_t readLen = sizeof(RecastHeader);
    memcpy(&recastHeader, bits, readLen);
    bits += readLen;

    if (recastHeader.magic == NAVMESHSET_MAGIC)
    {
        NavMeshSetHeader header;
        size_t readLen = sizeof(NavMeshSetHeader);
        memcpy(&header, bits, readLen);
        bits += readLen;

        if (recastHeader.version != NAVMESHSET_VERSION)
        {
            return *result;
        }

        NavMesh *navMesh = new NavMesh;
        if (!navMesh->initTiled(&header.params))
        {
            return *result;
        }

        // Read tiles.
        for (int i = 0; i < recastHeader.numTiles; ++i)
        {
            NavMeshTileHeader tileHeader;
            readLen = sizeof(tileHeader);
            memcpy(&tileHeader, bits, readLen);
            bits += readLen;

            if (!tileHeader.tileRef || !tileHeader.dataSize)
            {
                break;
            }

            unsigned char *data = (unsigned char *)dtAlloc(tileHeader.dataSize, DT_ALLOC_PERM);
            if (!data)
            {
                break;
            }

            readLen = tileHeader.dataSize;
            memcpy(data, bits, readLen);
            bits += readLen;

            navMesh->addTile(data, tileHeader.dataSize, DT_TILE_FREE_DATA, tileHeader.tileRef);
        }

        result->navMesh = navMesh;
    }
    else if (recastHeader.magic == TILECACHESET_MAGIC)
    {
        if (recastHeader.version != TILECACHESET_VERSION)
        {
            return *result;
        }

        TileCacheSetHeader header;
        size_t readLen = sizeof(TileCacheSetHeader);
        memcpy(&header, bits, readLen);
        bits += readLen;

        NavMesh *navMesh = new NavMesh;
        if (!navMesh->initTiled(&header.meshParams))
        {
            return *result;
        }

        TileCache *tileCache = new TileCache;
        if (!tileCache->init(header.cacheParams))
        {
            return *result;
        }

        // Read tiles.
        for (int i = 0; i < recastHeader.numTiles; ++i)
        {
            TileCacheTileHeader tileHeader;
            size_t readLen = sizeof(tileHeader);
            memcpy(&tileHeader, bits, readLen);
            bits += readLen;

            if (!tileHeader.tileRef || !tileHeader.dataSize)
            {
                break;
            }

            unsigned char *data = (unsigned char *)dtAlloc(tileHeader.dataSize, DT_ALLOC_PERM);
            if (!data)
            {
                break;
            }

            memset(data, 0, tileHeader.dataSize);

            readLen = tileHeader.dataSize;
            memcpy(data, bits, readLen);
            bits += readLen;

            TileCacheAddTileResult result = tileCache->addTile(data, tileHeader.dataSize, DT_COMPRESSEDTILE_FREE_DATA);
            if (dtStatusFailed(result.status))
            {
                dtFree(data);
            }

            if (result.tileRef)
            {
                tileCache->buildNavMeshTile(&result.tileRef, navMesh);
            }
        }

        result->navMesh = navMesh;
        result->tileCache = tileCache;
    }

    result->success = true;
    return *result;
}

void NavMeshGenerator::destroy()
{
    if (m_pmesh)
    {
        rcFreePolyMesh(m_pmesh);
    }
    if (m_dmesh)
    {
        rcFreePolyMeshDetail(m_dmesh);
    }
    if (m_navData)
    {
        dtFree(m_navData);
    }
};

bool NavMesh::initSolo(unsigned char *data, const int dataSize, const int flags)
{
    m_navMesh = dtAllocNavMesh();
    if (!m_navMesh)
    {
        Log("Could not allocate solo Detour navmesh");
        return false;
    }

    dtStatus status = m_navMesh->init(data, dataSize, flags);

    return dtStatusSucceed(status);
};

bool NavMesh::initTiled(const dtNavMeshParams *params)
{
    m_navMesh = dtAllocNavMesh();
    if (!m_navMesh)
    {
        Log("Could not allocate tiled Detour navmesh");
        return false;
    }

    dtStatus status = m_navMesh->init(params);

    return dtStatusSucceed(status);
};

NavMeshAddTileResult NavMesh::addTile(unsigned char *data, int dataSize, int flags, dtTileRef lastRef)
{
    dtTileRef ref;
    dtStatus status = m_navMesh->addTile(data, dataSize, flags, lastRef, &ref);

    NavMeshAddTileResult result;
    result.status = status;
    result.tileRef = ref;

    return result;
}

NavMeshRemoveTileResult NavMesh::removeTile(dtTileRef ref)
{
    NavMeshRemoveTileResult *result = new NavMeshRemoveTileResult;

    result->status = m_navMesh->removeTile(ref, &result->data, &result->dataSize);

    return *result;
}

void NavMesh::navMeshPoly(DebugNavMesh &debugNavMesh, const dtNavMesh &mesh, dtPolyRef ref)
{
    const dtMeshTile *tile = 0;
    const dtPoly *poly = 0;
    if (dtStatusFailed(mesh.getTileAndPolyByRef(ref, &tile, &poly)))
        return;

    const unsigned int ip = (unsigned int)(poly - tile->polys);

    if (poly->getType() == DT_POLYTYPE_OFFMESH_CONNECTION)
    {
        /*
        If we want to display links (teleport) between navmesh or inside a navmesh
        this code will be usefull for debug output.

        dtOffMeshConnection* con = &tile->offMeshCons[ip - tile->header->offMeshBase];

        dd->begin(DU_DRAW_LINES, 2.0f);

        // Connection arc.
        duAppendArc(dd, con->pos[0],con->pos[1],con->pos[2], con->pos[3],con->pos[4],con->pos[5], 0.25f,
                    (con->flags & 1) ? 0.6f : 0.0f, 0.6f, c);

        dd->end();
        */
    }
    else
    {
        const dtPolyDetail *pd = &tile->detailMeshes[ip];

        for (int i = 0; i < pd->triCount; ++i)
        {
            const unsigned char *t = &tile->detailTris[(pd->triBase + i) * 4];
            Triangle triangle;
            float *pf;

            for (int j = 0; j < 3; ++j)
            {
                if (t[j] < poly->vertCount)
                {
                    pf = &tile->verts[poly->verts[t[j]] * 3];
                }
                else
                {
                    pf = &tile->detailVerts[(pd->vertBase + t[j] - poly->vertCount) * 3];
                }

                triangle.mPoint[j] = Vec3(pf[0], pf[1], pf[2]);
            }
            debugNavMesh.mTriangles.push_back(triangle);
        }
    }
}

void NavMesh::navMeshPolysWithFlags(DebugNavMesh &debugNavMesh, const dtNavMesh &mesh, const unsigned short polyFlags)
{
    for (int i = 0; i < mesh.getMaxTiles(); ++i)
    {
        const dtMeshTile *tile = mesh.getTile(i);
        if (!tile->header)
        {
            continue;
        }
        dtPolyRef base = mesh.getPolyRefBase(tile);

        for (int j = 0; j < tile->header->polyCount; ++j)
        {
            const dtPoly *p = &tile->polys[j];
            if ((p->flags & polyFlags) == 0)
            {
                continue;
            }
            navMeshPoly(debugNavMesh, mesh, base | (dtPolyRef)j);
        }
    }
}

DebugNavMesh NavMesh::getDebugNavMesh()
{
    DebugNavMesh debugNavMesh;
    navMeshPolysWithFlags(debugNavMesh, *m_navMesh, 0xFFFF);
    return debugNavMesh;
}

NavMeshCalcTileLocResult NavMesh::calcTileLoc(const float *pos) const
{
    NavMeshCalcTileLocResult *result = new NavMeshCalcTileLocResult;

    m_navMesh->calcTileLoc(pos, &result->tileX, &result->tileY);

    return *result;
}

const dtMeshTile *NavMesh::getTileAt(const int x, const int y, const int tlayer) const
{
    return m_navMesh->getTileAt(x, y, tlayer);
}

NavMeshGetTilesAtResult NavMesh::getTilesAt(const int x, const int y, const int maxTiles) const
{
    NavMeshGetTilesAtResult *result = new NavMeshGetTilesAtResult;

    const dtMeshTile *tiles[maxTiles];

    result->tileCount = m_navMesh->getTilesAt(x, y, tiles, maxTiles);
    result->tiles = *tiles;

    return *result;
}

dtTileRef NavMesh::getTileRefAt(int x, int y, int layer) const
{
    return m_navMesh->getTileRefAt(x, y, layer);
}

dtTileRef NavMesh::getTileRef(const dtMeshTile *tile) const
{
    return m_navMesh->getTileRef(tile);
}

const dtMeshTile *NavMesh::getTileByRef(dtTileRef ref) const
{
    return m_navMesh->getTileByRef(ref);
}

int NavMesh::getMaxTiles() const
{
    return m_navMesh->getMaxTiles();
}

NavMeshGetTileAndPolyByRefResult NavMesh::getTileAndPolyByRef(dtPolyRef ref) const
{
    NavMeshGetTileAndPolyByRefResult *result = new NavMeshGetTileAndPolyByRefResult;

    const dtMeshTile *tile;
    const dtPoly *poly;

    m_navMesh->getTileAndPolyByRef(ref, &tile, &poly);

    result->tile = tile;
    result->poly = poly;

    return *result;
}

NavMeshGetTileAndPolyByRefResult NavMesh::getTileAndPolyByRefUnsafe(dtPolyRef ref) const
{
    NavMeshGetTileAndPolyByRefResult *result = new NavMeshGetTileAndPolyByRefResult;

    const dtMeshTile *tile;
    const dtPoly *poly;

    m_navMesh->getTileAndPolyByRefUnsafe(ref, &tile, &poly);

    result->tile = tile;
    result->poly = poly;

    return *result;
}

bool NavMesh::isValidPolyRef(dtPolyRef ref) const
{
    return m_navMesh->isValidPolyRef(ref);
}

dtPolyRef NavMesh::getPolyRefBase(const dtMeshTile *tile) const
{
    return m_navMesh->getPolyRefBase(tile);
}

NavMeshGetOffMeshConnectionPolyEndPointsResult NavMesh::getOffMeshConnectionPolyEndPoints(dtPolyRef prevRef, dtPolyRef polyRef) const
{
    NavMeshGetOffMeshConnectionPolyEndPointsResult *result = new NavMeshGetOffMeshConnectionPolyEndPointsResult;

    result->status = m_navMesh->getOffMeshConnectionPolyEndPoints(prevRef, polyRef, &result->startPos[0], &result->endPos[0]);

    return *result;
}

const dtOffMeshConnection *NavMesh::getOffMeshConnectionByRef(dtPolyRef ref) const
{
    return m_navMesh->getOffMeshConnectionByRef(ref);
}

dtStatus NavMesh::setPolyFlags(dtPolyRef ref, unsigned short flags)
{
    return m_navMesh->setPolyFlags(ref, flags);
}

NavMeshGetPolyFlagsResult NavMesh::getPolyFlags(dtPolyRef ref) const
{
    NavMeshGetPolyFlagsResult *result = new NavMeshGetPolyFlagsResult;

    result->status = m_navMesh->getPolyFlags(ref, &result->flags);

    return *result;
}

dtStatus NavMesh::setPolyArea(dtPolyRef ref, unsigned char area)
{
    return m_navMesh->setPolyArea(ref, area);
}

NavMeshGetPolyAreaResult NavMesh::getPolyArea(dtPolyRef ref) const
{
    NavMeshGetPolyAreaResult *result = new NavMeshGetPolyAreaResult;

    result->status = m_navMesh->getPolyArea(ref, &result->area);

    return *result;
}

int NavMesh::getTileStateSize(const dtMeshTile *tile) const
{
    return m_navMesh->getTileStateSize(tile);
}

NavMeshStoreTileStateResult NavMesh::storeTileState(const dtMeshTile *tile, const int maxDataSize) const
{
    NavMeshStoreTileStateResult *result = new NavMeshStoreTileStateResult;

    result->status = m_navMesh->storeTileState(tile, result->data, maxDataSize);
    result->dataSize = maxDataSize;

    return *result;
}

dtStatus NavMesh::restoreTileState(dtMeshTile *tile, const unsigned char *data, const int maxDataSize)
{
    return m_navMesh->restoreTileState(tile, data, maxDataSize);
}

void NavMesh::destroy()
{
    dtFreeNavMesh(m_navMesh);
}

const dtMeshTile *NavMesh::getTile(int i) const
{
    const dtNavMesh *navmesh = m_navMesh;
    return navmesh->getTile(i);
}

Crowd::Crowd(const int maxAgents, const float maxAgentRadius, NavMesh *navMesh) : m_defaultQueryExtent(1.f)
{
    m_crowd = dtAllocCrowd();
    m_crowd->init(maxAgents, maxAgentRadius, navMesh->getNavMesh());
}

void Crowd::destroy()
{
    if (m_crowd)
    {
        dtFreeCrowd(m_crowd);
        m_crowd = NULL;
    }
}

int Crowd::addAgent(const Vec3 &pos, const dtCrowdAgentParams *params)
{
    return m_crowd->addAgent(&pos.x, params);
}

void Crowd::removeAgent(const int idx)
{
    m_crowd->removeAgent(idx);
}

void Crowd::update(const float dt)
{
    m_crowd->update(dt, NULL);
}

int Crowd::getAgentCount()
{
    return m_crowd->getAgentCount();
}

int Crowd::getActiveAgentCount()
{
    return m_crowd->getActiveAgents(NULL, m_crowd->getAgentCount());
}

Vec3 Crowd::getAgentPosition(int idx)
{
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
    return Vec3(agent->npos[0], agent->npos[1], agent->npos[2]);
}

Vec3 Crowd::getAgentVelocity(int idx)
{
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
    return Vec3(agent->vel[0], agent->vel[1], agent->vel[2]);
}

Vec3 Crowd::getAgentNextTargetPath(int idx)
{
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
    return Vec3(agent->cornerVerts[0], agent->cornerVerts[1], agent->cornerVerts[2]);
}

int Crowd::getAgentState(int idx)
{
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
    return agent->state;
}

bool Crowd::overOffMeshConnection(int idx)
{
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
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

void Crowd::agentGoto(int idx, const Vec3 &destination)
{
    dtQueryFilter filter;
    filter.setIncludeFlags(0xffff);
    filter.setExcludeFlags(0);

    dtPolyRef polyRef;

    Vec3 pos(destination.x, destination.y, destination.z);
    m_crowd->getNavMeshQuery()->findNearestPoly(&pos.x, &m_defaultQueryExtent.x, &filter, &polyRef, 0);

    bool success = m_crowd->requestMoveTarget(idx, polyRef, &pos.x);
}

void Crowd::agentResetMoveTarget(int idx)
{
    m_crowd->resetMoveTarget(idx);
}

void Crowd::agentTeleport(int idx, const Vec3 &destination)
{
    if (idx < 0 || idx > m_crowd->getAgentCount())
    {
        return;
    }

    dtQueryFilter filter;
    filter.setIncludeFlags(0xffff);
    filter.setExcludeFlags(0);

    dtPolyRef polyRef = 0;

    Vec3 pos(destination.x, destination.y, destination.z);
    m_crowd->getNavMeshQuery()->findNearestPoly(&pos.x, &m_defaultQueryExtent.x, &filter, &polyRef, 0);

    dtCrowdAgent *ag = m_crowd->getEditableAgent(idx);

    float nearest[3];
    dtVcopy(nearest, &pos.x);

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

dtCrowdAgentParams Crowd::getAgentParameters(const int idx)
{
    dtCrowdAgentParams params;
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
    params = agent->params;
    return params;
}

void Crowd::setAgentParameters(const int idx, const dtCrowdAgentParams *params)
{
    m_crowd->updateAgentParameters(idx, params);
}

NavPath Crowd::getCorners(const int idx)
{
    NavPath navpath;
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);

    const float *pos = agent->cornerVerts;
    navpath.mPoints.resize(agent->ncorners);
    for (int i = 0; i < agent->ncorners; i++)
    {
        navpath.mPoints[i] = Vec3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    }
    return navpath;
}
