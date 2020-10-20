#include "webmain.h"

#include <memory>
#include <chrono>
#include <stdio.h>

#include <emscripten.h>
#include <emscripten/html5.h>

#include "log.h"

struct WebData
{
    //std::vector<std::shared_ptr<xtz::modularity::IModuleSetup>> modules;

    bool verbose{false};
};

namespace
{
std::unique_ptr<WebData> _webData;
}

int mu::web::init(bool verbose) {

    LOGI() << "mu::web::init (verbose= " << verbose << ")\n";

    _webData = std::make_unique<WebData>();

    _webData->verbose = verbose;


    LOGI() << "success system inited\n";

    return 1;
}

void mu::web::update() {

    if (!_webData) {
        return;
    }
}
