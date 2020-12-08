#ifndef MU_AUDIO_WEBAUDIODRIVER_H
#define MU_AUDIO_WEBAUDIODRIVER_H

#include "framework/audio/internal/iaudiodriver.h"

namespace mu::audio {


class WebAudioDriver : public IAudioDriver {
public:

    WebAudioDriver() = default;

    std::string name() const override;
    bool open (const Spec& spec, Spec* activeSpec) override;
    void close() override;
    bool isOpened() const override;

};


}


#endif//MU_AUDIO_WEBAUDIODRIVER_H
