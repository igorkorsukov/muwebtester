cmake_minimum_required(VERSION 3.0)

project(xtzaudio LANGUAGES C CXX)

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

file(GLOB muaudio_SRC

)

add_definitions(

)

include_directories(
    ${CMAKE_CURRENT_LIST_DIR}
    ${CMAKE_SYSTEM_INCLUDE_PATH}
    ${CMAKE_SYSTEM_INCLUDE_PATH}/libc
)

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${EMCC_COMPILE_FLAGS}")

add_executable(muaudio
    ${muaudio_SRC}
    muaudioapi.cpp
)

set_target_properties(muaudio PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS}")
