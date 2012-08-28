function ContentManager() {
  this._monitorTimer = null;

  this.enableMonitor = function() {
    if (!this._monitorTimer) {
      setInterval(function() {
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
};

g_contentMgr = new ContentManager();

function contentMsgDispatcher(message, sender, cbSendResp) {
  if (message.msg === "getInfo") {
    var request = message.request;
    var retData = null;
    if (typeof(request.dom) !== "undefined") {
      retData = eval(request.dom);
    } else if (typeof(request.contentMgrHandler) !== "undefined") {
      retData = g_contentMgr[request.contentMgrHandler]();
    }
    cbSendResp({data: retData});
    return true;
  } else if (message.msg === "setInfo") {
    // TODO:
  }
};

chrome.extension.onMessage.addListener(contentMsgDispatcher);
