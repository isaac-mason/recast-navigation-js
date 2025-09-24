#pragma once

#include "../recastnavigation/Recast/Include/Recast.h"
#include "./Arrays.h"

struct RecastCalcBoundsResult
{
    float bmin[3];
    float bmax[3];
};

struct RecastCalcGridSizeResult
{
    int width;
    int height;
};

class RecastBuildContextImpl
{
public:
    virtual void resetLog() {}

    virtual void log(const rcLogCategory /*category*/, const char * /*msg*/, const int /*len*/) {}

    virtual void resetTimers() {}

    virtual void startTimer(const rcTimerLabel /*label*/) {}

    virtual void stopTimer(const rcTimerLabel /*label*/) {}

    virtual int getAccumulatedTime(const rcTimerLabel /*label*/) const { return -1; }
};

class RecastBuildContext : public rcContext
{
public:
    RecastBuildContextImpl *impl;

    RecastBuildContext(RecastBuildContextImpl *recastBuildContextImpl)
    {
        impl = recastBuildContextImpl;
    }

    virtual void doResetLog()
    {
        impl->resetLog();
    }

    virtual void doLog(const rcLogCategory category, const char *msg, const int len)
    {
        impl->log(category, msg, len);
    }

    virtual void doResetTimers()
    {
        impl->resetTimers();
    }

    virtual void doStartTimer(const rcTimerLabel label)
    {
        impl->startTimer(label);
    }

    virtual void doStopTimer(const rcTimerLabel label)
    {
        impl->stopTimer(label);
    }

    virtual int doGetAccumulatedTime(const rcTimerLabel label)
    {
        return impl->getAccumulatedTime(label);
    }

    bool logEnabled()
    {
        return m_logEnabled;
    }

    bool timerEnabled()
    {
        return m_timerEnabled;
    }
};

class Recast
{
public:
    unsigned short BORDER_REG = RC_BORDER_REG;
    unsigned short MULTIPLE_REGS = RC_MULTIPLE_REGS;
    int BORDER_VERTEX = RC_BORDER_VERTEX;
    int AREA_BORDER = RC_AREA_BORDER;
    int CONTOUR_REG_MASK = RC_CONTOUR_REG_MASK;
    unsigned short MESH_NULL_IDX = RC_MESH_NULL_IDX;
    unsigned char NULL_AREA = RC_NULL_AREA;
    unsigned char WALKABLE_AREA = RC_WALKABLE_AREA;
    int NOT_CONNECTED = RC_NOT_CONNECTED;

    RecastCalcBoundsResult *calcBounds(const FloatArray *verts, int nv)
    {
        RecastCalcBoundsResult *result = new RecastCalcBoundsResult;

        rcCalcBounds(verts->data, nv, result->bmin, result->bmax);

        return result;
    }

    RecastCalcGridSizeResult *calcGridSize(const float *bmin, const float *bmax, float cs)
    {
        RecastCalcGridSizeResult *result = new RecastCalcGridSizeResult;

        rcCalcGridSize(bmin, bmax, cs, &result->width, &result->height);

        return result;
    }

    bool createHeightfield(rcContext *ctx, rcHeightfield &hf, int width, int height, const float *bmin, const float *bmax, float cs, float ch)
    {
        return rcCreateHeightfield(ctx, hf, width, height, bmin, bmax, cs, ch);
    }

    void markWalkableTriangles(rcContext *ctx, const float walkableSlopeAngle, const FloatArray *verts, int nv, const IntArray *tris, int nt, UnsignedCharArray *areas)
    {
        rcMarkWalkableTriangles(ctx, walkableSlopeAngle, verts->data, nv, tris->data, nt, areas->data);
    }

    void clearUnwalkableTriangles(rcContext *ctx, const float walkableSlopeAngle, const FloatArray *verts, int nv, const IntArray *tris, int nt, UnsignedCharArray *areas)
    {
        rcClearUnwalkableTriangles(ctx, walkableSlopeAngle, verts->data, nv, tris->data, nt, areas->data);
    }

    bool rasterizeTriangles(rcContext *ctx, const FloatArray *verts, const int nv, const IntArray *tris, UnsignedCharArray *areas, const int nt, rcHeightfield &solid, const int flagMergeThr)
    {
        return rcRasterizeTriangles(ctx, verts->data, nv, tris->data, areas->data, nt, solid, flagMergeThr);
    }

    void filterLowHangingWalkableObstacles(rcContext *ctx, const int walkableClimb, rcHeightfield &solid)
    {
        rcFilterLowHangingWalkableObstacles(ctx, walkableClimb, solid);
    }

    void filterLedgeSpans(rcContext *ctx, const int walkableHeight, const int walkableClimb, rcHeightfield &solid)
    {
        rcFilterLedgeSpans(ctx, walkableHeight, walkableClimb, solid);
    }

    void filterWalkableLowHeightSpans(rcContext *ctx, const int walkableHeight, rcHeightfield &solid)
    {
        rcFilterWalkableLowHeightSpans(ctx, walkableHeight, solid);
    }

    int getHeightFieldSpanCount(rcContext *ctx, rcHeightfield &solid)
    {
        return rcGetHeightFieldSpanCount(ctx, solid);
    }

    bool buildCompactHeightfield(rcContext *ctx, const int walkableHeight, const int walkableClimb, rcHeightfield &hf, rcCompactHeightfield &chf)
    {
        return rcBuildCompactHeightfield(ctx, walkableHeight, walkableClimb, hf, chf);
    }

    bool erodeWalkableArea(rcContext *ctx, int radius, rcCompactHeightfield &chf)
    {
        return rcErodeWalkableArea(ctx, radius, chf);
    }

    bool medianFilterWalkableArea(rcContext *ctx, rcCompactHeightfield &chf)
    {
        return rcMedianFilterWalkableArea(ctx, chf);
    }

    void markBoxArea(rcContext *ctx, const float *bmin, const float *bmax, unsigned char areaId, rcCompactHeightfield &chf)
    {
        rcMarkBoxArea(ctx, bmin, bmax, areaId, chf);
    }

    void markConvexPolyArea(rcContext *ctx, const FloatArray *verts, int nverts, const float hmin, const float hmax, unsigned char areaId, rcCompactHeightfield &chf)
    {
        rcMarkConvexPolyArea(ctx, verts->data, nverts, hmin, hmax, areaId, chf);
    }

    void markCylinderArea(rcContext *ctx, const float *pos, const float r, const float h, unsigned char areaId, rcCompactHeightfield &chf)
    {
        rcMarkCylinderArea(ctx, pos, r, h, areaId, chf);
    }

    bool buildDistanceField(rcContext *ctx, rcCompactHeightfield &chf)
    {
        return rcBuildDistanceField(ctx, chf);
    }

    bool buildRegions(rcContext *ctx, rcCompactHeightfield &chf, const int borderSize, const int minRegionArea, const int mergeRegionArea)
    {
        return rcBuildRegions(ctx, chf, borderSize, minRegionArea, mergeRegionArea);
    }

    bool buildLayerRegions(rcContext *ctx, rcCompactHeightfield &chf, const int borderSize, const int minRegionArea)
    {
        return rcBuildLayerRegions(ctx, chf, borderSize, minRegionArea);
    }

    bool buildRegionsMonotone(rcContext *ctx, rcCompactHeightfield &chf, const int borderSize, const int minRegionArea, const int mergeRegionArea)
    {
        return rcBuildRegionsMonotone(ctx, chf, borderSize, minRegionArea, mergeRegionArea);
    }

    void setCon(rcCompactSpan &s, int dir, int i)
    {
        rcSetCon(s, dir, i);
    }

    int getCon(const rcCompactSpan &s, int dir)
    {
        return rcGetCon(s, dir);
    }

    int getDirOffsetX(int dir)
    {
        return rcGetDirOffsetX(dir);
    }

    int getDirOffsetY(int dir)
    {
        return rcGetDirOffsetY(dir);
    }

    int getDirForOffset(int x, int y)
    {
        return rcGetDirForOffset(x, y);
    }

    bool buildHeightfieldLayers(rcContext *ctx, rcCompactHeightfield &chf, const int borderSize, const int walkableHeight, rcHeightfieldLayerSet &lset)
    {
        return rcBuildHeightfieldLayers(ctx, chf, borderSize, walkableHeight, lset);
    }

    bool buildContours(rcContext *ctx, rcCompactHeightfield &chf, const float maxError, const int maxEdgeLen, rcContourSet &cset, const int buildFlags)
    {
        return rcBuildContours(ctx, chf, maxError, maxEdgeLen, cset, buildFlags);
    }

    bool buildPolyMesh(rcContext *ctx, rcContourSet &cset, const int nvp, rcPolyMesh &mesh)
    {
        return rcBuildPolyMesh(ctx, cset, nvp, mesh);
    }

    bool mergePolyMeshes(rcContext *ctx, rcPolyMesh **meshes, const int nmeshes, rcPolyMesh &mesh)
    {
        return rcMergePolyMeshes(ctx, meshes, nmeshes, mesh);
    }

    bool buildPolyMeshDetail(rcContext *ctx, const rcPolyMesh &mesh, const rcCompactHeightfield &chf, const float sampleDist, const float sampleMaxError, rcPolyMeshDetail &dmesh)
    {
        return rcBuildPolyMeshDetail(ctx, mesh, chf, sampleDist, sampleMaxError, dmesh);
    }

    bool copyPolyMesh(rcContext *ctx, const rcPolyMesh &src, rcPolyMesh &dst)
    {
        return rcCopyPolyMesh(ctx, src, dst);
    }

    bool mergePolyMeshDetails(rcContext *ctx, rcPolyMeshDetail **meshes, const int nmeshes, rcPolyMeshDetail &mesh)
    {
        return rcMergePolyMeshDetails(ctx, meshes, nmeshes, mesh);
    }

    UnsignedCharArray *getHeightfieldLayerHeights(rcHeightfieldLayer *heightfieldLayer)
    {
        UnsignedCharArray *array = new UnsignedCharArray();
        array->view(heightfieldLayer->heights);
        return array;
    }

    UnsignedCharArray *getHeightfieldLayerAreas(rcHeightfieldLayer *heightfieldLayer)
    {
        UnsignedCharArray *array = new UnsignedCharArray();
        array->view(heightfieldLayer->areas);
        return array;
    }

    UnsignedCharArray *getHeightfieldLayerCons(rcHeightfieldLayer *heightfieldLayer)
    {
        UnsignedCharArray *array = new UnsignedCharArray();
        array->view(heightfieldLayer->cons);
        return array;
    }

    rcHeightfield *allocHeightfield()
    {
        return rcAllocHeightfield();
    }

    void freeHeightfield(rcHeightfield *hf)
    {
        rcFreeHeightField(hf);
    }

    rcCompactHeightfield *allocCompactHeightfield()
    {
        return rcAllocCompactHeightfield();
    }

    void freeCompactHeightfield(rcCompactHeightfield *chf)
    {
        rcFreeCompactHeightfield(chf);
    }

    rcHeightfieldLayerSet *allocHeightfieldLayerSet()
    {
        return rcAllocHeightfieldLayerSet();
    }

    void freeHeightfieldLayerSet(rcHeightfieldLayerSet *lset)
    {
        rcFreeHeightfieldLayerSet(lset);
    }

    rcContourSet *allocContourSet()
    {
        return rcAllocContourSet();
    }

    void freeContourSet(rcContourSet *cset)
    {
        rcFreeContourSet(cset);
    }

    rcPolyMesh *allocPolyMesh()
    {
        return rcAllocPolyMesh();
    }

    void freePolyMesh(rcPolyMesh *pmesh)
    {
        rcFreePolyMesh(pmesh);
    }

    rcPolyMeshDetail *allocPolyMeshDetail()
    {
        return rcAllocPolyMeshDetail();
    }

    void freePolyMeshDetail(rcPolyMeshDetail *dmesh)
    {
        rcFreePolyMeshDetail(dmesh);
    }
};
