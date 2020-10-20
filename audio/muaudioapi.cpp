
#include <stdio.h>

#include <memory>
#include <string>
#include <vector>

#include <emscripten.h>

#include "log.h"

static int k = 0;

extern "C" int Init(const char* soundfont_url, const char* config_json) {

    LOGI() << "LOGI [audiocpp] =================== Init config: " << config_json;

    return 0;
}
