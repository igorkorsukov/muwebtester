
var MuAudioModule = (function () {

    var AUDIO_WASM_JS_URI = "muaudio.js"
    var AUDIO_WORKER_URI = "audio_worker.js"

    var AM = {
        worker: null,
        audio_context: null,
        spn: null,
        channels: 0,
        samples: 0,
        samples_time: 0,
        is_driver_opened: false,

        requests: [],
        bufs: [],

        createNoiseNode: function() {
            var noise = AM.audio_context.createBiquadFilter();
            return noise.type = "lowpass",
            noise.gain.value = 24e3,
            noise
        },

        createEchoNode: function() {
            var f = {};
            return f._passthrough = AM.audio_context.createGain(),
            f.setRatio = function(volume) {}
            ,
            f.setBuffer = function(buffer) {}
            ,
            f.unlink = function() {
                f._passthrough.disconnect()
            }
            ,
            f.input = function(node) {
                node.connect(f._passthrough)
            }
            ,
            f.output = function(node) {
                f._passthrough.connect(node)
            }
            ,
            f
        },

        createCompressorNode: function() {
            var f = {};
            return f.on = !1,
            f.compressor = AM.audio_context.createDynamicsCompressor(),
            f.input = AM.audio_context.createGain(),
            f.output = AM.audio_context.createGain(),
            f.input.connect(f.output),
            f.unchain = function() {
                f.input.disconnect(),
                f.input = null,
                f.compressor && (f.compressor.disconnect(),
                f.compressor = null),
                f.output.disconnect(),
                f.output = null
            }
            ,
            f.setup = function(compressor, threshold, knee, ratio, attack, release) {
                isNaN(1 * threshold) || (f.compressor.threshold.value = threshold),
                isNaN(1 * knee) || (f.compressor.knee.value = knee),
                isNaN(1 * ratio) || (f.compressor.ratio.value = ratio),
                isNaN(1 * attack) || (f.compressor.attack.value = attack),
                isNaN(1 * release) || (f.compressor.release.value = release),
                compressor ? (f.on = !0,
                f.compressor || (f.compressor = AM.audio_context.createDynamicsCompressor()),
                f.input.disconnect(),
                f.input.connect(f.compressor),
                f.compressor.connect(f.output)) : (f.on = !1,
                f.input.disconnect(),
                f.input.connect(f.output))
            }
            ,
            f
        },

        bandEqualizer: function(frequency, q) {
            var filter = AM.audio_context.createBiquadFilter();
            return filter.frequency.value = frequency,
            filter.type = "peaking",
            filter.gain.value = 0,
            filter.Q.value = q,
            filter
        },

        createEqualizerNode: function() {
            var f = {};
            return f.eq65 = AM.bandEqualizer(65, 1),
            f.eq125 = AM.bandEqualizer(125, 1),
            f.eq250 = AM.bandEqualizer(250, 1),
            f.eq500 = AM.bandEqualizer(500, 1),
            f.eq1000 = AM.bandEqualizer(1e3, 1),
            f.eq2000 = AM.bandEqualizer(2e3, 1),
            f.eq4000 = AM.bandEqualizer(4e3, 1),
            f.eq6000 = AM.bandEqualizer(6e3, 1),
            f.eq8000 = AM.bandEqualizer(8e3, 1),
            f.eq12000 = AM.bandEqualizer(12e3, 1),
            f.eq65.connect(f.eq125),
            f.eq125.connect(f.eq250),
            f.eq250.connect(f.eq500),
            f.eq500.connect(f.eq1000),
            f.eq1000.connect(f.eq2000),
            f.eq2000.connect(f.eq4000),
            f.eq4000.connect(f.eq6000),
            f.eq6000.connect(f.eq8000),
            f.eq8000.connect(f.eq12000),
            f.cleanup = function() {
                f.eq65.disconnect(),
                f.eq65 = null,
                f.eq125.disconnect(),
                f.eq125 = null,
                f.eq500.disconnect(),
                f.eq500 = null,
                f.eq1000.disconnect(),
                f.eq1000 = null,
                f.eq2000.disconnect(),
                f.eq2000 = null,
                f.eq4000.disconnect(),
                f.eq4000 = null,
                f.eq6000.disconnect(),
                f.eq6000 = null,
                f.eq8000.disconnect(),
                f.eq8000 = null,
                f.eq12000.disconnect(),
                f.eq12000 = null
            }
            ,
            f
        },

        resetEqualizerParameters: function() {
            AM.currentEqualizer = {
                noise: 14e3,
                volume: 0,
                F65: 1,
                F125: 0,
                F250: 0,
                F500: -1,
                F1000: -1,
                F2000: 0,
                F4000: 0,
                F6000: 0,
                F8000: 0,
                F12000: 1
            }
        },

        changeEqualizerParameters: function() {
            AM.echo && (AM.echo.setRatio(AM.currentEqualizer.volume),
            AM.currentEqualizer.noise ? AM.noise.frequency.value = AM.currentEqualizer.noise : (AM.currentEqualizer.noise = 24e3,
            AM.noise.frequency.value = AM.currentEqualizer.noise)),
            AM.equalizer && (AM.equalizer.eq65.gain.value = AM.currentEqualizer.F65,
            AM.equalizer.eq125.gain.value = AM.currentEqualizer.F125,
            AM.equalizer.eq250.gain.value = AM.currentEqualizer.F250,
            AM.equalizer.eq500.gain.value = AM.currentEqualizer.F500,
            AM.equalizer.eq1000.gain.value = AM.currentEqualizer.F1000,
            AM.equalizer.eq2000.gain.value = AM.currentEqualizer.F2000,
            AM.equalizer.eq4000.gain.value = AM.currentEqualizer.F4000,
            AM.equalizer.eq6000.gain.value = AM.currentEqualizer.F6000,
            AM.equalizer.eq8000.gain.value = AM.currentEqualizer.F8000,
            AM.equalizer.eq12000.gain.value = AM.currentEqualizer.F12000)
        },

        init_filters: function(mainOutput) {

            AM.equalizer = AM.createEqualizerNode();
            AM.compressor = AM.createCompressorNode();
            AM.echo = AM.createEchoNode();
            AM.noise = AM.createNoiseNode();

            var cc = {
                compressor: true,
                threshold: -3,
                knee: 30,
                ratio: 12,
                attack: .05,
                release: .08
            };

            AM.compressor.setup(cc.compressor, cc.threshold, cc.knee, cc.ratio, cc.attack, cc.release);


            // out -> comp
            // mainOutput.connect(AM.compressor.input);
            // AM.compressor.output.connect(AM.audio_context.destination);

            // out -> eq -> comp
            // mainOutput.connect(AM.equalizer.eq65);
            // AM.equalizer.eq12000.connect(AM.compressor.input);
            // AM.compressor.output.connect(AM.audio_context.destination);

            // out -> comp -> echo
            // mainOutput.connect(AM.compressor.input);
            // AM.echo.input(AM.compressor.output);
            // AM.echo.output(AM.audio_context.destination);

            // // out -> noise -> comp -> echo
            // mainOutput.connect(AM.noise);
            // AM.noise.connect(AM.compressor.input);
            // AM.echo.input(AM.compressor.output);
            // AM.echo.output(AM.audio_context.destination);

            // out -> noise -> eq -> comp -> echo
            mainOutput.connect(AM.noise);
            AM.noise.connect(AM.equalizer.eq65);
            AM.equalizer.eq12000.connect(AM.compressor.input);
            AM.echo.input(AM.compressor.output);
            AM.echo.output(AM.audio_context.destination);

            AM.resetEqualizerParameters();
            AM.changeEqualizerParameters();
        },

        setUpAudioContext: function(channels, samples) {
            console.info("[AM] setUpAudioContext samples: " + samples + ", channels: " + channels)

            AM.channels = channels;
            AM.samples = samples;
            AM.samples_time = (samples / AM.audio_context.sampleRate);

            AM.spn = AM.audio_context.createScriptProcessor(samples, 0, channels);
            if (AM.filter_enabled) {
                AM.init_filters(AM.spn)
                console.info("[AM] with FILTERS!")
            } else {
                AM.spn.connect(AM.audio_context.destination);
            }

            AM.spn.onaudioprocess = function (ape) {

                if (!api.processHandle) {
                    return;
                }

                api.outputBuffer = ape.outputBuffer;
                api.processHandle()

            }

            AM.audio_context.resume()
            AM.is_driver_opened = true;
        },

        tearDownAudioContext: function() {

            if (AM.spn != undefined) {
                AM.spn.disconnect();
                AM.spn = undefined;
            }

            if (AM.audio_context !== undefined) {
                AM.audio_context.close();
                AM.audio_context = undefined;
            }

            AM.is_driver_opened = false;
        },

        onmessage: function (e) {

            console.info("[muaudio] onmessage: " + e.data.type)

            switch (e.data.type) {
                case "onrequest_audio":
                    AM.bufs = e.data.bufs; //! NOTE Нужно возвратить перемещённые буфера
                    for (var i = 0; i < e.data.replays.length; ++i) {
                        var rep = e.data.replays[i];
                        api.onAudioRequestReceived(rep.id, e.data.syncid, new Uint8Array(e.data.bufs[2 * i]), new Uint8Array(e.data.bufs[2 * i + 1]))
                    }

                break;
                case "rpc":
                    if (api.rpcListen) {
                        api.rpcListen(e.data.id, e.data.method, e.data.args)
                    }
                break;
            }
        },

        requestIndexOf: function(id) {
            for (var i = 0; i < AM.requests.length; ++i) {
                if (AM.requests[i].id == id) {
                    return i;
                }
            }
            return -1;
        },
    }

    var api = {

        isLoaded: false,
        onLoaded: null,
        load: function(soundfontUrl, localPrefix, config) {

            var AContext = window.AudioContext || window.webkitAudioContext;

            AM.audio_context = new AContext({sampleRate: 44100});
            AM.filter_enabled = config.isFilterEnabled;

            var audioUrl = new URL(localPrefix + AUDIO_WASM_JS_URI, window.location) + "";
            var soundfontUrl = new URL(soundfontUrl, window.location) + "";

            AM.worker = new Worker(localPrefix + AUDIO_WORKER_URI);
            AM.worker.onmessage = AM.onmessage;

            console.info("[AM] config: " + JSON.stringify(config))

            AM.worker.postMessage({ type:"setup"
                , importUrl: audioUrl
                , localPrefix: localPrefix
                , sampleRate: AM.audio_context.sampleRate
                , soundfontUrl: soundfontUrl
                , config: config
            });

            setTimeout(function () {

                api.isLoaded = true;
                if (api.onLoaded) {
                    api.onLoaded();
                }

            }, 1)
        },

        outputBuffer: null,
        processHandle: null,

        onDriverOpened: AM.setUpAudioContext,
        onDriverClosed: AM.tearDownAudioContext,

        sampleRate: function() {
            return AM.audio_context.sampleRate;
        },
        audioContextResume: function() {
            AM.audio_context.resume()
        },

        rpcListen: null,
        rpcSend: function(id, method, args_str) {
            AM.worker.postMessage({
                type: "rpc",
                id: id,
                method: method,
                args: args_str
            });
        },

        audioRequestRegister: function(id, samples, nbSamplesPerTimestamp, sizeInBytes, timestampsInBytes) {
            var r = {
                id: id,
                samples: samples,
                nbSamplesPerTimestamp: nbSamplesPerTimestamp,
            };
            AM.requests.push(r);
            AM.bufs.push(new ArrayBuffer(sizeInBytes));
            AM.bufs.push(new ArrayBuffer(timestampsInBytes));
        },

        audioRequestUnregister: function(id) {
            var index = AM.requestIndexOf(id);
            if (index > -1) {
                AM.requests.splice(index, 1);
                AM.bufs.splice(2 *  index, 2);
            }
        },

        onAudioRequestReceived: null,
        audioRequestSend: function(syncId) {
            var msg = { type:"request_audio", requests: AM.requests, bufs: AM.bufs, syncid: syncId };
            AM.worker.postMessage(msg, msg.bufs);
        },

    }

    return api;
})();

export default MuAudioModule;
