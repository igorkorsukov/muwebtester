#!/bin/bash

cd audio
echo "=== Audio ==="
bash ./run_cmake.sh
if [[ $? -ne 0 ]]; then
    cd ..
    exit 1
fi
cd ..

cd main
echo "=== Main ==="
bash ./run_cmake.sh
cd ..

