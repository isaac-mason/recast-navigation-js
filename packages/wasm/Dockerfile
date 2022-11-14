FROM emscripten/emsdk:3.1.25

WORKDIR /workspace

ENV PYTHONUNBUFFERED 1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
          libgeos-dev ed \
          automake autoconf libtool \
    && rm -rf /var/lib/apt/lists/*

COPY . .
