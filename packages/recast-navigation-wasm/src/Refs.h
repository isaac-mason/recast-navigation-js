#pragma once

template <typename T>
struct PrimitiveRefTemplate
{
    T value;
};

struct BoolRef : public PrimitiveRefTemplate<bool>
{
};

struct IntRef : public PrimitiveRefTemplate<int>
{
};

struct UnsignedIntRef : public PrimitiveRefTemplate<unsigned int>
{
};

struct UnsignedCharRef : public PrimitiveRefTemplate<unsigned char>
{
};

struct UnsignedShortRef : public PrimitiveRefTemplate<unsigned short>
{
};

struct FloatRef : public PrimitiveRefTemplate<float>
{
};
