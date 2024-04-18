#include "./NavMesh.h"

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

void NavMesh::decodePolyId(dtPolyRef ref, unsigned int & salt, unsigned int & it, unsigned int & ip) {
    return m_navMesh->decodePolyId(ref, salt, it, ip);
}

dtPolyRef NavMesh::encodePolyId(unsigned int salt, unsigned int it, unsigned ip) {
    return m_navMesh->encodePolyId(salt, it, ip);
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
