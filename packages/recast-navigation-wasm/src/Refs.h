#pragma once

#include <cstdint>

class BoolRef
{
public:
    bool value;

    BoolRef() {}
    ~BoolRef() {}
};

class IntRef
{
public:
    int value;

    IntRef() {}
    ~IntRef() {}
};

class UnsignedIntRef
{
public:
    unsigned int value;

    UnsignedIntRef() {}
    ~UnsignedIntRef() {}
};

class UnsignedLongLongRef
{
public:
    std::uint64_t value;

    UnsignedLongLongRef() : value(0) {}
    ~UnsignedLongLongRef() {}
};

#ifdef DT_POLYREF64
using PolyRefRef = UnsignedLongLongRef;
#else
using PolyRefRef = UnsignedIntRef;
#endif

class UnsignedCharRef
{
public:
    unsigned char value;

    UnsignedCharRef() {}
    ~UnsignedCharRef() {}
};

class UnsignedShortRef
{
public:
    unsigned short value;

    UnsignedShortRef() {}
    ~UnsignedShortRef() {}
};

struct FloatRef
{
    float value;

    FloatRef() {}
    ~FloatRef() {}
};
