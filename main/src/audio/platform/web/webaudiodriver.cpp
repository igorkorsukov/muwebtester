#include "webaudiodriver.h"

#include <emscripten.h>
#include <emscripten/html5.h>

#include <cmath>

#include "log.h"

using namespace mu::audio;

namespace {

struct DriverData {
    IAudioDriver::Callback callback;
    void* pUserData;

    uint8_t* pWorkBuffer;

    uint32_t szWorkBuffer;
    uint32_t syncId{0};

    uint8_t channels;
};

}


static DriverData* sDriverDataPtr{nullptr};


static void HandleAudioProcess(DriverData* data)
{
    data->callback(data->pUserData, data->pWorkBuffer, data->szWorkBuffer);

    EM_ASM({

        var __outputBuffer = Module.audio.outputBuffer;
        var numChannels = __outputBuffer.numberOfChannels;
        for (var channel = 0; channel < numChannels; channel++) {
            var outputData = __outputBuffer.getChannelData(channel);

            for (var sample = 0; sample < __outputBuffer.length; sample++) {
                outputData[sample] = HEAPF32[$0 + ((sample*numChannels + channel) << 2) >> 2];
            }
        }

    }, data->pWorkBuffer);
}

std::string WebAudioDriver::name() const
{
    return "MUAUDIO(Web)";
}

bool WebAudioDriver::open(const Spec& spec, Spec* activeSpec)
{
    IF_ASSERT_FAILED(!sDriverDataPtr) {
        return 0;
    }

    sDriverDataPtr = new DriverData();
    sDriverDataPtr->channels = spec.channels;
    sDriverDataPtr->callback = spec.callback;
    sDriverDataPtr->pUserData = spec.userdata;

    sDriverDataPtr->szWorkBuffer = 32 / 8;
    sDriverDataPtr->szWorkBuffer *= spec.channels;
    sDriverDataPtr->szWorkBuffer *= spec.samples;

    sDriverDataPtr->pWorkBuffer = new uint8_t[sDriverDataPtr->szWorkBuffer];

    EM_ASM({

        Module.audio.onDriverOpened($0, $1);

        Module.audio.processHandle = function() {
            dynCall('vi', $2, [$3]);
        };

    }, spec.channels, spec.samples, HandleAudioProcess, sDriverDataPtr);

    if (activeSpec) {
        *activeSpec = spec;
        activeSpec->format = Format::AudioF32;
        activeSpec->freq = EM_ASM_INT({
            return Module.audio.sampleRate();
        });
    }

    return 1;
}


void WebAudioDriver::close()
{
    EM_ASM({

        Module.audio.onDriverClosed();

    });

    IF_ASSERT_FAILED(sDriverDataPtr) {
        return;
    }

    delete[] sDriverDataPtr->pWorkBuffer;
    delete sDriverDataPtr;
    sDriverDataPtr = nullptr;
}


bool WebAudioDriver::isOpened() const {

    return sDriverDataPtr != nullptr;
}
