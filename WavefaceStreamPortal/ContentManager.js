function ContentManager() {
  this._monitorTimer = null;
  this._isLoaded = false;

  this.enableMonitor = function() {
    if (!this._monitorTimer) {
      this._monitorTimer = setInterval(function() {
        chrome.extension.sendMessage(null, {msg: "heartbeat"});
      }, 1000);
    }
  };

  this.disableMonitor = function() {
    if (this._monitorTimer) {
      clearInterval(this._monitorTimer);
      this._monitorTimer = null;
    }
  };

  this.onScroll = function(e) {
    if (this._isLoaded)
      chrome.extension.sendMessage(null, {msg: "scroll", data: {scrollTop: $(window).scrollTop() }});
  };
}

g_contentMgr = new ContentManager();

function contentMsgDispatcher(message, sender, cbSendResp) {
  var retData;
  if (message.msg === "execJs") {
    retData = eval(message.request);
    if (message.syncCall) {
      cbSendResp({data: retData});
      return true;
    }
  } else if (message.msg === "execContentMgrHandler") {
    retData = g_contentMgr[message.request]();
    if (message.syncCall) {
      cbSendResp({data: retData});
      return true;
    }
  }
 return false;
}

chrome.extension.onMessage.addListener(contentMsgDispatcher);

$(window).load(function() {
  g_contentMgr._isLoaded = true;
  $(document).scroll(g_contentMgr.onScroll.bind(g_contentMgr));
});

