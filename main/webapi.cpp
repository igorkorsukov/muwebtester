#include <stdio.h>
#include <string>
#include <cstring>
#include <cstdlib>

#include <emscripten.h>

#include "log.h"
#include "webmain.h"

extern "C" {

static const char* WASM_VERSION = "42";

//! === Infrastructure ===
int Initialize(int width, int height, int dpi, int verbose, const char* js_version) {

    LOGI() << "[maincpp] Initialize";

    std::string wasm_ver = std::string(WASM_VERSION);
    std::string js_ver = std::string(js_version);

    std::string text = std::string("[mumain] === MAIN ") + wasm_ver + ", JSAPI " + js_ver + " ===\n";

    EM_ASM({
        var text = UTF8ToString($0);
        console.info(text)
    }, text.c_str());

    if (js_ver != "{{xtzver}}" && js_ver != wasm_ver) {
        text = std::string("FATAL ERROR, version wasm and js mismatch\n");
        EM_ASM({
            var text = UTF8ToString($0);
            console.error(text)
        }, text.c_str());

        std::abort();
    }

    return mu::web::init(verbose);
}

void Update() {

    mu::web::update();
}

// Audio - Action

void Play() {
    LOGI() << "Play\n";
}

void Pause() {
    LOGI() << "Pause\n";
}

void Stop() {
    LOGI() << "Stop\n";
}


// Audio - Control

void SetPlayPositionByTime(double sec) {
    LOGI() << "SetPlayPositionByTime sec: " << sec << "\n";
}

};
