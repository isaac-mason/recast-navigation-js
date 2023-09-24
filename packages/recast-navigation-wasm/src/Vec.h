#pragma once

#include <vector>

struct Vec3
{
    float x, y, z;

    Vec3() {}
    Vec3(float v) : x(v), y(v), z(v) {}
    Vec3(float x, float y, float z) : x(x), y(y), z(z) {}

    void isMinOf(const Vec3 &v)
    {
        x = std::min(x, v.x);
        y = std::min(y, v.y);
        z = std::min(z, v.z);
    }

    void isMaxOf(const Vec3 &v)
    {
        x = std::max(x, v.x);
        y = std::max(y, v.y);
        z = std::max(z, v.z);
    }

    float operator[](int index)
    {
        return ((float *)&x)[index];
    }
};

struct Vec2
{
    float x, y;

    Vec2() {}
    Vec2(float v) : x(v), y(v) {}
    Vec2(float x, float y) : x(x), y(y) {}
};
