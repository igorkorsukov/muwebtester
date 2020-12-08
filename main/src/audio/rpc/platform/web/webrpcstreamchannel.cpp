#include "webrpcstreamchannel.h"

#include <emscripten.h>

#include "log.h"

using namespace mu::audio;
using namespace mu::audio::worker;

namespace {
bool args_serialize(const Args& args, std::string& out)
{
    //! TODO Implement me
    return false;
}
bool args_deserialize(Args& args, const std::string& in)
{
    //! TODO Implement me
    return false;
}
}

WebRpcStreamChannel::WebRpcStreamChannel()
{
    // Main
    EM_ASM({

               Module.audio.onAudioRequestReceived = function(id, audio_buf, time) {

                   var size = audio_buf.length;
                   var ptr = dynCall('iiiii', $1, [$0, id, size, time*1000]);

                   var mem = new Uint8Array(Module.HEAPU8.buffer, ptr, size);
                   mem.set(audio_buf);

                   dynCall('vii', $2, [$0, id]);

               };
           }, this, GetBuffer, OnAudioReceived);

    EM_ASM({

               Module.audio.rpcListen = function(id, method, args_str) {

                   var a_ptr = allocate(intArrayFromString(args_str), ALLOC_NORMAL);

                   dynCall('viiii', $1, [$0, id, method, a_ptr]);

               };
           }, this, RpcListen);


    // Audio Worker
    EM_ASM({

               Module.audio.process_handle = function(id, samples) {
                   dynCall('viii', $1, [$0, id, samples]);
               };

           }, this, doRequestAudio);
}

void WebRpcStreamChannel::doSend(const StreamID &id, CallID method, const Args& args) {

    std::string args_str;
    args_serialize(args, args_str);

    LOGI() << "<- [" << id << "] method: " << method << ", args: " << args_str;

    EM_ASM({
               Module.audio.rpcSend($0, $1, AsciiToString($2));
           }, static_cast<int>(id), static_cast<int>(method), args_str.c_str());
}

void WebRpcStreamChannel::doListen(const StreamID& id, Handler h) {
    _handlers[id] = h;
}

void WebRpcStreamChannel::doUnlisten(const StreamID& id) {
    _handlers.erase(id);
}

void WebRpcStreamChannel::doListenAll(HandlerAll h) {
    _handlerAll = h;
}

void WebRpcStreamChannel::doUnlistenAll() {
    _handlerAll = nullptr;
}

void WebRpcStreamChannel::RpcListen(WebRpcStreamChannel* self, int id_, int method, const char* args) {
    self->doRpcListen(StreamID(id_), CallID(method), std::string(args));
}

void WebRpcStreamChannel::doRpcListen(const StreamID& id, CallID method, const std::string& args_str) {

    LOGI() << "-> [" << id << "] method: " << method << ", args: " << args_str;

    Args args;
    args_deserialize(args, args_str);

    if (_handlerAll) {
        _handlerAll(id, method, args);
    }

    if (_handlers[id]) {
        _handlers[id](method, args);
    }
}

void WebRpcStreamChannel::onStreamRegistred(std::shared_ptr<Stream>& stream) {

    EM_ASM({
               Module.audio.audioRequestRegister($0, $1, $2);
           }, static_cast<int>(stream->id), stream->samples, stream->bufSizeInBytes());
}

void WebRpcStreamChannel::onStreamUnregistred(const StreamID& id) {

    EM_ASM({
               Module.audio.audioRequestUnregister($0);
           }, static_cast<int>(id));
}

void WebRpcStreamChannel::onRequestAudio(const StreamID& id) {

    UNUSED(id);
    //LOGI() << "onRequestAudio id: " << id;

    if (!allStreamsInState(RequestState::REQUESTED)) {
        return;
    }

    if (_requesting) {
        return;
    }

    EM_ASM({
               Module.audio.audioRequestSend();
           });
    //LOGI() << "Module.audio.requestsAudio";

    _requesting = true;
}

uint8_t* WebRpcStreamChannel::GetBuffer(WebRpcStreamChannel* self, int id_, uint32_t sizeInBytes, int time_ms) {

    StreamID id = static_cast<StreamID>(id_);

    std::shared_ptr<Stream> s = self->stream(id);
    if (!s) {
        return nullptr;
    }

    uint32_t sizeInSamples = sizeInBytes / sizeof (float);
    Context ctx;
    float* ptr = s->getBuffer(sizeInSamples, ctx);
    return reinterpret_cast<uint8_t*>(ptr);
}

void WebRpcStreamChannel::OnAudioReceived(WebRpcStreamChannel* self, int id_) {

    //LOGI() << "[WebRpcStreamChannel] OnAudioReceved time: " << time;

    const std::shared_ptr<Stream>& s = self->stream(id_);
    if (!s) {
        return;
    }

    s->state = RequestState::FREE;

    if (!self->allStreamsInState(RequestState::FREE)) {
        return;
    }

    self->_requesting = false;

    for (auto& p : self->m_streams) {
        p.second->onRequestFinished();
    }
}

// Audio Worker
void WebRpcStreamChannel::doRequestAudio(WebRpcStreamChannel* self, int id_, uint32_t samples) {

    StreamID id = static_cast<StreamID>(id_);
    uint16_t channels = 2;

    uint32_t sizeInSamples = samples * channels;
    if (self->_buffer.size() != sizeInSamples) {
        self->_buffer.resize(sizeInSamples);
    }

    Context ctx;
    self->m_getAudio(id, &self->_buffer[0], samples, sizeInSamples, &ctx);

    uint8_t* ptr = reinterpret_cast<uint8_t*>(&self->_buffer[0]);
    uint32_t sizeInBytes = channels * samples * sizeof (float);

    EM_ASM({

               var mem_in = new Uint8Array(Module.HEAPU8.buffer, $0, $1);

               var mem_out = new Uint8Array(Module.audio.output);

               mem_out.set(mem_in);

               Module.audio.output_time = $2;

           }, ptr, sizeInBytes, static_cast<double>(0));
}

