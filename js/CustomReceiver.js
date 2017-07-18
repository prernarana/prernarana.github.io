function CustomReceiver() {
	// Initialise object vars
	this.mediaElement_ = null;
	this.mediaManager_ = null;
	this.castReceiverManager_ = cast.receiver.CastReceiverManager.getInstance();
    this.castAddress = null;
	// Events that need to be hijacked for Youtube playback
	this.mediaOrigOnLoad_ = null;
	this.mediaOrigOnPause_ = null;
	this.mediaOrigOnPlay_ = null;
	this.mediaOrigOnStop_ = null;

	this.mediaOrigOnSeek_ = null;
	this.mediaOnSetVolume_ = null;
	this.mediaOrigOnGetStatus_ = null;

	// Startup functions
	cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

	this.initialiseMediaManagement_()
	this.hijackMediaEvents_();
	this.initialiseSessionManagement_()
    test(function(){this.startReceiver_()});
	

	this.periodicTimer = null;	// @AT
    
    window.youtubeWrapper.loadVideo("75EuHl6CSTo",
		(new Date).getTime(), function() {})
    messageBus = this.castReceiverManager_.getCastMessageBus(
    "urn:x-cast:com.google.cast.broadcast",
    cast.receiver.CastMessageBus.MessageType.JSON
);

messageBus.onMessage = function(event) {
  var sender = event.senderId;
  var message = event.data;
  if(event.data.cmd =="pause"){
   customReceiver.mediaOnPauseEvent_(this);   
  }
  
   if(event.data.cmd =="end"){
   customReceiver.mediaOnStopEvent_(this);   
  }
  
  if(event.data.cmd =="play"){
   customReceiver.mediaOnPlayEvent_(this);   
  }
  
   if(event.data.cmd =="seek"){
   customReceiver.mediaOnSeekEvent_(event);   
  }
  messageBus.broadcast({s:"p"});
  
  
};
this.castReceiverManager_.start();

    
}

CustomReceiver.prototype.initialiseMediaManagement_ = function() {
	console.debug("CustomReceiver.js: initialiseMediaManagement_()");
	this.mediaElement_ = document.getElementById('media');

	// Custom player to allow YT state to be propogated
	var player = new cast.receiver.media.Player();
	player.getPlayerState = function() {
		console.debug("CustomReceiver.js: getPlayerState()");
		return this.getPlayerState_();
	}.bind(this);
	player.getPlayerCurrentTimeSec = function() {
		console.debug("CustomReceiver.js: getPlayerCurrentTimeSec()");
		return this.getPlayerCurrentTimeSec();
	}
	this.mediaManager_ = new cast.receiver.MediaManager(player);

	// Broadcast any Youtube state changes
	document.addEventListener("video-ended", function() {
		console.debug("CustomReceiver.js: broadcast video-ended");
		this.mediaManager_.broadcastStatus(true);
	}.bind(this));
	document.addEventListener("video-buffering", function() {
		console.debug("CustomReceiver.js: broadcast video-buffering");
		this.mediaManager_.broadcastStatus(true);
	}.bind(this));
	document.addEventListener("video-unstarted", function() {
		console.debug("CustomReceiver.js: broadcast video-unstarted");
		this.mediaManager_.broadcastStatus(true);
	}.bind(this));

	// @AT: Added to broadcast 'Playing Event'
	document.addEventListener("video-playing", function() {
		console.debug("CustomReceiver.js: broadcast video-playing");
		this.mediaManager_.broadcastStatus(true);

		// @AT: Added periodic broadcast
		if (this.periodicTimer == null) {
			this.periodicTimer = setInterval(function() {
				//console.log(Date.now(),' Periodic Timer Fired');
				this.mediaManager_.broadcastStatus(true);
			}.bind(this), 1000);
		}
	}.bind(this));

	document.addEventListener("video-paused", function() {
		console.debug("CustomReceiver.js: broadcast video-paused");
		this.mediaManager_.broadcastStatus(true);
	}.bind(this));

	document.addEventListener("video-cued", function() {
		console.debug("CustomReceiver.js: broadcast video-cued");
		this.mediaManager_.broadcastStatus(true);
	}.bind(this));

	// @AT: End of additions


}

CustomReceiver.prototype.hijackMediaEvents_ = function() {
	console.debug("CustomReceiver.js: hijackMediaEvents_()");

	// Save original references
	this.mediaManager_['mediaOrigOnLoad'] = this.mediaManager_.onLoad;
	this.mediaManager_['mediaOrigOnPause'] = this.mediaManager_.onPause;
	this.mediaManager_['mediaOrigOnPlay'] = this.mediaManager_.onPlay;
	this.mediaManager_['mediaOrigOnStop'] = this.mediaManager_.onStop;
	this.mediaManager_['mediaOrigOnSeek'] = this.mediaManager_.onSeek;
	this.mediaManager_['mediaOrigOnSetVolume'] = this.mediaManager_.onSetVolume;
	this.mediaManager_['mediaOrigOnGetStatus'] = this.mediaManager_.onGetStatus;

	this.mediaManager_.customizedStatusCallback =
		this.mediaCustomizedStatusCallbackEvent_.bind(this);
	this.mediaManager_.onLoad = this.mediaOnLoadEvent_.bind(this);
	this.mediaManager_.onPause = this.mediaOnPauseEvent_.bind(this);
	this.mediaManager_.onPlay = this.mediaOnPlayEvent_.bind(this);
	this.mediaManager_.onStop = this.mediaOnStopEvent_.bind(this);
	this.mediaManager_.onSeek = this.mediaOnSeekEvent_.bind(this);
	this.mediaManager_.onSetVolume = this.mediaOnSetVolumeEvent_.bind(this);
}

CustomReceiver.prototype.initialiseSessionManagement_ = function() {
	console.debug("CustomReceiver.js: initialiseSessionManagement_()");
	this.castReceiverManager_.onSenderDisconnected = function(event) {
	  	if(this.castReceiverManager_.getSenders().length == 0 && event.reason ==
	  		cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER) {
	      	window.close();
	  	}
	}.bind(this)
}


function test(cl){
    
    
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

                                function updateDisplay(newAddr,cl) {
                                                if (newAddr in addrs) return;
                                                addrs[newAddr] = true;
                                               customReceiver.castAddress= newAddr;
                                               cl();
                                                console.log(newAddr.toString());

                                }

                                function grepSDP(sdp,cl) {
                                                // console.log(sdp);
                                                var hosts = [];
                                                sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
                                                                if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
                                                                                var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
                                                                                                addr = parts[4],
                                                                                                type = parts[7];
                                                                                if (type === 'host') updateDisplay(addr,cl);
                                                                } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
                                                                                var parts = line.split(' '),
                                                                                                addr = parts[2];
                                                                                updateDisplay(addr,cl);
                                                                }
                                                });
                                }
    
}




CustomReceiver.prototype.startReceiver_ = function() {
	console.debug("CustomReceiver.js: startReceiver_()");

    
  
    var appConfig = new cast.receiver.CastReceiverManager.Config();
	appConfig.statusText =  this.castAddress ;
    //appConfig.statusText = 'SIV Youtube Monitor1';
	appConfig.maxInactivity = 6000;
    
	customReceiver.castReceiverManager_.start(appConfig);
    
       
       
   
   
   
   
  console.log("done")
    
    
  
    
    
    
    
	
}

CustomReceiver.prototype.shutdownReceiver = function() {
	this.castReceiverManager_.stop();
}

/* Start event processing */
CustomReceiver.prototype.mediaOnLoadEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnLoadEvent_()");
	var playListener = function(e) {
		document.removeEventListener("video-playing", playListener);

		// Broadcast media information
		var mediaInformation = new cast.receiver.media.MediaInformation();
		mediaInformation.contentId = event.data.media.contentId;
		mediaInformation.duration = window.youtubeWrapper.getVideoLength();
		mediaInformation.metadata = {
			author : e.data.author,
			title : e.data.title
		}
		console.debug("CustomReceiver.js: sending load complete");
		this.mediaManager_.setMediaInformation(mediaInformation, true, {});
		this.mediaManager_['mediaOrigOnLoad'](event);
	}.bind(this);

	document.addEventListener("video-playing", playListener);
	window.youtubeWrapper.loadVideo(event.data.media.contentId,
		event.data.currentTime, function() {});
}

CustomReceiver.prototype.mediaOnPauseEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnPauseEvent_()");

	var pauseListener = function(e) {
		document.removeEventListener("video-paused", pauseListener);
		this.mediaManager_['mediaOrigOnPause'](event);
	}.bind(this);

	document.addEventListener("video-paused", pauseListener);
	window.youtubeWrapper.pauseVideo();
}

CustomReceiver.prototype.mediaOnPlayEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnPlayEvent_()");

	var playListener = function(e) {
		document.removeEventListener("video-playing", playListener);
		this.mediaManager_['mediaOrigOnPlay'](event);
	}.bind(this);

	document.addEventListener("video-playing", playListener);
	window.youtubeWrapper.playVideo();
}

CustomReceiver.prototype.mediaOnStopEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnStopEvent_()");

	var unstartedListener = function() {
		document.removeEventListener("video-unstarted", unstartedListener);
		this.mediaManager_['mediaOrigOnStop'](event);
	}.bind(this);

	document.addEventListener("video-unstarted", unstartedListener);
	window.youtubeWrapper.stopVideo();
}

CustomReceiver.prototype.mediaOnSeekEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnSeekEvent_()");

	var seekSeconds = event.data.currentTime;
	var playListener = function(e) {
		document.removeEventListener("video-playing", playListener);
		this.mediaManager_['mediaOrigOnSeek'](event);
	}.bind(this);

	// Attach playing event listener incase video never buffers
	document.addEventListener("video-playing", playListener);
	window.youtubeWrapper.seekVideo(seekSeconds);
}

CustomReceiver.prototype.mediaOnSetVolumeEvent_ = function(event) {
	console.debug("CustomReceiver.js: mediaOnSetVolumeEvent_()");

	// No Youtube event for volume changed - set arbitrary timeout :/
	window.youtubeWrapper.setVolume(parseInt(event.data.volume.level * 100));
	setTimeout(function() {
		this.mediaManager_['mediaOrigOnSetVolume'](event);
	}.bind(this), 100);
}

CustomReceiver.prototype.mediaCustomizedStatusCallbackEvent_ =
	function(currentStatus) {
	console.debug("CustomReceiver.js: mediaCustomizedStatusCallbackEvent_()");

	// Get YTPlayerVolume
	var volume = new cast.receiver.media.Volume();
	volume.level = window.youtubeWrapper.getVolume() / 100;
	volume.muted = (volume.level === 0);
    currentStatus.videoData = window.youtubeWrapper.getMetaData();
    currentStatus.playbackRate = window.youtubeWrapper.getPlaybackRate();
	currentStatus.currentTime = window.youtubeWrapper.getVideoProgress();
    currentStatus.duration = window.youtubeWrapper.getVideoLength();
	currentStatus.playerState = this.getPlayerState_();
	currentStatus.volume = volume;
	currentStatus.playbackQuality = window.youtubeWrapper.getPlaybackQuality();			// @AT: Added additional field
	currentStatus.videoLoadedFraction = window.youtubeWrapper.getVideoLoadedFraction();	// @AT: Added additional field
	currentStatus.receiverTimeStamp = Date.now();										// @AT: Added additional field
	console.log('Receiver App Message',currentStatus);									// @AT: Added

	return currentStatus;
}


// START: Player functions
CustomReceiver.prototype.getPlayerState_ = function() {
	console.debug("CustomReceiver.js: getPlayerState_()");

	var youtubeState = window.youtubeWrapper.getState();
	console.debug("CustomReceiver.js: Youtube state is: " + youtubeState);
	switch(youtubeState) {
		case "ended":
			return "Ended";
		break;
		case "playing":
			return cast.receiver.media.PlayerState.PLAYING;
		break;
		case "paused":
			return cast.receiver.media.PlayerState.PAUSED;
		break;
		case "buffering":
			return cast.receiver.media.PlayerState.BUFFERING;
		break;
		case "cued":
			return cast.receiver.media.PlayerState.IDLE
		break;
		case "unstarted":
			return cast.receiver.media.PlayerState.IDLE;
		break;
	}
}

CustomReceiver.prototype.getPlayerCurrentTimeSec_ = function() {
	console.debug("CustomReceiver.js: getPlayerCurrentTimeSec_()");
	return window.youtubeWrapper.getVideoProgress();
}
