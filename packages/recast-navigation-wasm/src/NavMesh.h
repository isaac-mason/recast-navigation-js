#pragma once

#include "../recastnavigation/Recast/Include/Recast.h"
#include "../recastnavigation/Detour/Include/DetourStatus.h"
#include "../recastnavigation/Detour/Include/DetourNavMesh.h"
#include "../recastnavigation/Detour/Include/DetourCommon.h"
#include "./Refs.h"
#include "./Arrays.h"
#include "./Vec.h"

struct NavMeshRemoveTileResult
{
    unsigned int status;
    unsigned char *data;
    int dataSize;
};

struct NavMeshCalcTileLocResult
{
    int tileX;
    int tileY;
};

struct NavMeshGetTilesAtResult
{
    const dtMeshTile *tiles;
    int tileCount;
};

struct NavMeshGetTileAndPolyByRefResult
{
    dtStatus status;
    const dtMeshTile *tile;
    const dtPoly *poly;
};

struct NavMeshStoreTileStateResult
{
    dtStatus status;
    unsigned char *data;
    int dataSize;
};

class NavMesh
{
public:
    dtNavMesh *m_navMesh;

    NavMesh()
    {
        m_navMesh = dtAllocNavMesh();
    }

    NavMesh(dtNavMesh *navMesh)
    {
        m_navMesh = navMesh;
    }

    bool initSolo(UnsignedCharArray *navMeshData);

    bool initTiled(const dtNavMeshParams *params);

    dtStatus addTile(UnsignedCharArray *navMeshData, int flags, dtTileRef lastRef, UnsignedIntRef *tileRef);

    NavMeshRemoveTileResult removeTile(dtTileRef ref);

    dtNavMesh *getNavMesh()
    {
        return m_navMesh;
    }

    NavMeshCalcTileLocResult calcTileLoc(const float *pos) const;

    const dtMeshTile *getTileAt(const int tx, const int ty, const int tlayer) const;

    NavMeshGetTilesAtResult getTilesAt(const int x, const int y, const int maxTiles) const;

    dtTileRef getTileRefAt(int x, int y, int layer) const;

    dtTileRef getTileRef(const dtMeshTile *tile) const;

    const dtMeshTile *getTileByRef(dtTileRef ref) const;

    int getMaxTiles() const;

    const dtMeshTile *getTile(int i) const;

    NavMeshGetTileAndPolyByRefResult getTileAndPolyByRef(const dtPolyRef ref) const;

    NavMeshGetTileAndPolyByRefResult getTileAndPolyByRefUnsafe(const dtPolyRef ref) const;

    bool isValidPolyRef(dtPolyRef ref) const;

    dtPolyRef getPolyRefBase(const dtMeshTile *tile) const;

    dtStatus getOffMeshConnectionPolyEndPoints(dtPolyRef prevRef, dtPolyRef polyRef, Vec3 *startPos, Vec3 *endPos) const;

    const dtOffMeshConnection *getOffMeshConnectionByRef(dtPolyRef ref) const;

    dtStatus setPolyFlags(dtPolyRef ref, unsigned short flags);

    dtStatus getPolyFlags(dtPolyRef ref, UnsignedShortRef *flags) const;

    dtStatus setPolyArea(dtPolyRef ref, unsigned char area);

    dtStatus getPolyArea(dtPolyRef ref, UnsignedCharRef *area) const;

    int getTileStateSize(const dtMeshTile *tile) const;

    NavMeshStoreTileStateResult storeTileState(const dtMeshTile *tile, const int maxDataSize) const;

    dtStatus restoreTileState(dtMeshTile *tile, const unsigned char *data, const int maxDataSize);

    void destroy();
};
