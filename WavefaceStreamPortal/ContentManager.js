/*
function ReplayLocator() {
}

ReplayLocator.ruleGen_posPercentage = function() {
  // There was an issue in jQuery 1.8, https://github.com/jquery/jquery/pull/764
  // So we use window.innerHeight here
  //var windowHeight = $(window).height();
  var windowHeight = window.innerHeight;

  var scrollTop = $(window).scrollTop();
  var documentHeight = $(document).height();
  return { rule: "posPercentage", value: Math.floor(scrollTop  * 100 / (documentHeight - windowHeight)) };
};

ReplayLocator.ruleReplay_posPercentage = function(value) {
  return ($(document).height() * value / 100);
};

ReplayLocator.replayWithRules = function(replayLocatorData) {
  var yPos = 0;

  // [0] Match yPos from all rules' handler
  for (var iRule = 0, ruleCount = replayLocatorData.length; iRule < ruleCount; ++iRule) {
    var ruleData = replayLocatorData[iRule];
    var handler = ReplayLocator["ruleReplay_" + ruleData.rule];
    if (typeof(handler) === "function") {
      yPos = handler(ruleData.value);
    }
  }

  // [1] Do scrolling
  if (yPos > 0)
    $("html,body").animate({scrollTop: yPos});
};

ReplayLocator.generateRules = function() {
  var replayLocatorData = [];

  // TODO: Currently we only implement posPercentage locator, add more locators such as XPath or RegExp later.
  replayLocatorData.push(ReplayLocator.ruleGen_posPercentage());

  return replayLocatorData;
};
*/




function ContentManager() {
  this._monitorTimer = null;
  //this._replayDialogTimer = null;
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

  /*
  this.onScroll = function(e) {
    // [0] Remove replay dialog
    if (this._replayDialog)
      this._replayDialog.remove();
    if (this._replayDialogTimer) {
      clearTimeout(this._replayDialogTimer);
      this._replayDialogTimer = null;
    }

    // [1] Send scrolling event to background
    if (this._isLoaded)
      chrome.extension.sendMessage(null, {msg: "scroll", data: ReplayLocator.generateRules() });
  };
  */
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
  }/* else if (message.msg === "replayLocation") {
    g_contentMgr._replayDialog = $('<div id="dkcgmhmeeaalogijmpcjnfiphgpicbfa_replayDialog">' +
        '<div>' +
        '<p"><span>' + chrome.i18n.getMessage("replayDialog_desc") + '</span>' +
        '<a class="btn btn-small btn-success" id="wf_replayLocator_yes" href="#">' + chrome.i18n.getMessage("replayDialog_btn_go") + '</a>' +
        '<a class="btn btn-small btn-inverse" id="wf_replayLocator_no" href="#">' + chrome.i18n.getMessage("replayDialog_btn_cancel") + '</a>' +
        '</p></div></div>');
    g_contentMgr._replayDialog.appendTo("body");
    g_contentMgr._replayDialogTimer = setTimeout(function() {
      //ReplayLocator.replayWithRules(message.replayLocatorData);
      g_contentMgr._replayDialog.remove();
      g_contentMgr._replayDialogTimer = null;
    }, 5000);
    g_contentMgr._replayDialog.find("#wf_replayLocator_yes").click(function(e) {
      e.preventDefault();
      ReplayLocator.replayWithRules(message.replayLocatorData);
      g_contentMgr._replayDialog.remove();
      clearTimeout(g_contentMgr._replayDialogTimer);
      g_contentMgr._replayDialogTimer = null;
    });
    g_contentMgr._replayDialog.find("#wf_replayLocator_no").click(function(e) {
      e.preventDefault();
      g_contentMgr._replayDialog.remove();
      clearTimeout(g_contentMgr._replayDialogTimer);
      g_contentMgr._replayDialogTimer = null;
    });

    //ReplayLocator.replayWithRules(message.replayLocatorData);
  }
  */
 return false;
}

chrome.extension.onMessage.addListener(contentMsgDispatcher);

$(document).ready(function() {
  chrome.extension.sendMessage(null, {msg: "pageOnDomContentLoaded"});
  $(window).on("hashchange", function(e) {
    chrome.extension.sendMessage(null, {msg: "pageOnHashChange", data: e.target.location.href});
  });
});

$(window).load(function() {
  g_contentMgr._isLoaded = true;
  chrome.extension.sendMessage(null, {msg: "pageOnLoad"});
  //$(document).scroll(g_contentMgr.onScroll.bind(g_contentMgr));
});

