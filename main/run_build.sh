echo "Begin build emscripten cmake project"
if [[ -z "$EMSDK_PATH" ]]; then
    echo "ERROR: Path to EM SDK is not set (set env. var. EMSDK_PATH to the emsdk path)"
    exit 1
fi

BUILD_DIR=build.wasm

cd $BUILD_DIR

source $EMSDK_PATH/emsdk_env.sh
emmake make -o index.html

cd ..