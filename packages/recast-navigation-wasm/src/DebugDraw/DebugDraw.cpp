#include "DebugDraw.h"

void DebugDraw::depthMask(bool state)
{
    handleDepthMask(state);
}

void DebugDraw::texture(bool state)
{
    handleTexture(state);
}

void DebugDraw::begin(duDebugDrawPrimitives prim, float size)
{
    handleBegin(prim, size);
}

void DebugDraw::vertex(const float *pos, unsigned int color)
{
    handleVertexWithColor(pos[0], pos[1], pos[2], color);
}

void DebugDraw::vertex(const float x, const float y, const float z, unsigned int color)
{
    handleVertexWithColor(x, y, z, color);
}

void DebugDraw::vertex(const float *pos, unsigned int color, const float *uv)
{
    handleVertexWithColorAndUV(pos[0], pos[1], pos[2], color, uv[0], uv[1]);
}

void DebugDraw::vertex(const float x, const float y, const float z, unsigned int color, const float u, const float v)
{
    handleVertexWithColorAndUV(x, y, z, color, u, v);
}

void DebugDraw::end()
{
    handleEnd();
}

unsigned int DebugDraw::RGBA(int r, int g, int b, int a)
{
    return duRGBA(r, g, b, a);
}

unsigned int DebugDraw::RGBAf(float fr, float fg, float fb, float fa)
{
    return duRGBAf(fr, fg, fb, fa);
}

unsigned int DebugDraw::IntToCol(int i, int a)
{
    return duIntToCol(i, a);
}

void DebugDraw::IntToColVector(int i, float *col)
{
    return duIntToCol(i, col);
}

unsigned int DebugDraw::MultCol(const unsigned int col, const unsigned int d)
{
    return duMultCol(col, d);
}

unsigned int DebugDraw::DarkenCol(unsigned int col)
{
    return duDarkenCol(col);
}

unsigned int DebugDraw::LerpCol(unsigned int ca, unsigned int cb, unsigned int u)
{
    return duLerpCol(ca, cb, u);
}

unsigned int DebugDraw::TransCol(unsigned int c, unsigned int a)
{
    return duTransCol(c, a);
}

void DebugDraw::CalcBoxColors(unsigned int *colors, unsigned int colTop, unsigned int colSide)
{
    duCalcBoxColors(colors, colTop, colSide);
}

void DebugDraw::DebugDrawCylinderWire(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col, const float lineWidth)
{
    duDebugDrawCylinderWire(dd, minx, miny, minz, maxx, maxy, maxz, col, lineWidth);
}

void DebugDraw::DebugDrawBoxWire(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col, const float lineWidth)
{
    duDebugDrawBoxWire(dd, minx, miny, minz, maxx, maxy, maxz, col, lineWidth);
}

void DebugDraw::DebugDrawArc(struct duDebugDraw *dd, const float x0, const float y0, const float z0, const float x1, const float y1, const float z1, const float h, const float as0, const float as1, unsigned int col, const float lineWidth)
{
    duDebugDrawArc(dd, x0, y0, z0, x1, y1, z1, h, as0, as1, col, lineWidth);
}

void DebugDraw::DebugDrawArrow(struct duDebugDraw *dd, const float x0, const float y0, const float z0, const float x1, const float y1, const float z1, const float as0, const float as1, unsigned int col, const float lineWidth)
{
    duDebugDrawArrow(dd, x0, y0, z0, x1, y1, z1, as0, as1, col, lineWidth);
}

void DebugDraw::DebugDrawCircle(struct duDebugDraw *dd, const float x, const float y, const float z, const float r, unsigned int col, const float lineWidth)
{
    duDebugDrawCircle(dd, x, y, z, r, col, lineWidth);
}

void DebugDraw::DebugDrawCross(struct duDebugDraw *dd, const float x, const float y, const float z, const float size, unsigned int col, const float lineWidth)
{
    duDebugDrawCross(dd, x, y, z, size, col, lineWidth);
}

void DebugDraw::DebugDrawBox(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, const unsigned int *fcol)
{
    duDebugDrawBox(dd, minx, miny, minz, maxx, maxy, maxz, fcol);
}

void DebugDraw::DebugDrawCylinder(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col)
{
    duDebugDrawCylinder(dd, minx, miny, minz, maxx, maxy, maxz, col);
}

void DebugDraw::DebugDrawGridXZ(struct duDebugDraw *dd, const float ox, const float oy, const float oz, const int w, const int h, const float size, const unsigned int col, const float lineWidth)
{
    duDebugDrawGridXZ(dd, ox, oy, oz, w, h, size, col, lineWidth);
}

void DebugDraw::AppendCylinderWire(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col)
{
    duAppendCylinderWire(dd, minx, miny, minz, maxx, maxy, maxz, col);
}

void DebugDraw::AppendBoxWire(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col)
{
    duAppendBoxWire(dd, minx, miny, minz, maxx, maxy, maxz, col);
}

void DebugDraw::AppendBoxPoints(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col)
{
    duAppendBoxPoints(dd, minx, miny, minz, maxx, maxy, maxz, col);
}

void DebugDraw::AppendArc(struct duDebugDraw *dd, const float x0, const float y0, const float z0, const float x1, const float y1, const float z1, const float h, const float as0, const float as1, unsigned int col)
{
    duAppendArc(dd, x0, y0, z0, x1, y1, z1, h, as0, as1, col);
}

void DebugDraw::AppendArrow(struct duDebugDraw *dd, const float x0, const float y0, const float z0, const float x1, const float y1, const float z1, const float as0, const float as1, unsigned int col)
{
    duAppendArrow(dd, x0, y0, z0, x1, y1, z1, as0, as1, col);
}

void DebugDraw::AppendCircle(struct duDebugDraw *dd, const float x, const float y, const float z, const float r, unsigned int col)
{
    duAppendCircle(dd, x, y, z, r, col);
}

void DebugDraw::AppendCross(struct duDebugDraw *dd, const float x, const float y, const float z, const float size, unsigned int col)
{
    duAppendCross(dd, x, y, z, size, col);
}

void DebugDraw::AppendBox(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, const unsigned int *fcol)
{
    duAppendBox(dd, minx, miny, minz, maxx, maxy, maxz, fcol);
}

void DebugDraw::AppendCylinder(struct duDebugDraw *dd, float minx, float miny, float minz, float maxx, float maxy, float maxz, unsigned int col)
{
    duAppendCylinder(dd, minx, miny, minz, maxx, maxy, maxz, col);
}
