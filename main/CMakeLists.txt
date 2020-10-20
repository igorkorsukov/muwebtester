cmake_minimum_required(VERSION 3.0)

project(muwebmain LANGUAGES C CXX)

add_compile_options(
    $<$<COMPILE_LANGUAGE:CXX>:-std=c++17>
)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/../../distr")

set(EXPORTED_FUNCTIONS "\"['_Initialize', '_Update', \
    '_Play', '_Pause', '_Stop', '_SetPlayPositionByTime' \
    ]\"")


set(EMCC_LINKER_FLAGS "\
    -s EXPORT_NAME=MuWasm \
    -s MODULARIZE=1 \
    -s EXPORT_ES6=1 \
    -s WASM=1 \
    -s ENVIRONMENT=web \
    -s STRICT=1 \
    -s EXPORTED_FUNCTIONS=${EXPORTED_FUNCTIONS} \
    -s EXTRA_EXPORTED_RUNTIME_METHODS=\"['ccall', 'cwrap']\" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s DISABLE_EXCEPTION_CATCHING=1 \
    -s DISABLE_EXCEPTION_THROWING=1 \
    -s INLINING_LIMIT=0 \
    -s USE_ES6_IMPORT_META=0 \
    -s DISABLE_DEPRECATED_FIND_EVENT_TARGET_BEHAVIOR=1 \
    -ofast \
    -g4 \
    -s ASSERTIONS=1 \
")

#--preload-file ./resources/main \

set(EMCC_COMPILE_FLAGS "\
    -O3 -fno-rtti -fno-exceptions -ffast-math \
")

set(WEB ON)

set(MU_ROOT ${CMAKE_CURRENT_LIST_DIR}/../../MuseScore)
set(MU_GLOBAL ${MU_ROOT}/framework/global)
set(MU_AUDIO ${MU_ROOT}/framework/audio)

set(MY_AUDIO_DIR ${CMAKE_CURRENT_LIST_DIR}/src/audio)

include_directories(
    ${CMAKE_CURRENT_LIST_DIR}
    ${CMAKE_SYSTEM_INCLUDE_PATH}
    ${CMAKE_SYSTEM_INCLUDE_PATH}/libc
    ${MU_ROOT}
    ${MU_ROOT}/framework/global
    ${MY_AUDIO_DIR}
)

# muweb ---
set(web_SRC
    webapi.cpp
    webmain.h
    webmain.cpp

    # MU Global
    ${MU_GLOBAL}/modularity/imoduleexport.h

    # MU Audio
    ${MU_AUDIO}/internal/iaudiodriver.h

    # Rpc
    ${MU_AUDIO}/internal/worker/irpcaudiostreamchannel.h
    ${MU_AUDIO}/internal/worker/rpcstreamchannelbase.cpp
    ${MU_AUDIO}/internal/worker/rpcstreamchannelbase.h

    # My audio
    ${MY_AUDIO_DIR}/platform/web/webaudiodriver.cpp
    ${MY_AUDIO_DIR}/platform/web/webaudiodriver.h
    ${MY_AUDIO_DIR}/rpc/platform/web/webrpcstreamchannel.cpp
    ${MY_AUDIO_DIR}/rpc/platform/web/webrpcstreamchannel.h
)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${EMCC_COMPILE_FLAGS}")

add_executable(mumain
    ${web_SRC}
)

set_target_properties(mumain PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS}")
