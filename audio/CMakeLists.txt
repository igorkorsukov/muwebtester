cmake_minimum_required(VERSION 3.0)

project(muaudio LANGUAGES C CXX)

add_compile_options(
    $<$<COMPILE_LANGUAGE:CXX>:-std=c++17>
)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/../../distr")

set(EMCC_LINKER_FLAGS "\
    -s WASM=1 \
    -s ENVIRONMENT=worker \
    -s EXPORT_NAME=MuAudio \
    -s FETCH=1 \
    -s EXPORTED_FUNCTIONS=\"['_Init']\" \
    -s EXTRA_EXPORTED_RUNTIME_METHODS=\"['ccall', 'cwrap']\" \
    -s STRICT=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s DISABLE_EXCEPTION_CATCHING=1 \
    -s DISABLE_EXCEPTION_THROWING=1 \
    -s INLINING_LIMIT=0 \
    -s ASSERTIONS=0 \
    -s USE_ES6_IMPORT_META=0 \
    -ofast \
    -g4 \
    -s ASSERTIONS=1 \
")

#--preload-file ./resources/audio \

set(EMCC_COMPILE_FLAGS "\
    -O3 -fno-rtti -fno-exceptions -ffast-math \
")

set(WEB ON)

set(MU_ROOT ${CMAKE_CURRENT_LIST_DIR}/../../MuseScore)
set(MU_GLOBAL ${MU_ROOT}/framework/global)
set(MU_AUDIO ${MU_ROOT}/framework/audio)

set(MY_AUDIO_DIR ${CMAKE_CURRENT_LIST_DIR}/../main/src/audio)

include_directories(
    ${CMAKE_CURRENT_LIST_DIR}
    ${CMAKE_SYSTEM_INCLUDE_PATH}
    ${CMAKE_SYSTEM_INCLUDE_PATH}/libc
    ${MU_ROOT}
    ${MU_ROOT}/framework/global
    ${MY_AUDIO_DIR}
)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${EMCC_COMPILE_FLAGS}")

add_executable(muaudio
    muaudioapi.cpp

    # MU Global
    ${MU_GLOBAL}/modularity/imoduleexport.h

    # Rpc
    ${MU_AUDIO}/internal/worker/irpcaudiostreamchannel.h
    ${MU_AUDIO}/internal/worker/rpcstreamchannelbase.cpp
    ${MU_AUDIO}/internal/worker/rpcstreamchannelbase.h

    # My audio
    ${MY_AUDIO_DIR}/rpc/platform/web/webrpcstreamchannel.cpp
    ${MY_AUDIO_DIR}/rpc/platform/web/webrpcstreamchannel.h
)

set_target_properties(muaudio PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS}")
