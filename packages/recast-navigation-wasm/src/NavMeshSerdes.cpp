#include "./NavMeshSerdes.h"

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

NavMeshImporterResult NavMeshImporter::importNavMesh(NavMeshExport *navMeshExport, TileCacheMeshProcessJsImpl &meshProcess)
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
