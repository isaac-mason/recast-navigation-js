#pragma once

#include <string.h>
#include <algorithm>

template <typename T>
struct ArrayWrapperTemplate
{
    T *data;
    int size;
    bool isView;

    void free()
    {
        if (!isView)
        {
            delete[] data;
        }

        size = 0;
        this->data = nullptr;
    }

    void copy(const T *data, int size)
    {
        free();
        this->data = new T[size];
        memcpy(this->data, data, size * sizeof(T));
        this->size = size;
        this->isView = false;
    }

    void view(T *data)
    {
        this->data = data;
        this->size = 0;
        this->isView = true;
    }

    void resize(int size)
    {
        free();
        data = new T[size];
        memset(data, 0, size * sizeof(T));
        this->size = size;
        this->isView = false;
    }

    T get(int index)
    {
        return data[index];
    }

    void set(int index, T value)
    {
        data[index] = value;
    }

    T* getDataPointer() const
    {
        return data;
    }
};

struct IntArray : public ArrayWrapperTemplate<int>
{
};

struct UnsignedIntArray : public ArrayWrapperTemplate<unsigned int>
{
};

struct UnsignedCharArray : public ArrayWrapperTemplate<unsigned char>
{
};

struct UnsignedShortArray : public ArrayWrapperTemplate<unsigned short>
{
};

struct FloatArray : public ArrayWrapperTemplate<float>
{
};
