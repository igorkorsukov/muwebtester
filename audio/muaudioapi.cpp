
#include <stdio.h>

#include <memory>
#include <string>
#include <vector>

#include <emscripten.h>

#include "log.h"

#include "rpc/platform/web/webrpcstreamchannel.h"

using namespace mu;

static audio::worker::WebRpcStreamChannel* rpcChannel = nullptr;

extern "C" int Init(const char* soundfont_url, const char* config_json) {

    LOGI() << "[audiocpp] =================== Init config: " << config_json;

    rpcChannel = new audio::worker::WebRpcStreamChannel();

    rpcChannel->listenAll([](const audio::worker::StreamID& id, audio::worker::CallID method, const audio::Args&) {
        LOGI() << "[audiocpp] id: " << int(id) << ", method: " << int(audio::worker::callMethod(method));
    });
    return 0;
}
