// embind bindings for @recast-navigation/wasm — replaces recast-navigation.idl.
// Ported in dependency order; see EMBIND_MIGRATION_PLAN.md / BINDING_CONVENTIONS.md.
// The umbrella header src/recast-navigation.h is force-included via -include (build-embind.sh).

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <cstdint>

using namespace emscripten;

// ---------------------------------------------------------------------------
// Array registration helper. get/set/resize/free/size live on the CRTP base
// ArrayWrapperTemplate<T>, so bind via lambdas (BINDING_CONVENTIONS §3). view()
// is a zero-copy typed_memory_view (replaces core's getDataPointer()+HEAP dance).
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Struct field accessors — idiomatic + zero-GC (no WebIDL get_X(i)/set_X(i,v)).
//   scalars              -> .property(&Cls::field)      (primitive, zero alloc)
//   small fixed vectors  -> VEC:  read_X()/write_X() via a shared wasm scratch
//                                 (writer->scratch->pre-allocated JS; zero alloc)
//   bulk/variable arrays -> BULK: XPtr() returns the raw pointer; core builds one
//                                 sized typed view (length from a sibling field)
//   struct-pointer field -> PTR:  .property returning a mutable handle
//   nested value struct  -> MEMBER: .property returning a mutable handle (writes propagate)
//   value-struct array   -> ELEM/ELEM_PTR: X(i) returns an element handle
//   bitfield             -> BIT:  read-only .property getter (primitive)
// ---------------------------------------------------------------------------
static unsigned char sScratch[512];  // shared out-param scratch (fixed vectors)
uintptr_t getScratchPtr() { return (uintptr_t)sScratch; }

// Scratch is always float32 so core reads a single heap view (HEAPF32) regardless of
// the field's C type (values fit exactly in float for recast's short/int vectors).
#define VEC(Cls, field, T, N) \
    .function("read_" #field, +[](Cls& o) { float* s = (float*)sScratch; for (int i = 0; i < N; i++) s[i] = (float)o.field[i]; }) \
    .function("write_" #field, +[](Cls& o) { const float* s = (const float*)sScratch; for (int i = 0; i < N; i++) o.field[i] = (T)s[i]; })
#define VEC_RO(Cls, field, T, N) \
    .function("read_" #field, +[](const Cls& o) { float* s = (float*)sScratch; for (int i = 0; i < N; i++) s[i] = (float)o.field[i]; })
#define BULK(Cls, field) \
    .function(#field "Ptr", +[](Cls& o) { return (uintptr_t)o.field; })
#define PTR(Cls, field) \
    .property(#field, +[](const Cls& o) { return o.field; }, allow_raw_pointers())
#define MEMBER(Cls, field, FieldT) \
    .property(#field, +[](const Cls& o) { return const_cast<FieldT*>(&o.field); }, allow_raw_pointers())
#define ELEM(Cls, field) \
    .function(#field, +[](Cls& o, int i) { return &o.field[i]; }, allow_raw_pointers())
#define ELEM_PTR(Cls, field) \
    .function(#field, +[](Cls& o, int i) { return o.field[i]; }, allow_raw_pointers())
#define BIT(Cls, field) \
    .property(#field, +[](const Cls& o) { return o.field; })

// ---------------------------------------------------------------------------
// Callback wrappers (allow_subclass). JS subclasses these via .extend(); the
// wrapper forwards each virtual into JS. Value args pass directly; pointer/handle
// args are wrapped in val(..., allow_raw_pointers()) so JS gets typed handles
// (killing wrapPointer). Proven by Spike B.
// ---------------------------------------------------------------------------
struct DebugDrawWrapper : public wrapper<DebugDraw> {
    EMSCRIPTEN_WRAPPER(DebugDrawWrapper);
    void handleDepthMask(bool state) override { return call<void>("handleDepthMask", state); }
    void handleTexture(bool state) override { return call<void>("handleTexture", state); }
    // enums cross the JS boundary as int (core passes numbers; see enum-as-constant decision).
    void handleBegin(duDebugDrawPrimitives prim, float size) override { return call<void>("handleBegin", (int)prim, size); }
    void handleVertexWithColor(const float x, const float y, const float z, unsigned int color) override {
        return call<void>("handleVertexWithColor", x, y, z, color);
    }
    void handleVertexWithColorAndUV(const float x, const float y, const float z, unsigned int color, const float u, const float v) override {
        return call<void>("handleVertexWithColorAndUV", x, y, z, color, u, v);
    }
    void handleEnd() override { return call<void>("handleEnd"); }
};

struct RecastBuildContextImplWrapper : public wrapper<RecastBuildContextImpl> {
    EMSCRIPTEN_WRAPPER(RecastBuildContextImplWrapper);
    void resetLog() override { return call<void>("resetLog"); }
    // char* + len -> a real JS string (kills the HEAPU8 pointer read in core). enum -> int.
    void log(const rcLogCategory category, const char* msg, const int len) override {
        return call<void>("log", (int)category, std::string(msg, len), len);
    }
    void resetTimers() override { return call<void>("resetTimers"); }
    void startTimer(const rcTimerLabel label) override { return call<void>("startTimer", (int)label); }
    void stopTimer(const rcTimerLabel label) override { return call<void>("stopTimer", (int)label); }
    int getAccumulatedTime(const rcTimerLabel label) const override {
        return const_cast<RecastBuildContextImplWrapper*>(this)->call<int>("getAccumulatedTime", (int)label);
    }
};

struct TileCacheMeshProcessWrapperJs : public wrapper<TileCacheMeshProcessJsImpl> {
    EMSCRIPTEN_WRAPPER(TileCacheMeshProcessWrapperJs);
    void process(dtNavMeshCreateParams* params, UnsignedCharArray* polyAreas, UnsignedShortArray* polyFlags) override {
        return call<void>("process",
            val(params, allow_raw_pointers()),
            val(polyAreas, allow_raw_pointers()),
            val(polyFlags, allow_raw_pointers()));
    }
};

template <typename ArrT, typename ElemT>
static void registerArray(const char* name) {
    class_<ArrT>(name)
        .template constructor<>()
        .function("get", +[](ArrT& a, int i) { return a.get(i); })
        .function("set", +[](ArrT& a, int i, ElemT v) { a.set(i, v); })
        .function("resize", +[](ArrT& a, int n) { a.resize(n); })
        .function("free", +[](ArrT& a) { a.free(); })
        .property("size", +[](const ArrT& a) { return a.size; })
        .property("isView", +[](const ArrT& a) { return a.isView; })
        .function("getDataPointer", +[](ArrT& a) { return (uintptr_t)a.getDataPointer(); })
        .function("view", +[](ArrT& a) { return val(typed_memory_view(a.size, a.data)); });
}

EMSCRIPTEN_BINDINGS(recast) {
    // =======================================================================
    // Foundation: value refs, arrays, Vec3
    // =======================================================================

    // --- out-param refs (.value) ---
    class_<BoolRef>("BoolRef").constructor<>().property("value", &BoolRef::value);
    class_<IntRef>("IntRef").constructor<>().property("value", &IntRef::value);
    class_<UnsignedIntRef>("UnsignedIntRef").constructor<>().property("value", &UnsignedIntRef::value);
    class_<UnsignedCharRef>("UnsignedCharRef").constructor<>().property("value", &UnsignedCharRef::value);
    class_<UnsignedShortRef>("UnsignedShortRef").constructor<>().property("value", &UnsignedShortRef::value);
    class_<FloatRef>("FloatRef").constructor<>().property("value", &FloatRef::value);

    // --- typed arrays ---
    registerArray<IntArray, int>("IntArray");
    registerArray<UnsignedIntArray, unsigned int>("UnsignedIntArray");
    registerArray<UnsignedCharArray, unsigned char>("UnsignedCharArray");
    registerArray<UnsignedShortArray, unsigned short>("UnsignedShortArray");
    registerArray<FloatArray, float>("FloatArray");

    // --- Vec3 ---
    class_<Vec3>("Vec3")
        .constructor<>()
        .constructor<float, float, float>()
        .property("x", &Vec3::x)
        .property("y", &Vec3::y)
        .property("z", &Vec3::z);

    // Shared out-param scratch pointer (base for VEC read_X/write_X on struct vectors).
    function("getScratchPtr", &getScratchPtr);

    // =======================================================================
    // Enum values + constants, exposed module-level as numbers (matches core's
    // raw.ts `Raw.Module.RC_*` / `DT_*` / `DU_*` reads). constant() avoids
    // guessing C++ enum type names and gives the exact numeric surface core copies.
    // =======================================================================

    // rcBuildContoursFlags
    constant("RC_CONTOUR_TESS_WALL_EDGES", (int)RC_CONTOUR_TESS_WALL_EDGES);
    constant("RC_CONTOUR_TESS_AREA_EDGES", (int)RC_CONTOUR_TESS_AREA_EDGES);
    // rcLogCategory
    constant("RC_LOG_PROGRESS", (int)RC_LOG_PROGRESS);
    constant("RC_LOG_WARNING", (int)RC_LOG_WARNING);
    constant("RC_LOG_ERROR", (int)RC_LOG_ERROR);
    // rcTimerLabel
    constant("RC_TIMER_TOTAL", (int)RC_TIMER_TOTAL);
    constant("RC_TIMER_TEMP", (int)RC_TIMER_TEMP);
    constant("RC_TIMER_RASTERIZE_TRIANGLES", (int)RC_TIMER_RASTERIZE_TRIANGLES);
    constant("RC_TIMER_BUILD_COMPACTHEIGHTFIELD", (int)RC_TIMER_BUILD_COMPACTHEIGHTFIELD);
    constant("RC_TIMER_BUILD_CONTOURS", (int)RC_TIMER_BUILD_CONTOURS);
    constant("RC_TIMER_BUILD_CONTOURS_TRACE", (int)RC_TIMER_BUILD_CONTOURS_TRACE);
    constant("RC_TIMER_BUILD_CONTOURS_SIMPLIFY", (int)RC_TIMER_BUILD_CONTOURS_SIMPLIFY);
    constant("RC_TIMER_FILTER_BORDER", (int)RC_TIMER_FILTER_BORDER);
    constant("RC_TIMER_FILTER_WALKABLE", (int)RC_TIMER_FILTER_WALKABLE);
    constant("RC_TIMER_MEDIAN_AREA", (int)RC_TIMER_MEDIAN_AREA);
    constant("RC_TIMER_FILTER_LOW_OBSTACLES", (int)RC_TIMER_FILTER_LOW_OBSTACLES);
    constant("RC_TIMER_BUILD_POLYMESH", (int)RC_TIMER_BUILD_POLYMESH);
    constant("RC_TIMER_MERGE_POLYMESH", (int)RC_TIMER_MERGE_POLYMESH);
    constant("RC_TIMER_ERODE_AREA", (int)RC_TIMER_ERODE_AREA);
    constant("RC_TIMER_MARK_BOX_AREA", (int)RC_TIMER_MARK_BOX_AREA);
    constant("RC_TIMER_MARK_CYLINDER_AREA", (int)RC_TIMER_MARK_CYLINDER_AREA);
    constant("RC_TIMER_MARK_CONVEXPOLY_AREA", (int)RC_TIMER_MARK_CONVEXPOLY_AREA);
    constant("RC_TIMER_BUILD_DISTANCEFIELD", (int)RC_TIMER_BUILD_DISTANCEFIELD);
    constant("RC_TIMER_BUILD_DISTANCEFIELD_DIST", (int)RC_TIMER_BUILD_DISTANCEFIELD_DIST);
    constant("RC_TIMER_BUILD_DISTANCEFIELD_BLUR", (int)RC_TIMER_BUILD_DISTANCEFIELD_BLUR);
    constant("RC_TIMER_BUILD_REGIONS", (int)RC_TIMER_BUILD_REGIONS);
    constant("RC_TIMER_BUILD_REGIONS_WATERSHED", (int)RC_TIMER_BUILD_REGIONS_WATERSHED);
    constant("RC_TIMER_BUILD_REGIONS_EXPAND", (int)RC_TIMER_BUILD_REGIONS_EXPAND);
    constant("RC_TIMER_BUILD_REGIONS_FLOOD", (int)RC_TIMER_BUILD_REGIONS_FLOOD);
    constant("RC_TIMER_BUILD_REGIONS_FILTER", (int)RC_TIMER_BUILD_REGIONS_FILTER);
    constant("RC_TIMER_BUILD_LAYERS", (int)RC_TIMER_BUILD_LAYERS);
    constant("RC_TIMER_BUILD_POLYMESHDETAIL", (int)RC_TIMER_BUILD_POLYMESHDETAIL);
    constant("RC_TIMER_MERGE_POLYMESHDETAIL", (int)RC_TIMER_MERGE_POLYMESHDETAIL);
    constant("RC_MAX_TIMERS", (int)RC_MAX_TIMERS);

    // dtStraightPathFlags / Options
    constant("DT_STRAIGHTPATH_START", (int)DT_STRAIGHTPATH_START);
    constant("DT_STRAIGHTPATH_END", (int)DT_STRAIGHTPATH_END);
    constant("DT_STRAIGHTPATH_OFFMESH_CONNECTION", (int)DT_STRAIGHTPATH_OFFMESH_CONNECTION);
    constant("DT_STRAIGHTPATH_AREA_CROSSINGS", (int)DT_STRAIGHTPATH_AREA_CROSSINGS);
    constant("DT_STRAIGHTPATH_ALL_CROSSINGS", (int)DT_STRAIGHTPATH_ALL_CROSSINGS);
    // dtFindPathOptions / dtRaycastOptions
    constant("DT_FINDPATH_ANY_ANGLE", (int)DT_FINDPATH_ANY_ANGLE);
    constant("DT_RAYCAST_USE_COSTS", (int)DT_RAYCAST_USE_COSTS);
    // CrowdAgentState
    constant("DT_CROWDAGENT_STATE_INVALID", (int)DT_CROWDAGENT_STATE_INVALID);
    constant("DT_CROWDAGENT_STATE_WALKING", (int)DT_CROWDAGENT_STATE_WALKING);
    constant("DT_CROWDAGENT_STATE_OFFMESH", (int)DT_CROWDAGENT_STATE_OFFMESH);
    // MoveRequestState
    constant("DT_CROWDAGENT_TARGET_NONE", (int)DT_CROWDAGENT_TARGET_NONE);
    constant("DT_CROWDAGENT_TARGET_FAILED", (int)DT_CROWDAGENT_TARGET_FAILED);
    constant("DT_CROWDAGENT_TARGET_VALID", (int)DT_CROWDAGENT_TARGET_VALID);
    constant("DT_CROWDAGENT_TARGET_REQUESTING", (int)DT_CROWDAGENT_TARGET_REQUESTING);
    constant("DT_CROWDAGENT_TARGET_WAITING_FOR_QUEUE", (int)DT_CROWDAGENT_TARGET_WAITING_FOR_QUEUE);
    constant("DT_CROWDAGENT_TARGET_WAITING_FOR_PATH", (int)DT_CROWDAGENT_TARGET_WAITING_FOR_PATH);
    constant("DT_CROWDAGENT_TARGET_VELOCITY", (int)DT_CROWDAGENT_TARGET_VELOCITY);
    // tile flags
    constant("DT_COMPRESSEDTILE_FREE_DATA", (int)DT_COMPRESSEDTILE_FREE_DATA);
    constant("DT_TILE_FREE_DATA", (int)DT_TILE_FREE_DATA);
    // duDebugDrawPrimitives
    constant("DU_DRAW_POINTS", (int)DU_DRAW_POINTS);
    constant("DU_DRAW_LINES", (int)DU_DRAW_LINES);
    constant("DU_DRAW_TRIS", (int)DU_DRAW_TRIS);
    constant("DU_DRAW_QUADS", (int)DU_DRAW_QUADS);

    // =======================================================================
    // Plain data structs. Scalars -> .property (matches core's `this.raw.width`);
    // array fields -> get_X(i)/set_X(i,v) (matches core's existing calls, zero-garbage).
    // =======================================================================

    class_<rcConfig>("rcConfig")
        .constructor<>()
        .property("width", &rcConfig::width)
        .property("height", &rcConfig::height)
        .property("tileSize", &rcConfig::tileSize)
        .property("borderSize", &rcConfig::borderSize)
        .property("cs", &rcConfig::cs)
        .property("ch", &rcConfig::ch)
        .property("walkableSlopeAngle", &rcConfig::walkableSlopeAngle)
        .property("walkableHeight", &rcConfig::walkableHeight)
        .property("walkableClimb", &rcConfig::walkableClimb)
        .property("walkableRadius", &rcConfig::walkableRadius)
        .property("maxEdgeLen", &rcConfig::maxEdgeLen)
        .property("maxSimplificationError", &rcConfig::maxSimplificationError)
        .property("minRegionArea", &rcConfig::minRegionArea)
        .property("mergeRegionArea", &rcConfig::mergeRegionArea)
        .property("maxVertsPerPoly", &rcConfig::maxVertsPerPoly)
        .property("detailSampleDist", &rcConfig::detailSampleDist)
        .property("detailSampleMaxError", &rcConfig::detailSampleMaxError)
        VEC(rcConfig, bmin, float, 3)
        VEC(rcConfig, bmax, float, 3);

    class_<dtMeshHeader>("dtMeshHeader")
        .property("magic", &dtMeshHeader::magic)
        .property("version", &dtMeshHeader::version)
        .property("x", &dtMeshHeader::x)
        .property("y", &dtMeshHeader::y)
        .property("layer", &dtMeshHeader::layer)
        .property("userId", &dtMeshHeader::userId)
        .property("polyCount", &dtMeshHeader::polyCount)
        .property("vertCount", &dtMeshHeader::vertCount)
        .property("maxLinkCount", &dtMeshHeader::maxLinkCount)
        .property("detailMeshCount", &dtMeshHeader::detailMeshCount)
        .property("detailVertCount", &dtMeshHeader::detailVertCount)
        .property("detailTriCount", &dtMeshHeader::detailTriCount)
        .property("bvNodeCount", &dtMeshHeader::bvNodeCount)
        .property("offMeshConCount", &dtMeshHeader::offMeshConCount)
        .property("offMeshBase", &dtMeshHeader::offMeshBase)
        .property("walkableHeight", &dtMeshHeader::walkableHeight)
        .property("walkableRadius", &dtMeshHeader::walkableRadius)
        .property("walkableClimb", &dtMeshHeader::walkableClimb)
        .property("bvQuantFactor", &dtMeshHeader::bvQuantFactor)
        BULK(dtMeshHeader, bmin)
        BULK(dtMeshHeader, bmax);

    class_<dtPoly>("dtPoly")
        .property("firstLink", &dtPoly::firstLink)
        .property("flags", &dtPoly::flags)
        .property("vertCount", &dtPoly::vertCount)
        .property("areaAndtype", &dtPoly::areaAndtype)
        .function("setArea", &dtPoly::setArea)
        .function("setType", &dtPoly::setType)
        .function("getArea", &dtPoly::getArea)
        .function("getType", &dtPoly::getType)
        BULK(dtPoly, verts)
        BULK(dtPoly, neis);

    class_<dtPolyDetail>("dtPolyDetail")
        .property("vertBase", &dtPolyDetail::vertBase)
        .property("triBase", &dtPolyDetail::triBase)
        .property("vertCount", &dtPolyDetail::vertCount)
        .property("triCount", &dtPolyDetail::triCount);

    class_<dtLink>("dtLink")
        .property("ref", &dtLink::ref)
        .property("next", &dtLink::next)
        .property("edge", &dtLink::edge)
        .property("side", &dtLink::side)
        .property("bmin", &dtLink::bmin)
        .property("bmax", &dtLink::bmax);

    class_<dtBVNode>("dtBVNode")
        .property("i", &dtBVNode::i)
        VEC(dtBVNode, bmin, unsigned short, 3)
        VEC(dtBVNode, bmax, unsigned short, 3);

    class_<dtOffMeshConnection>("dtOffMeshConnection")
        .property("rad", &dtOffMeshConnection::rad)
        .property("poly", &dtOffMeshConnection::poly)
        .property("flags", &dtOffMeshConnection::flags)
        .property("side", &dtOffMeshConnection::side)
        .property("userId", &dtOffMeshConnection::userId)
        BULK(dtOffMeshConnection, pos);

    class_<dtMeshTile>("dtMeshTile")
        .property("salt", &dtMeshTile::salt)
        .property("linksFreeList", &dtMeshTile::linksFreeList)
        .property("dataSize", &dtMeshTile::dataSize)
        .property("flags", &dtMeshTile::flags)
        PTR(dtMeshTile, header)
        PTR(dtMeshTile, next)
        ELEM(dtMeshTile, polys)
        ELEM(dtMeshTile, links)
        ELEM(dtMeshTile, detailMeshes)
        ELEM(dtMeshTile, bvTree)
        ELEM(dtMeshTile, offMeshCons)
        BULK(dtMeshTile, verts)
        BULK(dtMeshTile, detailVerts)
        BULK(dtMeshTile, detailTris)
        BULK(dtMeshTile, data);

    // --- opaque handles referenced by the structs below ---
    class_<dtPathCorridor>("dtPathCorridor");
    class_<dtLocalBoundary>("dtLocalBoundary");
    class_<dtObstacleAvoidanceDebugData>("dtObstacleAvoidanceDebugData");

    // --- param structs ---
    class_<dtNavMeshParams>("dtNavMeshParams")
        .constructor<>()
        .property("tileWidth", &dtNavMeshParams::tileWidth)
        .property("tileHeight", &dtNavMeshParams::tileHeight)
        .property("maxTiles", &dtNavMeshParams::maxTiles)
        .property("maxPolys", &dtNavMeshParams::maxPolys)
        VEC(dtNavMeshParams, orig, float, 3);

    class_<dtNavMeshCreateParams>("dtNavMeshCreateParams")
        .constructor<>()
        .property("vertCount", &dtNavMeshCreateParams::vertCount)
        .property("polyCount", &dtNavMeshCreateParams::polyCount)
        .property("nvp", &dtNavMeshCreateParams::nvp)
        .property("detailVertsCount", &dtNavMeshCreateParams::detailVertsCount)
        .property("detailTriCount", &dtNavMeshCreateParams::detailTriCount)
        .property("offMeshConCount", &dtNavMeshCreateParams::offMeshConCount)
        .property("userId", &dtNavMeshCreateParams::userId)
        .property("tileX", &dtNavMeshCreateParams::tileX)
        .property("tileY", &dtNavMeshCreateParams::tileY)
        .property("tileLayer", &dtNavMeshCreateParams::tileLayer)
        .property("walkableHeight", &dtNavMeshCreateParams::walkableHeight)
        .property("walkableRadius", &dtNavMeshCreateParams::walkableRadius)
        .property("walkableClimb", &dtNavMeshCreateParams::walkableClimb)
        .property("cs", &dtNavMeshCreateParams::cs)
        .property("ch", &dtNavMeshCreateParams::ch)
        .property("buildBvTree", &dtNavMeshCreateParams::buildBvTree)
        VEC(dtNavMeshCreateParams, bmin, float, 3)
        VEC(dtNavMeshCreateParams, bmax, float, 3)
        BULK(dtNavMeshCreateParams, verts)
        BULK(dtNavMeshCreateParams, polys)
        BULK(dtNavMeshCreateParams, polyFlags)
        BULK(dtNavMeshCreateParams, polyAreas)
        BULK(dtNavMeshCreateParams, detailMeshes)
        BULK(dtNavMeshCreateParams, detailVerts)
        BULK(dtNavMeshCreateParams, detailTris)
        BULK(dtNavMeshCreateParams, offMeshConVerts)
        BULK(dtNavMeshCreateParams, offMeshConRad)
        BULK(dtNavMeshCreateParams, offMeshConFlags)
        BULK(dtNavMeshCreateParams, offMeshConAreas)
        BULK(dtNavMeshCreateParams, offMeshConDir)
        BULK(dtNavMeshCreateParams, offMeshConUserID);

    class_<dtCrowdAgentParams>("dtCrowdAgentParams")
        .constructor<>()
        .property("radius", &dtCrowdAgentParams::radius)
        .property("height", &dtCrowdAgentParams::height)
        .property("maxAcceleration", &dtCrowdAgentParams::maxAcceleration)
        .property("maxSpeed", &dtCrowdAgentParams::maxSpeed)
        .property("collisionQueryRange", &dtCrowdAgentParams::collisionQueryRange)
        .property("pathOptimizationRange", &dtCrowdAgentParams::pathOptimizationRange)
        .property("separationWeight", &dtCrowdAgentParams::separationWeight)
        .property("updateFlags", &dtCrowdAgentParams::updateFlags)
        .property("obstacleAvoidanceType", &dtCrowdAgentParams::obstacleAvoidanceType)
        .property("queryFilterType", &dtCrowdAgentParams::queryFilterType)
        // void* userData exposed as an opaque number (core treats it as unknown).
        .property("userData",
            +[](const dtCrowdAgentParams& p) { return (uintptr_t)p.userData; },
            +[](dtCrowdAgentParams& p, uintptr_t v) { p.userData = (void*)v; });

    class_<dtObstacleAvoidanceParams>("dtObstacleAvoidanceParams")
        .constructor<>()
        .property("velBias", &dtObstacleAvoidanceParams::velBias)
        .property("weightDesVel", &dtObstacleAvoidanceParams::weightDesVel)
        .property("weightCurVel", &dtObstacleAvoidanceParams::weightCurVel)
        .property("weightSide", &dtObstacleAvoidanceParams::weightSide)
        .property("weightToi", &dtObstacleAvoidanceParams::weightToi)
        .property("horizTime", &dtObstacleAvoidanceParams::horizTime)
        .property("gridSize", &dtObstacleAvoidanceParams::gridSize)
        .property("adaptiveDivs", &dtObstacleAvoidanceParams::adaptiveDivs)
        .property("adaptiveRings", &dtObstacleAvoidanceParams::adaptiveRings)
        .property("adaptiveDepth", &dtObstacleAvoidanceParams::adaptiveDepth);

    // --- crowd ---
    class_<dtCrowdNeighbour>("dtCrowdNeighbour")
        .constructor<>()
        .property("idx", &dtCrowdNeighbour::idx)
        .property("dist", &dtCrowdNeighbour::dist);

    class_<dtCrowdAgent>("dtCrowdAgent")
        .constructor<>()
        .property("active", &dtCrowdAgent::active)
        .property("state", &dtCrowdAgent::state)
        .property("partial", &dtCrowdAgent::partial)
        .property("topologyOptTime", &dtCrowdAgent::topologyOptTime)
        .property("nneis", &dtCrowdAgent::nneis)
        .property("desiredSpeed", &dtCrowdAgent::desiredSpeed)
        .property("ncorners", &dtCrowdAgent::ncorners)
        .property("targetState", &dtCrowdAgent::targetState)
        .property("targetRef", &dtCrowdAgent::targetRef)
        .property("targetPathqRef", &dtCrowdAgent::targetPathqRef)
        .property("targetReplan", &dtCrowdAgent::targetReplan)
        .property("targetReplanTime", &dtCrowdAgent::targetReplanTime)
        MEMBER(dtCrowdAgent, corridor, dtPathCorridor)
        MEMBER(dtCrowdAgent, boundary, dtLocalBoundary)
        MEMBER(dtCrowdAgent, params, dtCrowdAgentParams)
        ELEM(dtCrowdAgent, neis)
        VEC(dtCrowdAgent, npos, float, 3)
        VEC(dtCrowdAgent, disp, float, 3)
        VEC(dtCrowdAgent, dvel, float, 3)
        VEC(dtCrowdAgent, nvel, float, 3)
        VEC(dtCrowdAgent, vel, float, 3)
        VEC(dtCrowdAgent, targetPos, float, 3)
        BULK(dtCrowdAgent, cornerVerts)
        BULK(dtCrowdAgent, cornerFlags)
        BULK(dtCrowdAgent, cornerPolys);

    class_<dtCrowdAgentDebugInfo>("dtCrowdAgentDebugInfo")
        .constructor<>()
        .property("idx", &dtCrowdAgentDebugInfo::idx)
        PTR(dtCrowdAgentDebugInfo, vod)
        VEC(dtCrowdAgentDebugInfo, optStart, float, 3)
        VEC(dtCrowdAgentDebugInfo, optEnd, float, 3);

    // --- query hit ---
    class_<dtRaycastHit>("dtRaycastHit")
        .constructor<>()
        .property("t", &dtRaycastHit::t)
        .property("hitEdgeIndex", &dtRaycastHit::hitEdgeIndex)
        .property("pathCount", &dtRaycastHit::pathCount)
        .property("maxPath", &dtRaycastHit::maxPath)
        .property("pathCost", &dtRaycastHit::pathCost)
        VEC(dtRaycastHit, hitNormal, float, 3)
        BULK(dtRaycastHit, path);

    // --- tile cache structs ---
    class_<dtTileCacheParams>("dtTileCacheParams")
        .constructor<>()
        .property("cs", &dtTileCacheParams::cs)
        .property("ch", &dtTileCacheParams::ch)
        .property("width", &dtTileCacheParams::width)
        .property("height", &dtTileCacheParams::height)
        .property("walkableHeight", &dtTileCacheParams::walkableHeight)
        .property("walkableRadius", &dtTileCacheParams::walkableRadius)
        .property("walkableClimb", &dtTileCacheParams::walkableClimb)
        .property("maxSimplificationError", &dtTileCacheParams::maxSimplificationError)
        .property("maxTiles", &dtTileCacheParams::maxTiles)
        .property("maxObstacles", &dtTileCacheParams::maxObstacles)
        VEC(dtTileCacheParams, orig, float, 3);

    class_<dtTileCacheLayerHeader>("dtTileCacheLayerHeader")
        .constructor<>()
        .property("magic", &dtTileCacheLayerHeader::magic)
        .property("version", &dtTileCacheLayerHeader::version)
        .property("tx", &dtTileCacheLayerHeader::tx)
        .property("ty", &dtTileCacheLayerHeader::ty)
        .property("tlayer", &dtTileCacheLayerHeader::tlayer)
        .property("hmin", &dtTileCacheLayerHeader::hmin)
        .property("hmax", &dtTileCacheLayerHeader::hmax)
        .property("width", &dtTileCacheLayerHeader::width)
        .property("height", &dtTileCacheLayerHeader::height)
        .property("minx", &dtTileCacheLayerHeader::minx)
        .property("maxx", &dtTileCacheLayerHeader::maxx)
        .property("miny", &dtTileCacheLayerHeader::miny)
        .property("maxy", &dtTileCacheLayerHeader::maxy)
        VEC(dtTileCacheLayerHeader, bmin, float, 3)
        VEC(dtTileCacheLayerHeader, bmax, float, 3);

    // =======================================================================
    // Recast build structs. Bitfields (rcSpan/rcCompactCell/rcCompactSpan) via
    // get_X(). These are heap-owned by recast (alloc*/free*) — no JS constructor.
    // =======================================================================

    class_<rcSpan>("rcSpan")
        BIT(rcSpan, smin) BIT(rcSpan, smax) BIT(rcSpan, area)
        PTR(rcSpan, next);

    class_<rcSpanPool>("rcSpanPool")
        PTR(rcSpanPool, next)
        ELEM(rcSpanPool, items);

    class_<rcHeightfield>("rcHeightfield")
        .property("width", &rcHeightfield::width)
        .property("height", &rcHeightfield::height)
        .property("cs", &rcHeightfield::cs)
        .property("ch", &rcHeightfield::ch)
        VEC(rcHeightfield, bmin, float, 3)
        VEC(rcHeightfield, bmax, float, 3)
        ELEM_PTR(rcHeightfield, spans)
        PTR(rcHeightfield, pools)
        PTR(rcHeightfield, freelist);

    class_<rcCompactCell>("rcCompactCell")
        BIT(rcCompactCell, index) BIT(rcCompactCell, count);

    class_<rcCompactSpan>("rcCompactSpan")
        BIT(rcCompactSpan, y) BIT(rcCompactSpan, reg)
        BIT(rcCompactSpan, con) BIT(rcCompactSpan, h);

    class_<rcCompactHeightfield>("rcCompactHeightfield")
        .property("width", &rcCompactHeightfield::width)
        .property("height", &rcCompactHeightfield::height)
        .property("spanCount", &rcCompactHeightfield::spanCount)
        .property("walkableHeight", &rcCompactHeightfield::walkableHeight)
        .property("walkableClimb", &rcCompactHeightfield::walkableClimb)
        .property("borderSize", &rcCompactHeightfield::borderSize)
        .property("maxDistance", &rcCompactHeightfield::maxDistance)
        .property("maxRegions", &rcCompactHeightfield::maxRegions)
        .property("cs", &rcCompactHeightfield::cs)
        .property("ch", &rcCompactHeightfield::ch)
        VEC(rcCompactHeightfield, bmin, float, 3)
        VEC(rcCompactHeightfield, bmax, float, 3)
        ELEM(rcCompactHeightfield, cells)
        ELEM(rcCompactHeightfield, spans)
        BULK(rcCompactHeightfield, dist)
        BULK(rcCompactHeightfield, areas);

    class_<rcContour>("rcContour")
        .property("nverts", &rcContour::nverts)
        .property("nrverts", &rcContour::nrverts)
        .property("reg", &rcContour::reg)
        .property("area", &rcContour::area)
        BULK(rcContour, verts)
        BULK(rcContour, rverts);

    class_<rcContourSet>("rcContourSet")
        .property("nconts", &rcContourSet::nconts)
        .property("cs", &rcContourSet::cs)
        .property("ch", &rcContourSet::ch)
        .property("width", &rcContourSet::width)
        .property("height", &rcContourSet::height)
        .property("borderSize", &rcContourSet::borderSize)
        .property("maxError", &rcContourSet::maxError)
        VEC(rcContourSet, bmin, float, 3)
        VEC(rcContourSet, bmax, float, 3)
        ELEM(rcContourSet, conts);

    class_<rcHeightfieldLayer>("rcHeightfieldLayer")
        .property("cs", &rcHeightfieldLayer::cs)
        .property("ch", &rcHeightfieldLayer::ch)
        .property("width", &rcHeightfieldLayer::width)
        .property("height", &rcHeightfieldLayer::height)
        .property("minx", &rcHeightfieldLayer::minx)
        .property("maxx", &rcHeightfieldLayer::maxx)
        .property("miny", &rcHeightfieldLayer::miny)
        .property("maxy", &rcHeightfieldLayer::maxy)
        .property("hmin", &rcHeightfieldLayer::hmin)
        .property("hmax", &rcHeightfieldLayer::hmax)
        VEC(rcHeightfieldLayer, bmin, float, 3)
        VEC(rcHeightfieldLayer, bmax, float, 3)
        BULK(rcHeightfieldLayer, heights)
        BULK(rcHeightfieldLayer, areas)
        BULK(rcHeightfieldLayer, cons);

    class_<rcHeightfieldLayerSet>("rcHeightfieldLayerSet")
        .property("nlayers", &rcHeightfieldLayerSet::nlayers)
        ELEM(rcHeightfieldLayerSet, layers);

    class_<rcPolyMesh>("rcPolyMesh")
        .property("nverts", &rcPolyMesh::nverts)
        .property("npolys", &rcPolyMesh::npolys)
        .property("maxpolys", &rcPolyMesh::maxpolys)
        .property("nvp", &rcPolyMesh::nvp)
        .property("cs", &rcPolyMesh::cs)
        .property("ch", &rcPolyMesh::ch)
        .property("borderSize", &rcPolyMesh::borderSize)
        .property("maxEdgeError", &rcPolyMesh::maxEdgeError)
        VEC(rcPolyMesh, bmin, float, 3)
        VEC(rcPolyMesh, bmax, float, 3)
        BULK(rcPolyMesh, verts)
        BULK(rcPolyMesh, polys)
        BULK(rcPolyMesh, regs)
        BULK(rcPolyMesh, flags)
        BULK(rcPolyMesh, areas);

    class_<rcPolyMeshDetail>("rcPolyMeshDetail")
        .property("nmeshes", &rcPolyMeshDetail::nmeshes)
        .property("nverts", &rcPolyMeshDetail::nverts)
        .property("ntris", &rcPolyMeshDetail::ntris)
        BULK(rcPolyMeshDetail, meshes)
        BULK(rcPolyMeshDetail, verts)
        BULK(rcPolyMeshDetail, tris);

    class_<rcChunkyTriMeshNode>("rcChunkyTriMeshNode")
        .property("i", &rcChunkyTriMeshNode::i)
        .property("n", &rcChunkyTriMeshNode::n)
        VEC(rcChunkyTriMeshNode, bmin, float, 2)
        VEC(rcChunkyTriMeshNode, bmax, float, 2);

    class_<rcChunkyTriMesh>("rcChunkyTriMesh")
        .constructor<>()
        .property("nnodes", &rcChunkyTriMesh::nnodes)
        .property("ntris", &rcChunkyTriMesh::ntris)
        .property("maxTrisPerChunk", &rcChunkyTriMesh::maxTrisPerChunk)
        ELEM(rcChunkyTriMesh, nodes)
        BULK(rcChunkyTriMesh, tris);

    // =======================================================================
    // Remaining pure-opaque handles (no exposed methods). dtObstacleRef /
    // dtCompressedTileRef are `typedef unsigned int` — handled as uintptr_t, NOT class_.
    // =======================================================================
    class_<dtNavMesh>("dtNavMesh");
    class_<dtTileCacheLayer>("dtTileCacheLayer");
    class_<dtTileCacheContourSet>("dtTileCacheContourSet");
    class_<dtTileCachePolyMesh>("dtTileCachePolyMesh");
    class_<dtTileCacheCompressor>("dtTileCacheCompressor");
    class_<dtTileCacheAlloc>("dtTileCacheAlloc");
    class_<duDebugDraw>("duDebugDraw");

    // =======================================================================
    // Result structs (returned by value from the namespace-class methods).
    // Pointer fields -> handle accessors; opaque ref/void* -> uintptr_t.
    // =======================================================================

    class_<NavMeshRemoveTileResult>("NavMeshRemoveTileResult")
        .property("status", &NavMeshRemoveTileResult::status)
        .property("dataSize", &NavMeshRemoveTileResult::dataSize)
        BULK(NavMeshRemoveTileResult, data);

    class_<NavMeshCalcTileLocResult>("NavMeshCalcTileLocResult")
        .property("tileX", &NavMeshCalcTileLocResult::tileX)
        .property("tileY", &NavMeshCalcTileLocResult::tileY);

    class_<NavMeshGetTilesAtResult>("NavMeshGetTilesAtResult")
        .property("tileCount", &NavMeshGetTilesAtResult::tileCount)
        .function("get_tiles", +[](NavMeshGetTilesAtResult& r, int i) { return const_cast<dtMeshTile*>(&r.tiles[i]); }, allow_raw_pointers());

    class_<NavMeshGetTileAndPolyByRefResult>("NavMeshGetTileAndPolyByRefResult")
        .property("status", &NavMeshGetTileAndPolyByRefResult::status)
        .property("tile", +[](const NavMeshGetTileAndPolyByRefResult& o) { return const_cast<dtMeshTile*>(o.tile); }, allow_raw_pointers())
        .property("poly", +[](const NavMeshGetTileAndPolyByRefResult& o) { return const_cast<dtPoly*>(o.poly); }, allow_raw_pointers());

    class_<NavMeshStoreTileStateResult>("NavMeshStoreTileStateResult")
        .property("status", &NavMeshStoreTileStateResult::status)
        .property("dataSize", &NavMeshStoreTileStateResult::dataSize)
        BULK(NavMeshStoreTileStateResult, data);

    class_<TileCacheAddTileResult>("TileCacheAddTileResult")
        .property("status", &TileCacheAddTileResult::status)
        .property("tileRef", &TileCacheAddTileResult::tileRef);

    class_<TileCacheUpdateResult>("TileCacheUpdateResult")
        .property("status", &TileCacheUpdateResult::status)
        .property("upToDate", &TileCacheUpdateResult::upToDate);

    class_<TileCacheAddObstacleResult>("TileCacheAddObstacleResult")
        .property("status", &TileCacheAddObstacleResult::status)
        .property("ref", +[](const TileCacheAddObstacleResult& r) { return (uintptr_t)r.ref; });

    class_<NavMeshImporterResult>("NavMeshImporterResult")
        .property("success", &NavMeshImporterResult::success)
        PTR(NavMeshImporterResult, navMesh)
        PTR(NavMeshImporterResult, tileCache)
        PTR(NavMeshImporterResult, allocator)
        PTR(NavMeshImporterResult, compressor);

    class_<NavMeshExport>("NavMeshExport")
        .constructor<>()
        .property("size", &NavMeshExport::size)
        .property("dataPointer",
            +[](const NavMeshExport& e) { return (uintptr_t)e.dataPointer; },
            +[](NavMeshExport& e, uintptr_t v) { e.dataPointer = (void*)v; });

    class_<RecastCalcBoundsResult>("RecastCalcBoundsResult")
        VEC(RecastCalcBoundsResult, bmin, float, 3)
        VEC(RecastCalcBoundsResult, bmax, float, 3);

    class_<RecastCalcGridSizeResult>("RecastCalcGridSizeResult")
        .property("width", &RecastCalcGridSizeResult::width)
        .property("height", &RecastCalcGridSizeResult::height);

    class_<CreateNavMeshDataResult>("CreateNavMeshDataResult")
        .property("success", &CreateNavMeshDataResult::success)
        PTR(CreateNavMeshDataResult, navMeshData);

    // =======================================================================
    // Namespace / helper classes. `const float*` params are marshalled from JS
    // number[] via convertJSArrayToNumberVector<float>() (so core's call sites,
    // which pass number[], stay unchanged). Pointers use allow_raw_pointers().
    // =======================================================================

    class_<FastRand>("FastRand")
        .class_function("getSeed", &FastRand::getSeed)
        .class_function("setSeed", &FastRand::setSeed);

    class_<dtQueryFilter>("dtQueryFilter")
        .constructor<>()
        .function("getAreaCost", &dtQueryFilter::getAreaCost)
        .function("setAreaCost", &dtQueryFilter::setAreaCost)
        .function("getIncludeFlags", &dtQueryFilter::getIncludeFlags)
        .function("setIncludeFlags", &dtQueryFilter::setIncludeFlags)
        .function("getExcludeFlags", &dtQueryFilter::getExcludeFlags)
        .function("setExcludeFlags", &dtQueryFilter::setExcludeFlags);

    class_<dtNavMeshQuery>("dtNavMeshQuery")
        .function("getAttachedNavMesh", +[](dtNavMeshQuery& q) { return q.getAttachedNavMesh(); }, allow_raw_pointers());

    class_<Detour>("Detour")
        .constructor<>()
        .property("FAILURE", &Detour::FAILURE)
        .property("SUCCESS", &Detour::SUCCESS)
        .property("IN_PROGRESS", &Detour::IN_PROGRESS)
        .property("STATUS_DETAIL_MASK", &Detour::STATUS_DETAIL_MASK)
        .property("WRONG_MAGIC", &Detour::WRONG_MAGIC)
        .property("WRONG_VERSION", &Detour::WRONG_VERSION)
        .property("OUT_OF_MEMORY", &Detour::OUT_OF_MEMORY)
        .property("INVALID_PARAM", &Detour::INVALID_PARAM)
        .property("BUFFER_TOO_SMALL", &Detour::BUFFER_TOO_SMALL)
        .property("OUT_OF_NODES", &Detour::OUT_OF_NODES)
        .property("PARTIAL_RESULT", &Detour::PARTIAL_RESULT)
        .property("ALREADY_OCCUPIED", &Detour::ALREADY_OCCUPIED)
        .property("VERTS_PER_POLYGON", &Detour::VERTS_PER_POLYGON)
        .property("NAVMESH_MAGIC", &Detour::NAVMESH_MAGIC)
        .property("NAVMESH_VERSION", &Detour::NAVMESH_VERSION)
        .property("NAVMESH_STATE_MAGIC", &Detour::NAVMESH_STATE_MAGIC)
        .property("NAVMESH_STATE_VERSION", &Detour::NAVMESH_STATE_VERSION)
        .property("TILECACHE_MAGIC", &Detour::TILECACHE_MAGIC)
        .property("TILECACHE_VERSION", &Detour::TILECACHE_VERSION)
        .property("TILECACHE_NULL_AREA", &Detour::TILECACHE_NULL_AREA)
        .property("TILECACHE_WALKABLE_AREA", &Detour::TILECACHE_WALKABLE_AREA)
        .property("TILECACHE_NULL_IDX", &Detour::TILECACHE_NULL_IDX)
        .property("NULL_LINK", &Detour::NULL_LINK)
        .property("EXT_LINK", &Detour::EXT_LINK)
        .property("OFFMESH_CON_BIDIR", &Detour::OFFMESH_CON_BIDIR)
        .function("statusSucceed", &Detour::statusSucceed)
        .function("statusFailed", &Detour::statusFailed)
        .function("statusInProgress", &Detour::statusInProgress)
        .function("statusDetail", &Detour::statusDetail)
        .function("allocCrowd", &Detour::allocCrowd, allow_raw_pointers())
        .function("freeCrowd", &Detour::freeCrowd, allow_raw_pointers());

    class_<NavMesh>("NavMesh")
        .constructor<>()
        .constructor(+[](dtNavMesh* m) { return new NavMesh(m); }, allow_raw_pointers())
        .property("m_navMesh", +[](const NavMesh& n) { return n.m_navMesh; }, allow_raw_pointers())
        .function("initSolo", &NavMesh::initSolo, allow_raw_pointers())
        .function("initTiled", &NavMesh::initTiled, allow_raw_pointers())
        .function("addTile", &NavMesh::addTile, allow_raw_pointers())
        .function("removeTile", &NavMesh::removeTile)
        .function("getNavMesh", &NavMesh::getNavMesh, allow_raw_pointers())
        .function("calcTileLoc", +[](NavMesh& n, val pos) {
            auto p = convertJSArrayToNumberVector<float>(pos);
            return n.calcTileLoc(p.data()); })
        .function("decodePolyId", &NavMesh::decodePolyId, allow_raw_pointers())
        .function("encodePolyId", &NavMesh::encodePolyId)
        .function("getTileAt", +[](NavMesh& n, int x, int y, int layer) { return const_cast<dtMeshTile*>(n.getTileAt(x, y, layer)); }, allow_raw_pointers())
        .function("getTilesAt", &NavMesh::getTilesAt)
        .function("getTileRefAt", &NavMesh::getTileRefAt)
        .function("getTileRef", &NavMesh::getTileRef, allow_raw_pointers())
        .function("getTileByRef", +[](NavMesh& n, unsigned int ref) { return const_cast<dtMeshTile*>(n.getTileByRef(ref)); }, allow_raw_pointers())
        .function("getMaxTiles", &NavMesh::getMaxTiles)
        .function("getTile", +[](NavMesh& n, int i) { return const_cast<dtMeshTile*>(n.getTile(i)); }, allow_raw_pointers())
        .function("getTileAndPolyByRef", &NavMesh::getTileAndPolyByRef)
        .function("getTileAndPolyByRefUnsafe", &NavMesh::getTileAndPolyByRefUnsafe)
        .function("isValidPolyRef", &NavMesh::isValidPolyRef)
        .function("getPolyRefBase", &NavMesh::getPolyRefBase, allow_raw_pointers())
        .function("getOffMeshConnectionPolyEndPoints", &NavMesh::getOffMeshConnectionPolyEndPoints, allow_raw_pointers())
        .function("getOffMeshConnectionByRef", +[](NavMesh& n, unsigned int ref) { return const_cast<dtOffMeshConnection*>(n.getOffMeshConnectionByRef(ref)); }, allow_raw_pointers())
        .function("setPolyFlags", &NavMesh::setPolyFlags)
        .function("getPolyFlags", &NavMesh::getPolyFlags, allow_raw_pointers())
        .function("setPolyArea", &NavMesh::setPolyArea)
        .function("getPolyArea", &NavMesh::getPolyArea, allow_raw_pointers())
        .function("getTileStateSize", &NavMesh::getTileStateSize, allow_raw_pointers())
        .function("storeTileState", &NavMesh::storeTileState, allow_raw_pointers())
        .function("restoreTileState", +[](NavMesh& n, dtMeshTile* tile, val data, int maxDataSize) {
            auto d = convertJSArrayToNumberVector<unsigned char>(data);
            return n.restoreTileState(tile, d.data(), maxDataSize); }, allow_raw_pointers())
        .function("destroy", &NavMesh::destroy);

    class_<NavMeshQuery>("NavMeshQuery")
        .constructor<>()
        .constructor(+[](dtNavMeshQuery* q) { return new NavMeshQuery(q); }, allow_raw_pointers())
        .property("m_navQuery", +[](const NavMeshQuery& q) { return q.m_navQuery; }, allow_raw_pointers())
        .function("init", &NavMeshQuery::init, allow_raw_pointers())
        .function("findPath", +[](NavMeshQuery& q, unsigned int s, unsigned int e, val sp, val ep, const dtQueryFilter* f, UnsignedIntArray* path, int maxPath) {
            auto a = convertJSArrayToNumberVector<float>(sp), b = convertJSArrayToNumberVector<float>(ep);
            return q.findPath(s, e, a.data(), b.data(), f, path, maxPath); }, allow_raw_pointers())
        .function("closestPointOnPoly", +[](NavMeshQuery& q, unsigned int ref, val pos, Vec3* closest, BoolRef* over) {
            auto p = convertJSArrayToNumberVector<float>(pos);
            return q.closestPointOnPoly(ref, p.data(), closest, over); }, allow_raw_pointers())
        .function("findClosestPoint", +[](NavMeshQuery& q, val position, val halfExtents, const dtQueryFilter* f, UnsignedIntRef* rp, Vec3* pt, BoolRef* over) {
            auto a = convertJSArrayToNumberVector<float>(position), b = convertJSArrayToNumberVector<float>(halfExtents);
            return q.findClosestPoint(a.data(), b.data(), f, rp, pt, over); }, allow_raw_pointers())
        .function("findStraightPath", +[](NavMeshQuery& q, val sp, val ep, UnsignedIntArray* path, FloatArray* straight, UnsignedCharArray* flags, UnsignedIntArray* refs, IntRef* count, int maxStraight, int options) {
            auto a = convertJSArrayToNumberVector<float>(sp), b = convertJSArrayToNumberVector<float>(ep);
            return q.findStraightPath(a.data(), b.data(), path, straight, flags, refs, count, maxStraight, options); }, allow_raw_pointers())
        .function("findNearestPoly", +[](NavMeshQuery& q, val center, val halfExtents, const dtQueryFilter* f, UnsignedIntRef* nr, Vec3* np, BoolRef* op) {
            auto a = convertJSArrayToNumberVector<float>(center), b = convertJSArrayToNumberVector<float>(halfExtents);
            return q.findNearestPoly(a.data(), b.data(), f, nr, np, op); }, allow_raw_pointers())
        .function("findPolysAroundCircle", +[](NavMeshQuery& q, unsigned int s, val center, float radius, const dtQueryFilter* f, UnsignedIntArray* rr, UnsignedIntArray* rp, FloatArray* rc, IntRef* rcount, int maxResult) {
            auto a = convertJSArrayToNumberVector<float>(center);
            return q.findPolysAroundCircle(s, a.data(), radius, f, rr, rp, rc, rcount, maxResult); }, allow_raw_pointers())
        .function("queryPolygons", +[](NavMeshQuery& q, val center, val halfExtents, const dtQueryFilter* f, UnsignedIntArray* polys, IntRef* pc, int maxPolys) {
            auto a = convertJSArrayToNumberVector<float>(center), b = convertJSArrayToNumberVector<float>(halfExtents);
            return q.queryPolygons(a.data(), b.data(), f, polys, pc, maxPolys); }, allow_raw_pointers())
        .function("raycast", +[](NavMeshQuery& q, unsigned int s, val sp, val ep, const dtQueryFilter* f, unsigned int options, dtRaycastHit* hit, unsigned int prevRef) {
            auto a = convertJSArrayToNumberVector<float>(sp), b = convertJSArrayToNumberVector<float>(ep);
            return q.raycast(s, a.data(), b.data(), f, options, hit, prevRef); }, allow_raw_pointers())
        .function("findRandomPointAroundCircle", +[](NavMeshQuery& q, unsigned int s, val center, float radius, const dtQueryFilter* f, UnsignedIntRef* rr, Vec3* rp) {
            auto a = convertJSArrayToNumberVector<float>(center);
            return q.findRandomPointAroundCircle(s, a.data(), radius, f, rr, rp); }, allow_raw_pointers())
        .function("moveAlongSurface", +[](NavMeshQuery& q, unsigned int s, val sp, val ep, const dtQueryFilter* f, Vec3* rpos, UnsignedIntArray* visited, int maxVisited) {
            auto a = convertJSArrayToNumberVector<float>(sp), b = convertJSArrayToNumberVector<float>(ep);
            return q.moveAlongSurface(s, a.data(), b.data(), f, rpos, visited, maxVisited); }, allow_raw_pointers())
        .function("findRandomPoint", &NavMeshQuery::findRandomPoint, allow_raw_pointers())
        .function("getPolyHeight", +[](NavMeshQuery& q, unsigned int ref, val pos, FloatRef* h) {
            auto p = convertJSArrayToNumberVector<float>(pos);
            return q.getPolyHeight(ref, p.data(), h); }, allow_raw_pointers())
        .function("destroy", &NavMeshQuery::destroy);

    class_<dtCrowd>("dtCrowd")
        .constructor<>()
        .function("init", &dtCrowd::init, allow_raw_pointers())
        .function("setObstacleAvoidanceParams", &dtCrowd::setObstacleAvoidanceParams, allow_raw_pointers())
        .function("getObstacleAvoidanceParams", &dtCrowd::getObstacleAvoidanceParams, allow_raw_pointers())
        .function("getAgent", &dtCrowd::getAgent, allow_raw_pointers())
        .function("getEditableAgent", &dtCrowd::getEditableAgent, allow_raw_pointers())
        .function("getAgentCount", &dtCrowd::getAgentCount)
        .function("addAgent", +[](dtCrowd& c, val pos, const dtCrowdAgentParams* p) {
            auto a = convertJSArrayToNumberVector<float>(pos);
            return c.addAgent(a.data(), p); }, allow_raw_pointers())
        .function("updateAgentParameters", &dtCrowd::updateAgentParameters, allow_raw_pointers())
        .function("removeAgent", &dtCrowd::removeAgent)
        .function("requestMoveTarget", +[](dtCrowd& c, int idx, unsigned int ref, val pos) {
            auto a = convertJSArrayToNumberVector<float>(pos);
            return c.requestMoveTarget(idx, ref, a.data()); })
        .function("requestMoveVelocity", +[](dtCrowd& c, int idx, val vel) {
            auto a = convertJSArrayToNumberVector<float>(vel);
            return c.requestMoveVelocity(idx, a.data()); })
        .function("resetMoveTarget", &dtCrowd::resetMoveTarget)
        .function("update", &dtCrowd::update, allow_raw_pointers())
        .function("getFilter", &dtCrowd::getFilter, allow_raw_pointers())
        .function("getEditableFilter", &dtCrowd::getEditableFilter, allow_raw_pointers())
        .function("getNavMeshQuery", +[](dtCrowd& c) { return const_cast<dtNavMeshQuery*>(c.getNavMeshQuery()); }, allow_raw_pointers());

    class_<CrowdUtils>("CrowdUtils")
        .constructor<>()
        .function("getActiveAgentCount", &CrowdUtils::getActiveAgentCount, allow_raw_pointers())
        .function("overOffMeshConnection", &CrowdUtils::overOffMeshConnection, allow_raw_pointers())
        .function("agentTeleport", +[](CrowdUtils& u, dtCrowd* crowd, int idx, val dest, val half, dtQueryFilter* f) {
            auto d = convertJSArrayToNumberVector<float>(dest), h = convertJSArrayToNumberVector<float>(half);
            u.agentTeleport(crowd, idx, d.data(), h.data(), f); }, allow_raw_pointers());

    // rcContext base (param type for the Recast build methods; RecastBuildContext
    // is-a rcContext, registered with base<rcContext> in the callbacks section).
    class_<rcContext>("rcContext");

    class_<Recast>("Recast")
        .constructor<>()
        .property("BORDER_REG", &Recast::BORDER_REG)
        .property("MULTIPLE_REGS", &Recast::MULTIPLE_REGS)
        .property("BORDER_VERTEX", &Recast::BORDER_VERTEX)
        .property("AREA_BORDER", &Recast::AREA_BORDER)
        .property("CONTOUR_REG_MASK", &Recast::CONTOUR_REG_MASK)
        .property("MESH_NULL_IDX", &Recast::MESH_NULL_IDX)
        .property("NULL_AREA", &Recast::NULL_AREA)
        .property("WALKABLE_AREA", &Recast::WALKABLE_AREA)
        .property("NOT_CONNECTED", &Recast::NOT_CONNECTED)
        .function("calcBounds", &Recast::calcBounds, allow_raw_pointers())
        .function("calcGridSize", +[](Recast& r, val bmin, val bmax, float cs) {
            auto a = convertJSArrayToNumberVector<float>(bmin), b = convertJSArrayToNumberVector<float>(bmax);
            return r.calcGridSize(a.data(), b.data(), cs); }, allow_raw_pointers())
        .function("createHeightfield", +[](Recast& r, rcContext* ctx, rcHeightfield& hf, int w, int h, val bmin, val bmax, float cs, float ch) {
            auto a = convertJSArrayToNumberVector<float>(bmin), b = convertJSArrayToNumberVector<float>(bmax);
            return r.createHeightfield(ctx, hf, w, h, a.data(), b.data(), cs, ch); }, allow_raw_pointers())
        .function("markWalkableTriangles", &Recast::markWalkableTriangles, allow_raw_pointers())
        .function("clearUnwalkableTriangles", &Recast::clearUnwalkableTriangles, allow_raw_pointers())
        .function("rasterizeTriangles", &Recast::rasterizeTriangles, allow_raw_pointers())
        .function("filterLowHangingWalkableObstacles", &Recast::filterLowHangingWalkableObstacles, allow_raw_pointers())
        .function("filterLedgeSpans", &Recast::filterLedgeSpans, allow_raw_pointers())
        .function("filterWalkableLowHeightSpans", &Recast::filterWalkableLowHeightSpans, allow_raw_pointers())
        .function("getHeightFieldSpanCount", &Recast::getHeightFieldSpanCount, allow_raw_pointers())
        .function("buildCompactHeightfield", &Recast::buildCompactHeightfield, allow_raw_pointers())
        .function("erodeWalkableArea", &Recast::erodeWalkableArea, allow_raw_pointers())
        .function("medianFilterWalkableArea", &Recast::medianFilterWalkableArea, allow_raw_pointers())
        .function("markBoxArea", +[](Recast& r, rcContext* ctx, val bmin, val bmax, unsigned char areaId, rcCompactHeightfield& chf) {
            auto a = convertJSArrayToNumberVector<float>(bmin), b = convertJSArrayToNumberVector<float>(bmax);
            r.markBoxArea(ctx, a.data(), b.data(), areaId, chf); }, allow_raw_pointers())
        .function("markConvexPolyArea", &Recast::markConvexPolyArea, allow_raw_pointers())
        .function("markCylinderArea", +[](Recast& r, rcContext* ctx, val pos, float rad, float h, unsigned char areaId, rcCompactHeightfield& chf) {
            auto p = convertJSArrayToNumberVector<float>(pos);
            r.markCylinderArea(ctx, p.data(), rad, h, areaId, chf); }, allow_raw_pointers())
        .function("buildDistanceField", &Recast::buildDistanceField, allow_raw_pointers())
        .function("buildRegions", &Recast::buildRegions, allow_raw_pointers())
        .function("buildLayerRegions", &Recast::buildLayerRegions, allow_raw_pointers())
        .function("buildRegionsMonotone", &Recast::buildRegionsMonotone, allow_raw_pointers())
        .function("setCon", &Recast::setCon)
        .function("getCon", &Recast::getCon)
        .function("getDirOffsetX", &Recast::getDirOffsetX)
        .function("getDirOffsetY", &Recast::getDirOffsetY)
        .function("getDirForOffset", &Recast::getDirForOffset)
        .function("buildHeightfieldLayers", &Recast::buildHeightfieldLayers, allow_raw_pointers())
        .function("buildContours", &Recast::buildContours, allow_raw_pointers())
        .function("buildPolyMesh", &Recast::buildPolyMesh, allow_raw_pointers())
        .function("mergePolyMeshes", +[](Recast& r, rcContext* ctx, val meshes, int nmeshes, rcPolyMesh& mesh) {
            std::vector<rcPolyMesh*> v;
            int len = meshes["length"].as<int>();
            for (int i = 0; i < len; i++) v.push_back(meshes[i].as<rcPolyMesh*>(allow_raw_pointers()));
            return r.mergePolyMeshes(ctx, v.data(), nmeshes, mesh); }, allow_raw_pointers())
        .function("buildPolyMeshDetail", &Recast::buildPolyMeshDetail, allow_raw_pointers())
        .function("copyPolyMesh", &Recast::copyPolyMesh, allow_raw_pointers())
        .function("mergePolyMeshDetails", +[](Recast& r, rcContext* ctx, val meshes, int nmeshes, rcPolyMeshDetail& mesh) {
            std::vector<rcPolyMeshDetail*> v;
            int len = meshes["length"].as<int>();
            for (int i = 0; i < len; i++) v.push_back(meshes[i].as<rcPolyMeshDetail*>(allow_raw_pointers()));
            return r.mergePolyMeshDetails(ctx, v.data(), nmeshes, mesh); }, allow_raw_pointers())
        .function("getHeightfieldLayerHeights", &Recast::getHeightfieldLayerHeights, allow_raw_pointers())
        .function("getHeightfieldLayerAreas", &Recast::getHeightfieldLayerAreas, allow_raw_pointers())
        .function("getHeightfieldLayerCons", &Recast::getHeightfieldLayerCons, allow_raw_pointers())
        .function("allocHeightfield", &Recast::allocHeightfield, allow_raw_pointers())
        .function("freeHeightfield", &Recast::freeHeightfield, allow_raw_pointers())
        .function("allocCompactHeightfield", &Recast::allocCompactHeightfield, allow_raw_pointers())
        .function("freeCompactHeightfield", &Recast::freeCompactHeightfield, allow_raw_pointers())
        .function("allocHeightfieldLayerSet", &Recast::allocHeightfieldLayerSet, allow_raw_pointers())
        .function("freeHeightfieldLayerSet", &Recast::freeHeightfieldLayerSet, allow_raw_pointers())
        .function("allocContourSet", &Recast::allocContourSet, allow_raw_pointers())
        .function("freeContourSet", &Recast::freeContourSet, allow_raw_pointers())
        .function("allocPolyMesh", &Recast::allocPolyMesh, allow_raw_pointers())
        .function("freePolyMesh", &Recast::freePolyMesh, allow_raw_pointers())
        .function("allocPolyMeshDetail", &Recast::allocPolyMeshDetail, allow_raw_pointers())
        .function("freePolyMeshDetail", &Recast::freePolyMeshDetail, allow_raw_pointers());

    class_<DetourNavMeshBuilder>("DetourNavMeshBuilder")
        .constructor<>()
        .function("setPolyMeshCreateParams", &DetourNavMeshBuilder::setPolyMeshCreateParams, allow_raw_pointers())
        .function("setPolyMeshDetailCreateParams", &DetourNavMeshBuilder::setPolyMeshDetailCreateParams, allow_raw_pointers())
        .function("setOffMeshConnections", +[](DetourNavMeshBuilder& b, dtNavMeshCreateParams* params, int count, val verts, val rad, val dirs, val areas, val flags, val userId) {
            auto v = convertJSArrayToNumberVector<float>(verts), r = convertJSArrayToNumberVector<float>(rad);
            auto d = convertJSArrayToNumberVector<unsigned char>(dirs), a = convertJSArrayToNumberVector<unsigned char>(areas);
            auto f = convertJSArrayToNumberVector<unsigned short>(flags);
            auto u = convertJSArrayToNumberVector<unsigned int>(userId);
            b.setOffMeshConnections(params, count, v.data(), r.data(), d.data(), a.data(), f.data(), u.data()); }, allow_raw_pointers())
        .function("createNavMeshData", &DetourNavMeshBuilder::createNavMeshData, allow_raw_pointers());

    class_<DetourTileCacheBuilder>("DetourTileCacheBuilder")
        .constructor<>()
        .function("buildTileCacheLayer", &DetourTileCacheBuilder::buildTileCacheLayer, allow_raw_pointers());

    class_<RecastFastLZCompressor, base<dtTileCacheCompressor>>("RecastFastLZCompressor")
        .constructor<>();

    class_<RecastLinearAllocator, base<dtTileCacheAlloc>>("RecastLinearAllocator")
        .constructor<size_t>();

    class_<TileCache>("TileCache")
        .constructor<>()
        .function("init", &TileCache::init, allow_raw_pointers())
        .function("addTile", &TileCache::addTile, allow_raw_pointers())
        .function("buildNavMeshTile", +[](TileCache& tc, uintptr_t ref, NavMesh* nm) {
            return tc.buildNavMeshTile((const dtCompressedTileRef*)ref, nm); }, allow_raw_pointers())
        .function("buildNavMeshTilesAt", &TileCache::buildNavMeshTilesAt, allow_raw_pointers())
        .function("update", &TileCache::update, allow_raw_pointers())
        .function("addCylinderObstacle", &TileCache::addCylinderObstacle)
        .function("addBoxObstacle", &TileCache::addBoxObstacle)
        .function("removeObstacle", +[](TileCache& tc, uintptr_t obstacle) {
            return tc.removeObstacle((dtObstacleRef*)obstacle); })
        .function("destroy", &TileCache::destroy);

    class_<ChunkyTriMeshUtils>("ChunkyTriMeshUtils")
        .constructor<>()
        .function("createChunkyTriMesh", &ChunkyTriMeshUtils::createChunkyTriMesh, allow_raw_pointers())
        .function("getChunksOverlappingRect", +[](ChunkyTriMeshUtils& u, rcChunkyTriMesh* mesh, val bmin, val bmax, IntArray* ids, int maxIds) {
            auto a = convertJSArrayToNumberVector<float>(bmin), b = convertJSArrayToNumberVector<float>(bmax);
            return u.getChunksOverlappingRect(mesh, a.data(), b.data(), ids, maxIds); }, allow_raw_pointers())
        .function("getChunkyTriMeshNodeTris", &ChunkyTriMeshUtils::getChunkyTriMeshNodeTris, allow_raw_pointers());

    class_<NavMeshExporter>("NavMeshExporter")
        .constructor<>()
        .function("exportNavMesh", &NavMeshExporter::exportNavMesh, allow_raw_pointers())
        .function("freeNavMeshExport", &NavMeshExporter::freeNavMeshExport, allow_raw_pointers());

    class_<NavMeshImporter>("NavMeshImporter")
        .constructor<>()
        .function("importNavMesh", &NavMeshImporter::importNavMesh, allow_raw_pointers());

    // =======================================================================
    // Debug draw free-function wrappers (take a duDebugDraw* + registered refs).
    // =======================================================================
    class_<RecastDebugDraw>("RecastDebugDraw")
        .constructor<>()
        .function("debugDrawHeightfieldSolid", &RecastDebugDraw::debugDrawHeightfieldSolid, allow_raw_pointers())
        .function("debugDrawHeightfieldWalkable", &RecastDebugDraw::debugDrawHeightfieldWalkable, allow_raw_pointers())
        .function("debugDrawCompactHeightfieldSolid", &RecastDebugDraw::debugDrawCompactHeightfieldSolid, allow_raw_pointers())
        .function("debugDrawCompactHeightfieldRegions", &RecastDebugDraw::debugDrawCompactHeightfieldRegions, allow_raw_pointers())
        .function("debugDrawCompactHeightfieldDistance", &RecastDebugDraw::debugDrawCompactHeightfieldDistance, allow_raw_pointers())
        .function("debugDrawHeightfieldLayer", &RecastDebugDraw::debugDrawHeightfieldLayer, allow_raw_pointers())
        .function("debugDrawHeightfieldLayers", &RecastDebugDraw::debugDrawHeightfieldLayers, allow_raw_pointers())
        .function("debugDrawRegionConnections", &RecastDebugDraw::debugDrawRegionConnections, allow_raw_pointers())
        .function("debugDrawRawContours", &RecastDebugDraw::debugDrawRawContours, allow_raw_pointers())
        .function("debugDrawContours", &RecastDebugDraw::debugDrawContours, allow_raw_pointers())
        .function("debugDrawPolyMesh", &RecastDebugDraw::debugDrawPolyMesh, allow_raw_pointers())
        .function("debugDrawPolyMeshDetail", &RecastDebugDraw::debugDrawPolyMeshDetail, allow_raw_pointers());

    class_<DetourDebugDraw>("DetourDebugDraw")
        .constructor<>()
        .function("debugDrawNavMesh", &DetourDebugDraw::debugDrawNavMesh, allow_raw_pointers())
        .function("debugDrawNavMeshWithClosedList", &DetourDebugDraw::debugDrawNavMeshWithClosedList, allow_raw_pointers())
        .function("debugDrawNavMeshNodes", &DetourDebugDraw::debugDrawNavMeshNodes, allow_raw_pointers())
        .function("debugDrawNavMeshBVTree", &DetourDebugDraw::debugDrawNavMeshBVTree, allow_raw_pointers())
        .function("debugDrawNavMeshPortals", &DetourDebugDraw::debugDrawNavMeshPortals, allow_raw_pointers())
        .function("debugDrawNavMeshPolysWithFlags", &DetourDebugDraw::debugDrawNavMeshPolysWithFlags, allow_raw_pointers())
        .function("debugDrawNavMeshPoly", &DetourDebugDraw::debugDrawNavMeshPoly, allow_raw_pointers())
        .function("debugDrawTileCacheLayerAreas", &DetourDebugDraw::debugDrawTileCacheLayerAreas, allow_raw_pointers())
        .function("debugDrawTileCacheLayerRegions", &DetourDebugDraw::debugDrawTileCacheLayerRegions, allow_raw_pointers())
        .function("debugDrawTileCacheContours", +[](DetourDebugDraw& d, duDebugDraw* dd, const dtTileCacheContourSet& cset, val orig, float cs, float ch) {
            auto o = convertJSArrayToNumberVector<float>(orig);
            d.debugDrawTileCacheContours(dd, cset, o.data(), cs, ch); }, allow_raw_pointers())
        .function("debugDrawTileCachePolyMesh", +[](DetourDebugDraw& d, duDebugDraw* dd, const dtTileCachePolyMesh& pmesh, val orig, float cs, float ch) {
            auto o = convertJSArrayToNumberVector<float>(orig);
            d.debugDrawTileCachePolyMesh(dd, pmesh, o.data(), cs, ch); }, allow_raw_pointers());

    // =======================================================================
    // Callbacks (allow_subclass). JS: Module.DebugDraw.extend("Impl", {...}).
    // =======================================================================
    class_<DebugDraw, base<duDebugDraw>>("DebugDraw")
        .allow_subclass<DebugDrawWrapper>("DebugDrawWrapper")
        .function("handleDepthMask", &DebugDraw::handleDepthMask, pure_virtual())
        .function("handleTexture", &DebugDraw::handleTexture, pure_virtual())
        // handleBegin omitted: its duDebugDrawPrimitives param would force enum
        // registration (core passes numbers). The wrapper still forwards it to JS.
        .function("handleVertexWithColor", &DebugDraw::handleVertexWithColor, pure_virtual())
        .function("handleVertexWithColorAndUV", &DebugDraw::handleVertexWithColorAndUV, pure_virtual())
        .function("handleEnd", &DebugDraw::handleEnd, pure_virtual());

    class_<RecastBuildContextImpl>("RecastBuildContextImpl")
        .allow_subclass<RecastBuildContextImplWrapper>("RecastBuildContextImplWrapper")
        .function("resetLog", &RecastBuildContextImpl::resetLog)
        .function("log", +[](RecastBuildContextImpl& c, int cat, const std::string& msg) {
            c.log((rcLogCategory)cat, msg.c_str(), (int)msg.size()); })
        .function("resetTimers", &RecastBuildContextImpl::resetTimers)
        .function("startTimer", +[](RecastBuildContextImpl& c, int label) { c.startTimer((rcTimerLabel)label); })
        .function("stopTimer", +[](RecastBuildContextImpl& c, int label) { c.stopTimer((rcTimerLabel)label); })
        .function("getAccumulatedTime", +[](RecastBuildContextImpl& c, int label) { return c.getAccumulatedTime((rcTimerLabel)label); });

    class_<RecastBuildContext, base<rcContext>>("RecastBuildContext")
        .constructor(+[](RecastBuildContextImpl* impl) { return new RecastBuildContext(impl); }, allow_raw_pointers())
        .function("enableLog", +[](RecastBuildContext& c, bool s) { c.enableLog(s); })
        .function("enableTimer", +[](RecastBuildContext& c, bool s) { c.enableTimer(s); })
        .function("logEnabled", &RecastBuildContext::logEnabled)
        .function("timerEnabled", &RecastBuildContext::timerEnabled);

    class_<TileCacheMeshProcessJsImpl>("TileCacheMeshProcess")
        .allow_subclass<TileCacheMeshProcessWrapperJs>("TileCacheMeshProcessWrapperJs")
        .function("process", &TileCacheMeshProcessJsImpl::process, pure_virtual(), allow_raw_pointers());
}
