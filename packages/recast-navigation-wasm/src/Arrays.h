#pragma once

#include <string.h>
#include <algorithm>

template <typename T>
class ArrayWrapperTemplate
{
public:
    T *data;
    int size;
    bool isView;

    ArrayWrapperTemplate()
    {
        data = nullptr;
        size = 0;
        isView = false;
    }

    ~ArrayWrapperTemplate()
    {
        free();
    }

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

class IntArray : public ArrayWrapperTemplate<int>
{
};

class UnsignedIntArray : public ArrayWrapperTemplate<unsigned int>
{
};

class UnsignedCharArray : public ArrayWrapperTemplate<unsigned char>
{
};

class UnsignedShortArray : public ArrayWrapperTemplate<unsigned short>
{
};

class FloatArray : public ArrayWrapperTemplate<float>
{
};
