#!/bin/bash

cd audio
echo "=== Audio ==="
bash ./run_build.sh
if [[ $? -ne 0 ]]; then
    cd ..
    exit 1
fi
cd ..

cd main
echo "=== Main ==="
bash ./run_build.sh
cd ..
