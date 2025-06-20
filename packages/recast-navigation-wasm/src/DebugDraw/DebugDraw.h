#pragma once

#include "../../recastnavigation/DebugUtils/Include/DebugDraw.h"
#include "../../recastnavigation/DebugUtils/Include/RecastDebugDraw.h"
#include "../../recastnavigation/DebugUtils/Include/DetourDebugDraw.h"

class DebugDraw : public duDebugDraw
{
public:
    virtual void depthMask(bool state);
    virtual void texture(bool state);
    virtual void begin(duDebugDrawPrimitives prim, float size = 1.0f);
    virtual void vertex(const float *pos, unsigned int color);
    virtual void vertex(const float x, const float y, const float z, unsigned int color);
    virtual void vertex(const float *pos, unsigned int color, const float *uv);
    virtual void vertex(const float x, const float y, const float z, unsigned int color, const float u, const float v);
    virtual void end();
    virtual unsigned int areaToCol(unsigned int area);

    virtual void handleDepthMask(bool state) = 0;
    virtual void handleTexture(bool state) = 0;
    virtual void handleBegin(duDebugDrawPrimitives prim, float size = 1.0f) = 0;
    virtual void handleVertexWithColor(const float x, const float y, const float z, unsigned int color) = 0;
    virtual void handleVertexWithColorAndUV(const float x, const float y, const float z, unsigned int color, const float u, const float v) = 0;
    virtual void handleEnd() = 0;
    virtual unsigned int handleAreaToCol(unsigned int area) = 0;

    unsigned int RGBA(int r, int g, int b, int a);
    unsigned int RGBAf(float fr, float fg, float fb, float fa);
    unsigned int IntToCol(int i, int a);
    void IntToColVector(int i, float *col);
    unsigned int MultCol(const unsigned int col, const unsigned int d);
    unsigned int DarkenCol(unsigned int col);
    unsigned int LerpCol(unsigned int ca, unsigned int cb, unsigned int u);
    unsigned int TransCol(unsigned int c, unsigned int a);

    void CalcBoxColors(unsigned int *colors, unsigned int colTop, unsigned int colSide);
    void DebugDrawCylinderWire(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col, const float lineWidth);
    void DebugDrawBoxWire(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col, const float lineWidth);
    void DebugDrawArc(struct duDebugDraw *dd, const float x0, const float y0, const float z0, const float x1, const float y1, const float z1, const float h, const float as0, const float as1, unsigned int col, const float lineWidth);
    void DebugDrawArrow(struct duDebugDraw *dd, const float x0, const float y0, const float z0, const float x1, const float y1, const float z1, const float as0, const float as1, unsigned int col, const float lineWidth);
    void DebugDrawCircle(struct duDebugDraw *dd, const float x, const float y, const float z, const float r, unsigned int col, const float lineWidth);
    void DebugDrawCross(struct duDebugDraw *dd, const float x, const float y, const float z, const float size, unsigned int col, const float lineWidth);
    void DebugDrawBox(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, const unsigned int *fcol);
    void DebugDrawCylinder(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col);
    void DebugDrawGridXZ(struct duDebugDraw *dd, const float ox, const float oy, const float oz, const int w, const int h, const float size, const unsigned int col, const float lineWidth);
    void AppendCylinderWire(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col);
    void AppendBoxWire(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col);
    void AppendBoxPoints(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col);
    void AppendArc(struct duDebugDraw *dd, const float x0, const float y0, const float z0, const float x1, const float y1, const float z1, const float h, const float as0, const float as1, unsigned int col);
    void AppendArrow(struct duDebugDraw *dd, const float x0, const float y0, const float z0, const float x1, const float y1, const float z1, const float as0, const float as1, unsigned int col);
    void AppendCircle(struct duDebugDraw *dd, const float x, const float y, const float z, const float r, unsigned int col);
    void AppendCross(struct duDebugDraw *dd, const float x, const float y, const float z, const float size, unsigned int col);
    void AppendBox(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, const unsigned int *fcol);
    void AppendCylinder(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col);
};
