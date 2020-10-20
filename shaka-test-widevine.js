function test() {
    // Set your mpeg dash stream url
    var mpegdashStreamUrl = document.querySelector("input[name='dash-stream-url']").value;

    // Please login to https://admin.drm.technology to generate a vudrm token.
    var vudrmToken = document.querySelector("input[name='vudrm-token']").value;

    console.log("URL: " + mpegdashStreamUrl);
    console.log("TOKEN: " + vudrmToken);

    // Set polyfills required by shaka
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
        // setup the shaka player and attach an error event listener
        var video = document.getElementById("video");
        window.shakaPlayerInstance = new shaka.Player(video);
        window.shakaPlayerInstance.addEventListener("error", onErrorEvent);

        // configure the DRM license servers
        window.shakaPlayerInstance.configure({
            drm: {
                servers: {
                    "com.widevine.alpha": "https://widevine-proxy.drm.technology/proxy",
                }
            }
        });

        // Something special is needed for the widevine license request.
        window.shakaPlayerInstance
            .getNetworkingEngine()
            .registerRequestFilter(function(type, request) {
                // ignore requests that are not license requests.
                if (type != shaka.net.NetworkingEngine.RequestType.LICENSE)
                    return;

                // get the selected drm info and check the key system is widevine.
                var selectedDrmInfo = window.shakaPlayerInstance.drmInfo();
                if (selectedDrmInfo.keySystem === "com.widevine.alpha") {
                    console.log("WIDEVINE");
                    // select the first key id and convert to uppercase as it is hex.
                    console.log("=====================");
                    console.log(selectedDrmInfo);
                    console.log("=====================");
                    var keyId = Array.from(selectedDrmInfo.keyIds)[0].toUpperCase();

                    // create the license request body required by the license server
                    var body = {
                        token: vudrmToken,
                        drm_info: Array.apply(null, new Uint8Array(request.body)),
                        kid: keyId
                    };
                    body = JSON.stringify(body);

                    // set the request body
                    request.body = body;

                    // add the content type header
                    request.headers["Content-Type"] = "application/json";
                }

            });

        // load the mpeg-dash stream into the shaka player
        window.shakaPlayerInstance
            .load(mpegdashStreamUrl)
            .then(function() {
                console.log("The stream has now been loaded!");
            })
            .catch(onError);
    } else {
        console.error(
            "This browser does not have the minimum set of APIs needed for shaka!"
        );
    }
};

function onErrorEvent(event) {
    // Extract the shaka.util.Error object from the event.
    onError(event.detail);
}

function onError(error) {
    document.querySelector('#error').innerHTML = JSON.stringify(error, undefined, 2);
    console.error("Error code", error.code, "object", error);
}

document.querySelector('#test-button').addEventListener('click', () => {
    test();
});
