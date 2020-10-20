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
        var playReadyLaURL =
            "https://playready-license.drm.technology/rightsmanager.asmx?token=" +
            encodeURIComponent(vudrmToken);

        window.shakaPlayerInstance.configure({
            drm: {
                servers: {
                    "com.microsoft.playready": playReadyLaURL
                }
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
