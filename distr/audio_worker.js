
var MuAudio = {
    preRun: [],
    postRun: [],
    print: function(text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.info("[muaudio] " + text);
    },
    printErr: function(text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.error("[muaudio] " + text);
    },
    setStatus: function(text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.info("[muaudio] status: " + text);
    },
    onRuntimeInitialized: function() {
        console.info("[muaudio] onRuntimeInitialized")
        MuAudio.ccall('Init', 'number', ['string', 'string'], [MuAudio.soundfontUrl, JSON.stringify(MuAudio.config)]);
        postMessage({ type:"inited" });
    },

    onLogMessage: function(type, str) {
        var text = "[muaudio] " + str;
        switch(type) {
        case 0: console.error(text); break;
        case 1: console.warn(text); break;
        case 2: console.info(text); break;
        default: console.debug(text); break;
        }
    },

    audio: {
        sampleRate: 44100,
        output: null,
        timestamps: null,
        process_handle: null,

        rpcSend: function(id, method, args_str) {
            postMessage({
                type: "rpc",
                id: id,
                method: method,
                args: args_str
            });
        },
        rpcListen: null,
    },

    socketSend: function(port, args_data, raw_data) {

        postMessage(
            { type:"interbus"
            , port: port
            , args_data: args_data
            , raw_data: raw_data
            }
        );

    },
    socketListen: null, // function(port, args_data, raw_data)
};

onmessage = function (e) {

    switch (e.data.type) {
        case "interbus":
            if (MuAudio.socketListen) {
                MuAudio.socketListen(e.data.port, e.data.args_data, e.data.raw_data);
            }
        break;
        case "setup":
            MuAudio.audio.sampleRate = e.data.sampleRate
            MuAudio.soundfontUrl = e.data.soundfontUrl
            MuAudio.localPrefix = e.data.localPrefix
            MuAudio.config = e.data.config;
            importScripts(e.data.importUrl);
        break;
        case "rpc":
            if (MuAudio.audio.rpcListen) {
                MuAudio.audio.rpcListen(e.data.id, e.data.method, e.data.args)
            }
        break;
        case "request_audio":

            var replays = [];
            for (var i = 0; i < e.data.requests.length; ++i) {
                var req = e.data.requests[i];
                MuAudio.audio.output = e.data.bufs[2 * i];
                MuAudio.audio.timestamps = e.data.bufs[2 * i + 1];
                MuAudio.audio.process_handle(req.id, req.samples, req.nbSamplesPerTimestamp);

                var rep = {
                    id: req.id,
                    time: MuAudio.audio.output_time
                };

                replays.push(rep);
            }

            var msg = {type:"onrequest_audio", bufs: e.data.bufs, replays: replays, syncid: e.data.syncid };
            postMessage(msg, e.data.bufs);

        break
    }

}
