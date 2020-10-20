#include "webmain.h"

#include <memory>
#include <chrono>
#include <stdio.h>

#include <emscripten.h>
#include <emscripten/html5.h>

#include "log.h"

#include "rpc/platform/web/webrpcstreamchannel.h"

using namespace mu;

struct WebData
{
    audio::worker::WebRpcStreamChannel* rpcChannel = nullptr;
    bool verbose = false;
};

namespace
{
std::unique_ptr<WebData> _webData;
}

int mu::web::init(bool verbose) {

    LOGI() << "mu::web::init (verbose= " << verbose << ")\n";

    _webData = std::make_unique<WebData>();
    _webData->verbose = verbose;
    _webData->rpcChannel = new audio::worker::WebRpcStreamChannel();

    LOGI() << "success system inited\n";

    return 1;
}

void mu::web::update() {

    if (!_webData) {
        return;
    }
}

void mu::web::action(const std::string& action)
{
    using namespace audio;
    using namespace audio::worker;

    //! NOTE For demo
    if (action == "Create") {
        _webData->rpcChannel->send(0, callID(CallType::Midi, CallMethod::Create), Args());
    } else if(action == "Destroy") {
        _webData->rpcChannel->send(0, callID(CallType::Midi, CallMethod::Destroy), Args());
    }
}
