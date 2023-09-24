#include "./Detour.h"

void DetourNavMeshBuilder::setPolyMeshCreateParams(dtNavMeshCreateParams *navMeshCreateParams, rcPolyMesh *polyMesh)
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

void DetourNavMeshBuilder::setPolyMeshDetailCreateParams(dtNavMeshCreateParams *navMeshCreateParams, rcPolyMeshDetail *polyMeshDetail)
{
    navMeshCreateParams->detailMeshes = polyMeshDetail->meshes;
    navMeshCreateParams->detailVerts = polyMeshDetail->verts;
    navMeshCreateParams->detailVertsCount = polyMeshDetail->nverts;
    navMeshCreateParams->detailTris = polyMeshDetail->tris;
    navMeshCreateParams->detailTriCount = polyMeshDetail->ntris;
}

void DetourNavMeshBuilder::setOffMeshConnections(dtNavMeshCreateParams *navMeshCreateParams, int offMeshConCount, float *offMeshConVerts, float *offMeshConRad, unsigned char *offMeshConDirs, unsigned char *offMeshConAreas, unsigned short *offMeshConFlags, unsigned int *offMeshConUserId)
{
    int n = offMeshConCount;

    float *verts = new float[n * 3 * 2];
    memcpy(verts, offMeshConVerts, sizeof(float) * offMeshConCount * 3 * 2);

    float *rads = new float[n];
    memcpy(rads, offMeshConRad, sizeof(float) * n);

    unsigned char *dirs = new unsigned char[n];
    memcpy(dirs, offMeshConDirs, sizeof(unsigned char) * n);

    unsigned char *areas = new unsigned char[n];
    memcpy(areas, offMeshConAreas, sizeof(unsigned char) * n);

    unsigned short *flags = new unsigned short[n];
    memcpy(flags, offMeshConFlags, sizeof(unsigned short) * n);

    unsigned int *userIds = new unsigned int[n];
    memcpy(userIds, offMeshConUserId, sizeof(unsigned int) * n);

    navMeshCreateParams->offMeshConCount = offMeshConCount;
    navMeshCreateParams->offMeshConVerts = verts;
    navMeshCreateParams->offMeshConRad = rads;
    navMeshCreateParams->offMeshConDir = dirs;
    navMeshCreateParams->offMeshConAreas = areas;
    navMeshCreateParams->offMeshConFlags = flags;
    navMeshCreateParams->offMeshConUserID = userIds;
}

CreateNavMeshDataResult *DetourNavMeshBuilder::createNavMeshData(dtNavMeshCreateParams &params)
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

int DetourTileCacheBuilder::buildTileCacheLayer(
    dtTileCacheCompressor *comp,
    dtTileCacheLayerHeader *header,
    const UnsignedCharArray *heights,
    const UnsignedCharArray *areas,
    const UnsignedCharArray *cons,
    UnsignedCharArray *tileCacheData)
{
    return dtBuildTileCacheLayer(comp, header, heights->data, areas->data, cons->data, &tileCacheData->data, &tileCacheData->size);
}
