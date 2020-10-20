var Utils = {
    uint16ArrayToString: function(array) {
        var uint16Array = new Uint16Array(array.buffer);
        return String.fromCharCode.apply(String, uint16Array);
    },

    stringToUint16Array: function(string) {
        var buffer = new ArrayBuffer(string.length * 2); // 2 bytes for each char
        var array = new Uint16Array(buffer);

        for (var i = 0, strLen = string.length; i < strLen; i++) {
            array[i] = string.charCodeAt(i);
        }

        return array;
    },

    base64EncodeUint8Array: function(input) {
        var keyStr =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;

        var i = 0;
        while (i < input.length) {
            chr1 = input[i++];
            chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
            chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output +=
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
        }

        return output;
    },

    base64DecodeUint8Array: function(input) {
        var raw = window.atob(input);
        var rawLength = raw.length;
        var array = new Uint8Array(new ArrayBuffer(rawLength));

        for (var i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }

        return array;
    },
};

var DRMUtils = {
    extractContentId: function(initData) {
        var laurlAsArray = Utils.uint16ArrayToString(initData).split("/");
        return laurlAsArray[laurlAsArray.length - 1];
    },

    concatInitDataContentIdAndCert: function(initData, contentId, cert) {
        contentId = Utils.stringToUint16Array(contentId);

        var offset = 0;
        var buffer = new ArrayBuffer(
            initData.byteLength + 4 + contentId.byteLength + 4 + cert.byteLength
        );
        var dataView = new DataView(buffer);
        var initDataArray = new Uint8Array(buffer, offset, initData.byteLength);
        initDataArray.set(initData);
        offset += initData.byteLength;

        dataView.setUint32(offset, contentId.byteLength, true);
        offset += 4;

        var contentIdArray = new Uint8Array(
            buffer,
            offset,
            contentId.byteLength
        );
        contentIdArray.set(contentId);

        offset += contentIdArray.byteLength;
        dataView.setUint32(offset, cert.byteLength, true);
        offset += 4;

        var certArray = new Uint8Array(buffer, offset, cert.byteLength);
        certArray.set(cert);

        return new Uint8Array(buffer, 0, buffer.byteLength);
    },

    isFairPlaySupported: function(videoElement, keySystem) {
        return (
            typeof videoElement.webkitKeys != "undefined" &&
            typeof videoElement.webkitSetMediaKeys != "undefined" &&
            typeof WebKitMediaKeys != "undefined" &&
            WebKitMediaKeys.isTypeSupported(keySystem, "video/mp4")
        );
    },
};

function test() {
    // Set your mpeg dash stream url
    var mpegdashStreamUrl = document.querySelector("input[name='dash-stream-url']").value;
    // mpegdashStreamUrl = 'https://d2jl6e4h8300i8.cloudfront.net/drm/BuyDRM/AnimationAudio_4_AAC/500-953-1406-1859/hls/fp/master.m3u8';

    var vudrmToken = document.querySelector("input[name='vudrm-token']").value;
    var contentId = document.querySelector("input[name='content-id']").value;
    // vudrmToken = 'PEtleU9TQXV0aGVudGljYXRpb25YTUw+PERhdGE+PEdlbmVyYXRpb25UaW1lPjIwMTYtMTEtMTkgMDk6MzQ6MDEuOTkyPC9HZW5lcmF0aW9uVGltZT48RXhwaXJhdGlvblRpbWU+MjAyNi0xMS0xOSAwOTozNDowMS45OTI8L0V4cGlyYXRpb25UaW1lPjxVbmlxdWVJZD4wZmZmMTk3YWQzMzQ0ZTMyOWU0MTA0OTIwMmQ5M2VlYzwvVW5pcXVlSWQ+PFJTQVB1YktleUlkPjdlMTE0MDBjN2RjY2QyOWQwMTc0YzY3NDM5N2Q5OWRkPC9SU0FQdWJLZXlJZD48V2lkZXZpbmVQb2xpY3kgZmxfQ2FuUGxheT0idHJ1ZSIgZmxfQ2FuUGVyc2lzdD0iZmFsc2UiIC8+PFdpZGV2aW5lQ29udGVudEtleVNwZWMgVHJhY2tUeXBlPSJIRCI+PFNlY3VyaXR5TGV2ZWw+MTwvU2VjdXJpdHlMZXZlbD48L1dpZGV2aW5lQ29udGVudEtleVNwZWM+PEZhaXJQbGF5UG9saWN5IC8+PExpY2Vuc2UgdHlwZT0ic2ltcGxlIiAvPjwvRGF0YT48U2lnbmF0dXJlPk1sNnhkcU5xc1VNalNuMDdicU8wME15bHhVZUZpeERXSHB5WjhLWElBYlAwOE9nN3dnRUFvMTlYK1c3MDJOdytRdmEzNFR0eDQydTlDUlJPU1NnREQzZTM4aXE1RHREcW9HelcwS2w2a0JLTWxHejhZZGRZOWhNWmpPTGJkNFVkRnJUbmxxU21raC9CWnNjSFljSmdaUm5DcUZIbGI1Y0p0cDU1QjN4QmtxMUREZUEydnJUNEVVcVJiM3YyV1NueUhGeVZqWDhCR3o0ZWFwZmVFeDlxSitKbWI3dUt3VjNqVXN2Y0Fab1ozSHh4QzU3WTlySzRqdk9Wc1I0QUd6UDlCc3pYSXhKd1ZSZEk3RXRoMjhZNXVEQUVZVi9hZXRxdWZiSXIrNVZOaE9yQ2JIVjhrR2praDhHRE43dC9nYWh6OWhVeUdOaXRqY2NCekJvZHRnaXdSUT09PC9TaWduYXR1cmU+PC9LZXlPU0F1dGhlbnRpY2F0aW9uWE1MPg==';
    // Please login to https://admin.drm.technology to generate a vudrm token.

    var urlCert = 'https://fairplay-license.vudrm.tech/certificate';
    console.log("URL: " + mpegdashStreamUrl);
    console.log("Certificate URL: " + urlCert);

    // Set polyfills required by shaka
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
        // setup the shaka player and attach an error event listener
        var video = document.getElementById("video");
        window.shakaPlayerInstance = new shaka.Player(video);
        window.shakaPlayerInstance.addEventListener("error", onErrorEvent);

        window.shakaPlayerInstance.configure({
            drm: {
                servers: {
                    "com.apple.fps.1_0": "https://fairplay-license.vudrm.tech/license",
                }
            }
        });
        // window.shakaPlayerInstance.configure('drm.initDataTransform', (initData, initDataType) => {
        //   if (initDataType != 'skd')
        //     return initData;

        //     document.querySelector('#error').innerHTML += "init data: " + JSON.stringify(initData) + "\n";
        //   // 'initData' is a buffer containing an 'skd://' URL as a UTF-8 string.
        //   const skdUri = shaka.util.StringUtils.fromBytesAutoDetect(initData);
        //     document.querySelector('#error').innerHTML += "skdUri: " + JSON.stringify(skdUri) + "\n";
        //   const contentId = getMyContentId(sdkUri);
        //   const cert = player.drmInfo().serverCertificate;
        //   return shaka.util.FairPlayUtils.initDataTransform(initData, contentId, cert);
        // });
        window.shakaPlayerInstance
            .getNetworkingEngine()
            .registerRequestFilter((type, request) => {
                if (type != shaka.net.NetworkingEngine.RequestType.LICENSE) {
                    return;
                }
                const originalPayload = new Uint8Array(request.body);

                console.log("==========================");
                console.log(originalPayload);
                console.log("==========================");
                const base64Payload =
                    shaka.util.Uint8ArrayUtils.toStandardBase64(originalPayload);
                // request.responseType = 'arraybuffer';
                // request.timeout = 10000;
                request.headers['content-type'] = 'application/json';

                var body = {
                    token: vudrmToken,
                    contentId: contentId,
                    payload: base64Payload,
                };

                var bodyStr = JSON.stringify(body);

                request.body = bodyStr;

                document.querySelector('#error').innerHTML += "request: " + JSON.stringify(request) + "\n";

                // const originalPayload = new Uint8Array(request.body);
                // const base64Payload =
                //     shaka.util.Uint8ArrayUtils.toStandardBase64(originalPayload);
                // const params = 'spc=' + base64Payload;
                // request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                // request.body = shaka.util.StringUtils.toUTF8(encodeURIComponent(params));
            });

        window.shakaPlayerInstance
            .getNetworkingEngine()
            .registerResponseFilter((type, response) => {
                if (type != shaka.net.NetworkingEngine.RequestType.LICENSE) {
                    return;
                }

                document.querySelector('#error').innerHTML += "response: " + JSON.stringify(response) + "\n";
                // let responseText = shaka.util.StringUtils.fromUTF8(response.data);
                // // Trim whitespace.
                // responseText = responseText.trim();

                // // Look for <ckc> wrapper and remove it.
                // if (responseText.substr(0, 5) === '<ckc>' &&
                //     responseText.substr(-6) === '</ckc>') {
                //     responseText = responseText.slice(5, -6);
                // }

                // // Decode the base64-encoded data into the format the browser expects.
                // response.data = shaka.util.Uint8ArrayUtils.fromBase64(responseText).buffer;
            });

        // configure the DRM license servers
        // need url for Fiarplay Streaming certificate
        fetch(urlCert, { headers: { 'x-vudrm-token': vudrmToken }}).then(req => {

            req.arrayBuffer().then(cert => {

                window.shakaPlayerInstance.configure('drm.advanced.com\\.apple\\.fps\\.1_0.serverCertificate',
                                 new Uint8Array(cert));

                // load the mpeg-dash stream into the shaka player
                window.shakaPlayerInstance
                    .load(mpegdashStreamUrl)
                    .then(function() {
                        console.log("The stream has now been loaded!");
                    })
                    .catch(onError);
            });

        });

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
    document.querySelector('#error').innerHTML += "error: " + JSON.stringify(error, undefined, 2) + "\n";
    console.error("Error code", error.code, "object", error);
}

document.querySelector('#test-button').addEventListener('click', () => {
    test();
});
