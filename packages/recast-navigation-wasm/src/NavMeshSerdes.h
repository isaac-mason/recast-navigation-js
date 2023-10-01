#pragma once

#include "../recastnavigation/Recast/Include/Recast.h"
#include "../recastnavigation/Detour/Include/DetourStatus.h"
#include "../recastnavigation/Detour/Include/DetourNavMesh.h"
#include "../recastnavigation/Detour/Include/DetourCommon.h"
#include "../recastnavigation/Detour/Include/DetourNavMeshBuilder.h"
#include "../recastnavigation/DetourTileCache/Include/DetourTileCache.h"
#include "./Refs.h"
#include "./NavMesh.h"
#include "./TileCache.h"

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

    NavMeshImporterResult importNavMesh(NavMeshExport *navMeshExport, TileCacheMeshProcessJsImpl &meshProcess);
};
