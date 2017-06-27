function CustomReceiver() {
	// Initialise object vars
	this.mediaElement_ = null;
	this.mediaManager_ = null;
	this.castReceiverManager_ = cast.receiver.CastReceiverManager.getInstance();

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
	this.startReceiver_();

	this.periodicTimer = null;	// @AT
    
    
    messageBus = this.castReceiverManager_.getCastMessageBus(
    "urn:x-cast:com.google.cast.broadcast",
    cast.receiver.CastMessageBus.MessageType.JSON
);

messageBus.onMessage = function(event) {
  var sender = event.senderId;
  var message = event.data;
  if(event.data.cmd =="pause"){
   this.mediaOnPauseEvent_(this);   
  }
  messageBus.send(sender, "p");
  
  
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

CustomReceiver.prototype.startReceiver_ = function() {
	console.debug("CustomReceiver.js: startReceiver_()");

	var appConfig = new cast.receiver.CastReceiverManager.Config();
	appConfig.statusText = 'SIV Youtube Monitor';
	appConfig.maxInactivity = 6000;
	this.castReceiverManager_.start(appConfig);
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

	currentStatus.currentTime = window.youtubeWrapper.getVideoProgress();
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
			return cast.receiver.media.PlayerState.IDLE;
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
