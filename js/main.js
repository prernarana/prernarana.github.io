window.onload = function() {
	var DEBUG = false;

	// Turn off logging when not in debugging
	if(!DEBUG) {
		//console.log = function() {}	// @AT
		console.debug = function() {}
		console.info = function() {}
	}

	// Load classes
	window.ui = new UI(document.body);
	window.youtubeWrapper = new YoutubeWrapper(
		document.getElementById("ytplayer"));

	// Switch to idle state when window loads
	window.ui.switchToState("idle");

	// Load tests or receiver code depending on environment
    
    
    function test(){
    
    
     var rtc = new RTCPeerConnection({iceServers:[]});
                                if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
                                                rtc.createDataChannel('', {reliable:false});
                                };

                                rtc.onicecandidate = function (evt) {
                                                // convert the candidate to SDP so we can run it through our general parser
                                                // console.log('onicecandidate: ',evt);
                                                if (evt.candidate) grepSDP("a="+evt.candidate.candidate,cl);
                                };
                                rtc.createOffer(function (offerDesc) {
                                                grepSDP(offerDesc.sdp);
                                                rtc.setLocalDescription(offerDesc);
                                }, function (e) { console.warn("offer failed", e); });


                                var addrs = Object.create(null);
                                addrs["0.0.0.0"] = false;

                                setTimeout(function () {
                                                if (Object.keys(addrs).length == 1) {
                                                    test();
                                                                console.log('No address configured');
                                                }
                                                }, 1000);

                                function updateDisplay(newAddr) {
                                                if (newAddr in addrs) return;
                                                addrs[newAddr] = true;
                                               customReceiver.castAddress= newAddr;
                                                console.log(newAddr.toString());
                                                if(navigator.userAgent.indexOf("armv7l") === -1) {
		window.e2eTests = new E2ETests();
		window.e2eTests.runTests();
	} else {
		window.customReceiver = new CustomReceiver();
	}
                                               

                                }

                                function grepSDP(sdp) {
                                                // console.log(sdp);
                                                var hosts = [];
                                                sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
                                                                if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
                                                                                var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
                                                                                                addr = parts[4],
                                                                                                type = parts[7];
                                                                                if (type === 'host') updateDisplay(addr);
                                                                } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
                                                                                var parts = line.split(' '),
                                                                                                addr = parts[2];
                                                                                updateDisplay(addr);
                                                                }
                                                });
                                }
    
}


    
    
    
    
    
    
	
}