#ifndef MU_AUDIO_WEBRPCSTREAMCHANNEL_H
#define MU_AUDIO_WEBRPCSTREAMCHANNEL_H

#include <functional>
#include <map>
#include <memory>

#include "framework/audio/internal/worker/rpcstreamchannelbase.h"

namespace mu::audio::worker {

class WebRpcStreamChannel : public RpcStreamChannelBase
{
public:
     WebRpcStreamChannel();


private:

    // Rpc
    void doSend(const StreamID& id, CallID method, const Args& args) override;
    void doListen(const StreamID& id, Handler h) override;
    void doUnlisten(const StreamID& id) override;
    void doListenAll(HandlerAll h) override;
    void doUnlistenAll() override;

    void onStreamRegistred(std::shared_ptr<Stream>& stream) override;
    void onStreamUnregistred(const StreamID &id) override;
    void onRequestAudio(const StreamID& id) override;


    static void RpcListen(WebRpcStreamChannel* self, int id_, int method, const char* args);

    static void doRequestAudio(WebRpcStreamChannel* self, int id_, uint32_t samples);
    static uint8_t* GetBuffer(WebRpcStreamChannel* self, int id_, uint32_t sizeInBytes, int time_ms);
    static void OnAudioReceived(WebRpcStreamChannel* self, int id_);

    void doRpcListen(const StreamID& id, CallID method, const std::string& args);

    std::map<StreamID, Handler> _handlers;
    HandlerAll _handlerAll;

    std::vector<float> _buffer;
    bool _requesting{false};
};

}

#endif // MU_AUDIO_WEBRPCSTREAMCHANNEL_H
