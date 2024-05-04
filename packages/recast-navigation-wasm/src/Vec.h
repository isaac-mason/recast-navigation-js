#pragma once

#include <vector>

class Vec3
{
public:
    float x, y, z;

    Vec3() {}
    Vec3(float v) : x(v), y(v), z(v) {}
    Vec3(float x, float y, float z) : x(x), y(y), z(z) {}
};
