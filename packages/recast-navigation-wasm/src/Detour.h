#pragma once

#include "../recastnavigation/Recast/Include/Recast.h"
#include "../recastnavigation/Detour/Include/DetourStatus.h"
#include "../recastnavigation/Detour/Include/DetourNavMeshBuilder.h"
#include "../recastnavigation/DetourCrowd/Include/DetourCrowd.h"
#include "../recastnavigation/DetourTileCache/Include/DetourTileCacheBuilder.h"
#include "./Arrays.h"

class Detour
{
public:
    unsigned int FAILURE = DT_FAILURE;
    unsigned int SUCCESS = DT_SUCCESS;
    unsigned int IN_PROGRESS = DT_IN_PROGRESS;
    unsigned int STATUS_DETAIL_MASK = DT_STATUS_DETAIL_MASK;
    unsigned int WRONG_MAGIC = DT_WRONG_MAGIC;
    unsigned int WRONG_VERSION = DT_WRONG_VERSION;
    unsigned int OUT_OF_MEMORY = DT_OUT_OF_MEMORY;
    unsigned int INVALID_PARAM = DT_INVALID_PARAM;
    unsigned int BUFFER_TOO_SMALL = DT_BUFFER_TOO_SMALL;
    unsigned int OUT_OF_NODES = DT_OUT_OF_NODES;
    unsigned int PARTIAL_RESULT = DT_PARTIAL_RESULT;
    unsigned int ALREADY_OCCUPIED = DT_ALREADY_OCCUPIED;

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

    unsigned int NULL_LINK = DT_NULL_LINK;
    unsigned short EXT_LINK = DT_EXT_LINK;
    unsigned int OFFMESH_CON_BIDIR = DT_OFFMESH_CON_BIDIR;

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
    void setPolyMeshCreateParams(dtNavMeshCreateParams *navMeshCreateParams, rcPolyMesh *polyMesh);

    void setPolyMeshDetailCreateParams(dtNavMeshCreateParams *navMeshCreateParams, rcPolyMeshDetail *polyMeshDetail);

    void setOffMeshConnections(dtNavMeshCreateParams *navMeshCreateParams, int offMeshConCount, float *offMeshConVerts, float *offMeshConRad, unsigned char *offMeshConDirs, unsigned char *offMeshConAreas, unsigned short *offMeshConFlags, unsigned int *offMeshConUserId);

    CreateNavMeshDataResult *createNavMeshData(dtNavMeshCreateParams &params);
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
        UnsignedCharArray *tileCacheData);
};
