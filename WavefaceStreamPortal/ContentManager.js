function ReplayLocator() {
};

ReplayLocator.ruleGen_posPercentage = function() {
  var scrollTop = $(window).scrollTop();
  var documentHeight = $(document).height();
  var windowHeight = $(window).height();
  return { rule: "posPercentage", value: Math.floor(scrollTop  * 100 / (documentHeight - windowHeight)) }
};

ReplayLocator.ruleReplay_posPercentage = function(value) {
  var yPos = $(document).height() * value / 100;
  $(window).scrollTop(yPos);
};


function ContentManager() {
  this._monitorTimer = null;

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
    chrome.extension.sendMessage(null, {msg: "scroll", data: ReplayLocator.ruleGen_posPercentage()});
  };
};

g_contentMgr = new ContentManager();

function contentMsgDispatcher(message, sender, cbSendResp) {
  if (message.msg === "execJs") {
    var retData = eval(message.request);
    if (message.syncCall) {
      cbSendResp({data: retData});
      return true;
    }
  } else if (message.msg === "execContentMgrHandler") {
    var retData = g_contentMgr[message.request]();
    if (message.syncCall) {
      cbSendResp({data: retData});
      return true;
    }
  }
};

chrome.extension.onMessage.addListener(contentMsgDispatcher);
$(document).scroll(g_contentMgr.onScroll);
