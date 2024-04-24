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
    virtual void vertex(const float* pos, unsigned int color);
    virtual void vertex(const float x, const float y, const float z, unsigned int color);
    virtual void vertex(const float* pos, unsigned int color, const float* uv);
    virtual void vertex(const float x, const float y, const float z, unsigned int color, const float u, const float v);
    virtual void end();

    virtual void handleDepthMask(bool state) = 0;
    virtual void handleTexture(bool state) = 0;
    virtual void handleBegin(duDebugDrawPrimitives prim, float size = 1.0f) = 0;
    virtual void handleVertexWithColor(const float x, const float y, const float z, unsigned int color) = 0;
    virtual void handleVertexWithColorAndUV(const float x, const float y, const float z, unsigned int color, const float u, const float v) = 0;
    virtual void handleEnd() = 0;
};
