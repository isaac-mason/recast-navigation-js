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

TileCacheAddTileResult TileCache::addTile(TileCacheData *tileCacheData, unsigned char flags)
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

bool NavMesh::initSolo(NavMeshData *navMeshData)
{
    m_navMesh = dtAllocNavMesh();
    if (!m_navMesh)
    {
        Log("Could not allocate solo Detour navmesh");
        return false;
    }

    dtStatus status = m_navMesh->init(navMeshData->data, navMeshData->size, DT_TILE_FREE_DATA);

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

NavMeshAddTileResult NavMesh::addTile(NavMeshData *navMeshData, int flags, dtTileRef lastRef)
{
    dtTileRef ref;
    dtStatus status = m_navMesh->addTile(navMeshData->data, navMeshData->size, flags, lastRef, &ref);

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

void Crowd::getAgentPosition(int idx, Vec3 *target)
{
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
    target->x = agent->npos[0];
    target->y = agent->npos[1];
    target->z = agent->npos[2];
}

void Crowd::getAgentVelocity(int idx, Vec3 *target)
{
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
    target->x = agent->vel[0];
    target->y = agent->vel[1];
    target->z = agent->vel[2];
}

void Crowd::getAgentNextTargetPath(int idx, Vec3 *target)
{
    const dtCrowdAgent *agent = m_crowd->getAgent(idx);
    target->x = agent->targetPos[0];
    target->y = agent->targetPos[1];
    target->z = agent->targetPos[2];
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

            NavMeshData *navMeshData = new NavMeshData;
            navMeshData->data = data;
            navMeshData->size = tileHeader.dataSize;

            navMesh->addTile(navMeshData, DT_TILE_FREE_DATA, tileHeader.tileRef);
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

            TileCacheData *tileCacheData = new TileCacheData;
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