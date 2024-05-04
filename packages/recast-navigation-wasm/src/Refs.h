#pragma once

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


// template <typename T>
// class PrimitiveRefTemplate
// {
// public:
//     T value;
//     PrimitiveRefTemplate() {}
//     virtual ~PrimitiveRefTemplate() {}
// };

// class BoolRef : public PrimitiveRefTemplate<bool>
// {
//     BoolRef() : PrimitiveRefTemplate() {}
// };

// class IntRef : public PrimitiveRefTemplate<int>
// {
//     IntRef() : PrimitiveRefTemplate() {}
// };

// class UnsignedIntRef : public PrimitiveRefTemplate<unsigned int>
// {
//     UnsignedIntRef() : PrimitiveRefTemplate() {}
// };

// class UnsignedCharRef : public PrimitiveRefTemplate<unsigned char>
// {
//     UnsignedCharRef() : PrimitiveRefTemplate() {}
// };

// class UnsignedShortRef : public PrimitiveRefTemplate<unsigned short>
// {
//     UnsignedShortRef() : PrimitiveRefTemplate() {}
// };

// class FloatRef : public PrimitiveRefTemplate<float>
// {
//     FloatRef() : PrimitiveRefTemplate() {}
// };
