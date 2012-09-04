function ReplayLocator() {
};

ReplayLocator.ruleGen_posPercentage = function() {
  // There was an issue in jQuery 1.8, https://github.com/jquery/jquery/pull/764
  // So we use window.innerHeight here
  //var windowHeight = $(window).height();
  var windowHeight = window.innerHeight;

  var scrollTop = $(window).scrollTop();
  var documentHeight = $(document).height();
  return { rule: "posPercentage", value: Math.floor(scrollTop  * 100 / (documentHeight - windowHeight)) }
};

ReplayLocator.ruleReplay_posPercentage = function(value) {
  var yPos = $(document).height() * value / 100;
  $(window).scrollTop(yPos);
};

ReplayLocator.replayWithRules = function(replayLocatorData) {
  for (var iRule = 0, ruleCount = replayLocatorData.length; iRule < ruleCount; ++iRule) {
    var ruleData = replayLocatorData[iRule];
    var handler = ReplayLocator["ruleReplay_" + ruleData.rule];
    if (typeof(handler) === "function") {
      handler(ruleData.value);
    }
  }
};

ReplayLocator.generateRules = function() {
  var replayLocatorData = [];

  // TODO: Currently we only implement posPercentage locator, add more locators such as XPath or RegExp later.
  replayLocatorData.push(ReplayLocator.ruleGen_posPercentage());

  return replayLocatorData;
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
    chrome.extension.sendMessage(null, {msg: "scroll", data: ReplayLocator.generateRules() });
  };

  this.showReplayDialog = function(e) {
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
  } else if (message.msg === "replayLocation") {
    ReplayLocator.replayWithRules(message.replayLocatorData);
  }
};

chrome.extension.onMessage.addListener(contentMsgDispatcher);

$(document).ready(function() {
  chrome.extension.sendMessage(null, {msg: "pageOnDomContentLoaded"});
});

$(window).load(function() {
  chrome.extension.sendMessage(null, {msg: "pageOnLoad"});
  $(document).scroll(g_contentMgr.onScroll);
});

