import MuWasm from "./mumain.js"
import MuAudioModule from "./audio_module.js"

const MU_VERSION = "{{xtzver}}"
const IS_SET_MU_VERSION = MU_VERSION[0] != "{"

var MuApi = (function () {
return (
    function(config, onInited) {

        const DEFAULT_LOCAL_PREFIX = "./distr/"

        if (!config.localPrefix) {
            config.localPrefix = DEFAULT_LOCAL_PREFIX
        }

        if (config.localPrefix[config.localPrefix.length - 1] != "/") {
            config.localPrefix += "/"
        }

        if (IS_SET_MU_VERSION) {
            config.localPrefix += MU_VERSION + "/"
        }

        console.info("[mu] localPrefix: " + config.localPrefix)

        // Main wasm
        var muwasm = MuWasm({
            print(...rest) {
                //muwasm.onLogMessage(2, ...rest)
                console.info(...rest); 
            },
            printErr(...rest) {
                console.error(...rest); 
                //muwasm.onLogMessage(0, ...rest)
            },
            locateFile: function(path, prefix) {
                var file = config.localPrefix + path;
                console.info("[locateFile] config.localPrefix: " + config.localPrefix + ", file: " + file)
                return file
            },
            setStatus: (function () {
                var out = config.status_out
                if (out) out.innerHTML = ''; // clear browser cache
                return function (text) {
                    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
                    console.info("[muapi] [status] " + text);
                    if (out) out.innerHTML = text;
                };
            })(),
            isRuntimeInitialized: false,
            onRuntimeInitialized: function() {
                console.log("[mumain] onRuntimeInitialized")
                muwasm.isRuntimeInitialized = true;
            },
            putBinary: function(buf, func/*(ptr, size)*/) {

                var ar = new Uint8Array(buf);
                var size = ar.length;
                var ptr = this._malloc(size);
                var memory = new Uint8Array(this.HEAPU8.buffer, ptr, size);
                memory.set(ar);

                func(ptr, size)

                this._free(ptr);
            },
            verbose: function(str) {
                if (config.verbose) {
                    console.debug("[mumain] " + str)
                }
            },

            onLogMessage: function(type, str) {
                if (config.onLogMessage) {
                    config.onLogMessage(type, str)
                } else {
                    var text = "[mumain] " + str;
                    switch(type) {
                    case 0: console.error(text); break;
                    case 1: console.warn(text); break;
                    case 2: console.info(text); break;
                    default: console.debug(text); break;
                    }
                }
            },

        // Audio
        audio: MuAudioModule,

        // === Inited ===
        }).then(function(Module) {

            muwasm = Module
            muwasm.isRuntimeInitialized = true;
            console.info("[mumain] Wasm Loaded")
            doInitialize()
        });

        function doInitialize() {

            if (muapi.isInitialized) {
                return;
            }

            if (!muwasm.isRuntimeInitialized) {
                return;
            }

            if (!MuAudioModule.isLoaded) {
                return;
            }

            muapi.initialize(config.canvas, config)
            onInited(muapi)
        }

        function setupAudioModule() {

            MuAudioModule.onLoaded = function() {
                console.info("[muapi] MuAudioModule.onLoaded" )
                doInitialize()
            }

            var aconfig = {
                isBufferedStreamEnabled: config.audio.isBufferedStreamEnabled,
                isLoggingSynthEvents: config.audio.isLoggingSynthEvents
            }

            MuAudioModule.load(config.audio.soundfont_uri, config.localPrefix, aconfig);
        }

        setupAudioModule();

    //! NOTE API -------------------------------
    var muapi = {

        // === Infrastructure ===

        isInitialized: false,
        initialize: function(canvas, config) {

            muwasm.ccall('Initialize', 'number', ['number', 'number', 'number', 'number', 'string']
            , [0, 0, 0, config.verbose, MU_VERSION]);

            muwasm.setStatus("Inited")

            muapi.update()

            muapi.isInitialized = true;
        },

        _animationId: null,
        update: function() {

            muwasm.ccall('Update')
            this._animationId = window.requestAnimationFrame(this.update.bind(this))
        },

        // === Audio ===
        play: function() {
           MuAudioModule.audioContextResume()
           muwasm.ccall('Play')
        },
        pause: function() { muwasm.ccall('Pause'); },
        stop: function() { muwasm.ccall('Stop'); },
        setPlayPositionByTime: function(sec) { muwasm.ccall('SetPlayPositionByTime', '', ['number'], [sec]); },
    };

    console.image = function(url, scale) {
        scale = scale || 1;
        var img = new Image();

        img.onload = function() {
            var dim = getBox(this.width * scale, this.height * scale);
            console.log("%c" + dim.string, dim.style + "background: url(" + url + "); background-size: " + (this.width * scale) + "px " + (this.height * scale) + "px; color: transparent;");
        };

        img.src = url;
    };

    return muapi

    }
);
})();

export default MuApi;


