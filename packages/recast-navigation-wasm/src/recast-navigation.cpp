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

bool TileCache::init(const dtTileCacheParams *params, RecastLinearAllocator *allocator, RecastFastLZCompressor *compressor, TileCacheMeshProcessAbstract &meshProcess)
{
    if (!m_tileCache)
    {
        return false;
    }

    TileCacheMeshProcessWrapper *recastMeshProcess = new TileCacheMeshProcessWrapper(meshProcess);

    dtStatus status = m_tileCache->init(params, allocator, compressor, recastMeshProcess);
    if (dtStatusFailed(status))
    {
        return false;
    }

    m_talloc = allocator;
    m_tcomp = compressor;
    m_tmproc = recastMeshProcess;

    return true;
};

TileCacheAddTileResult TileCache::addTile(UnsignedCharArray *tileCacheData, unsigned char flags)
{
    TileCacheAddTileResult *result = new TileCacheAddTileResult;

    result->status = m_tileCache->addTile(tileCacheData->data, tileCacheData->size, flags, &result->tileRef);

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

    result->status = m_tileCache->update(0, navMesh->getNavMesh(), &result->upToDate);

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

    m_talloc->reset();
    m_talloc = 0;
    m_tcomp = 0;
    m_tmproc = 0;
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

bool NavMesh::initSolo(UnsignedCharArray *navMeshData)
{
    dtStatus status = m_navMesh->init(navMeshData->data, navMeshData->size, DT_TILE_FREE_DATA);

    return dtStatusSucceed(status);
};

bool NavMesh::initTiled(const dtNavMeshParams *params)
{
    dtStatus status = m_navMesh->init(params);

    return dtStatusSucceed(status);
};

dtStatus NavMesh::addTile(UnsignedCharArray *navMeshData, int flags, dtTileRef lastRef, UnsignedIntRef *tileRef)
{
    return m_navMesh->addTile(navMeshData->data, navMeshData->size, flags, lastRef, &tileRef->value);
}

NavMeshRemoveTileResult NavMesh::removeTile(dtTileRef ref)
{
    NavMeshRemoveTileResult *result = new NavMeshRemoveTileResult;

    result->status = m_navMesh->removeTile(ref, &result->data, &result->dataSize);

    return *result;
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

dtStatus NavMesh::getOffMeshConnectionPolyEndPoints(dtPolyRef prevRef, dtPolyRef polyRef, Vec3 *startPos, Vec3 *endPos) const
{
    return m_navMesh->getOffMeshConnectionPolyEndPoints(prevRef, polyRef, &startPos->x, &endPos->x);
}

const dtOffMeshConnection *NavMesh::getOffMeshConnectionByRef(dtPolyRef ref) const
{
    return m_navMesh->getOffMeshConnectionByRef(ref);
}

dtStatus NavMesh::setPolyFlags(dtPolyRef ref, unsigned short flags)
{
    return m_navMesh->setPolyFlags(ref, flags);
}

dtStatus NavMesh::getPolyFlags(dtPolyRef ref, UnsignedShortRef *flags) const
{
    return m_navMesh->getPolyFlags(ref, &flags->value);
}

dtStatus NavMesh::setPolyArea(dtPolyRef ref, unsigned char area)
{
    return m_navMesh->setPolyArea(ref, area);
}

dtStatus NavMesh::getPolyArea(dtPolyRef ref, UnsignedCharRef *area) const
{
    return m_navMesh->getPolyArea(ref, &area->value);
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

NavMeshImporterResult NavMeshImporter::importNavMesh(NavMeshExport *navMeshExport, TileCacheMeshProcessAbstract &meshProcess)
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

            UnsignedCharArray *navMeshData = new UnsignedCharArray;
            navMeshData->data = data;
            navMeshData->size = tileHeader.dataSize;

            navMesh->addTile(navMeshData, DT_TILE_FREE_DATA, tileHeader.tileRef, nullptr);
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

        RecastLinearAllocator *allocator = new RecastLinearAllocator(32000);
        RecastFastLZCompressor *compressor = new RecastFastLZCompressor;

        TileCache *tileCache = new TileCache;
        if (!tileCache->init(&header.cacheParams, allocator, compressor, meshProcess))
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

            UnsignedCharArray *tileCacheData = new UnsignedCharArray;
            tileCacheData->data = data;
            tileCacheData->size = tileHeader.dataSize;

            TileCacheAddTileResult result = tileCache->addTile(tileCacheData, DT_COMPRESSEDTILE_FREE_DATA);
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
        result->allocator = allocator;
        result->compressor = compressor;
    }

    result->success = true;
    return *result;
}

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