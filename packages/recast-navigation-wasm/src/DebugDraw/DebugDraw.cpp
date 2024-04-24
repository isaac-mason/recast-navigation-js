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
