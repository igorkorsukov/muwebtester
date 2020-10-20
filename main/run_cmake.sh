#!/bin/bash

if [[ -z "$EMSDK_PATH" ]]; then
    echo "ERROR: Path to EM SDK is not set (set env. var. EMSDK_PATH to the emsdk path)"
    exit 1
fi

source $EMSDK_PATH/emsdk_env.sh

BUILD_DIR=build.wasm

if [[ -d "$BUILD_DIR" ]]; then
    echo "Removing old build folder..."
    rm -rf $BUILD_DIR
    if [[ $? -ne 0 ]]; then
        echo "WARNING: failed to remove folder!"
    fi
fi

mkdir $BUILD_DIR
if [[ $? -ne 0 ]]; then
    echo "ERROR: failed to create build folder!"
    exit 1
fi


cd $BUILD_DIR
if [[ $? -ne 0 ]]; then
    echo "ERROR: failed to CD to the build folder!"
    exit 1
fi


emcmake cmake .. -G "Unix Makefiles"
if [[ $? -ne 0 ]]; then
    echo "ERROR: failed to generate project!"
    cd ..
    exit 1
fi

cd ..

echo "SUCCESS"
exit 0
