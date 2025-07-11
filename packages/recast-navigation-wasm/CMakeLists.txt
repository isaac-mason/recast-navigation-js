cmake_minimum_required(VERSION 3.13 FATAL_ERROR)
set(CMAKE_POLICY_DEFAULT_CMP0077 NEW)

FIND_PACKAGE(Python3)
set(PYTHON ${Python3_EXECUTABLE} CACHE STRING "Python path")
set(EMSCRIPTEN_ROOT $ENV{EMSDK}/upstream/emscripten CACHE STRING "Emscripten path")
set(CMAKE_TOOLCHAIN_FILE ${EMSCRIPTEN_ROOT}/cmake/Modules/Platform/Emscripten.cmake)
set(WEBIDL_BINDER_SCRIPT ${EMSCRIPTEN_ROOT}/tools/webidl_binder.py)

set(RECAST_FRONT_MATTER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/front-matter.js)
set(RECAST_IDL_FILE ${CMAKE_CURRENT_SOURCE_DIR}/recast-navigation.idl)
set(ENTRY_HEADER_FILE ${CMAKE_CURRENT_SOURCE_DIR}/src/recast-navigation.h)
set(RECAST_SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src/)

project("recast-navigation-wasm")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

file(GLOB_RECURSE SRC_FILES
    ${CMAKE_SOURCE_DIR}/src/*.h
    ${CMAKE_SOURCE_DIR}/src/*.cpp
)

file(GLOB_RECURSE RECASTDETOUR_FILES
  ${CMAKE_SOURCE_DIR}/recastnavigation/Detour/*
  ${CMAKE_SOURCE_DIR}/recastnavigation/DetourCrowd/*
  ${CMAKE_SOURCE_DIR}/recastnavigation/DetourTileCache/*
  ${CMAKE_SOURCE_DIR}/recastnavigation/Recast/*
  ${CMAKE_SOURCE_DIR}/recastnavigation/DebugUtils/*
  ${CMAKE_SOURCE_DIR}/recastnavigation/RecastDemo/Source/ChunkyTriMesh.cpp
  ${CMAKE_SOURCE_DIR}/recastnavigation/RecastDemo/Contrib/fastlz/fastlz.c
)

include_directories(
  ${CMAKE_CURRENT_SOURCE_DIR}/src
  ${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/Detour/Include
  ${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/DetourCrowd/Include
  ${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/DetourTileCache/Include
  ${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/DetourTileCacheBuilder/Include
  ${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/Recast/Include
  ${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/RecastDemo/Include
  ${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/DebugUtils/Include
)

SET(EXE_NAME "recast-navigation")

ADD_LIBRARY(${EXE_NAME} ${SRC_FILES} ${RECASTDETOUR_FILES})

set(EMCC_ARGS
  -flto
  --extern-pre-js ${RECAST_FRONT_MATTER_FILE}
  --post-js glue.js
  -s INITIAL_MEMORY=67108864 # 64*1024*1024 = 64MB
  -s ALLOW_MEMORY_GROWTH=1
  -s ALLOW_TABLE_GROWTH=1
  -s EXPORTED_FUNCTIONS=["_malloc","_free"]
  -s EXPORTED_RUNTIME_METHODS=["UTF8ToString","addFunction","HEAP32","HEAPU32","HEAPU8","HEAPU16","HEAPF32"]
  -s EXPORT_NAME="Recast"
  -s WASM_BIGINT=0
  -s MODULARIZE=1
  -s ENVIRONMENT='web'
  -s NO_EXIT_RUNTIME=1
  -s NO_FILESYSTEM=1
  -s FILESYSTEM=0
  -s EXPORT_ES6=1
  -s BINARYEN_IGNORE_IMPLICIT_TRAPS=1
)

if ("${CMAKE_BUILD_TYPE}" STREQUAL "debug")
	set(EMCC_ARGS 
		${EMCC_ARGS} 
		-g
    -s SAFE_HEAP=1
		-s ASSERTIONS=1)
else()
	set(EMCC_ARGS 
		${EMCC_ARGS} 
		-O3)
endif()

if(${CLOSURE})
  LIST(APPEND EMCC_ARGS
    --closure 1
    -s IGNORE_CLOSURE_COMPILER_ERRORS=1)
else()
  LIST(APPEND EMCC_ARGS
    -s NO_DYNAMIC_EXECUTION=1)
endif()

set(EMCC_WASM_ESM_ARGS ${EMCC_ARGS}
  -s WASM=1)

set(EMCC_WASM_COMPAT_ESM_ARGS ${EMCC_ARGS}
  -s SINGLE_FILE=1
  -s WASM=1)

set(EMCC_GLUE_ARGS
  -c
  -std=c++17
  -I${RECAST_SRC_DIR}
  -I${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/Detour/Include
  -I${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/DetourCrowd/Include
  -I${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/DetourTileCache/Include
  -I${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/Recast/Include
  -I${CMAKE_CURRENT_SOURCE_DIR}/recastnavigation/DebugUtils/Include
  -include${ENTRY_HEADER_FILE}
)

# GLUE
add_custom_command(
  OUTPUT glue.cpp glue.js
  BYPRODUCTS parser.out WebIDLGrammar.pkl
  COMMAND ${PYTHON} ${WEBIDL_BINDER_SCRIPT} ${RECAST_IDL_FILE} glue
  DEPENDS ${RECAST_IDL_FILE}
  COMMENT "Generating ${EXE_NAME} bindings"
  VERBATIM)
add_custom_command(
  OUTPUT glue.o
  COMMAND emcc glue.cpp ${EMCC_GLUE_ARGS} -o glue.o
  DEPENDS glue.cpp ${ENTRY_HEADER_FILE}
  COMMENT "Building ${EXE_NAME} bindings"
  VERBATIM)
add_custom_target(${EXE_NAME}-bindings ALL DEPENDS glue.js glue.o)

# ES6 WASM
add_custom_command(
  OUTPUT ${EXE_NAME}.wasm.js ${EXE_NAME}.wasm.wasm
  COMMAND emcc glue.o lib${EXE_NAME}.a ${EMCC_WASM_ESM_ARGS} -o ${EXE_NAME}.wasm.js
  DEPENDS ${EXE_NAME}-bindings ${EXE_NAME}
  COMMENT "Building ${EXE_NAME} webassembly"
  VERBATIM)
add_custom_target(${EXE_NAME}-wasm ALL DEPENDS ${EXE_NAME}.wasm.js ${EXE_NAME}.wasm.wasm)

# ES6 INLINED BASE64 WASM
add_custom_command(
  OUTPUT ${EXE_NAME}.wasm-compat.js
  COMMAND emcc glue.o lib${EXE_NAME}.a ${EMCC_WASM_COMPAT_ESM_ARGS} -o ${EXE_NAME}.wasm-compat.js
  DEPENDS ${EXE_NAME}-bindings ${EXE_NAME}
  COMMENT "Building ${EXE_NAME} inlined base64 webassembly"
  VERBATIM)
add_custom_target(${EXE_NAME}-wasm-compat ALL DEPENDS ${EXE_NAME}.wasm-compat.js)
