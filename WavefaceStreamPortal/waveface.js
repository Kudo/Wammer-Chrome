function installNotice(downloadUrl) {
  var details = chrome.app.getDetails();
  var prevVersion = localStorage.version;
  if (details.version != prevVersion) {
    if (typeof prevVersion == 'undefined') {
      console.log("Waveface Extension Installed");
      chrome.tabs.create({url: downloadUrl});
    } else {
      console.log("Waveface Extension Updated");
    }
    localStorage.version = details.version;
  }
};
//installNotice("__WFLINK__/StreamPhotoCollector/welcome");

var g_actMgr = new ActionManager();
var g_tabMgrContainer = new TabManagerContainer();

function init(chromeTab) {
  if (!isValidChromeTab(chromeTab)) { return; }
  var tabMgr = new TabManager(chromeTab);
  g_tabMgrContainer.add(tabMgr);
  chrome.tabs.onActivated.addListener(g_tabMgrContainer.onTabActivated.bind(g_tabMgrContainer));
  chrome.tabs.onUpdated.addListener(tabMgr.onTabUpdated.bind(tabMgr));
};

function extMsgDispatcher(message, sender) {
  i
  var tabMgr = g_tabMgrContainer.getById(sender.tab.windowId, sender.tab.id);
  if (!tabMgr) { return; }
  if (message.msg === "heartbeat") {
    tabMgr.onHeartbeat();
  }
  return false;
};

function isValidChromeTab(chromeTab) {
  if (chromeTab.url.match(/^https?:\/\//)) {
    return true;
  } else {
    return false;
  }
};

function ActionManager(options) {
  this.wfWebUrl = "__WFLINK__";

  this.options = {
    screenshotFormat: (options && options.screenshotFormat) || "png",
    screenshotQuality: (options && options.screenshotQuality) || 50,
  };

  this.injectJs = function(tabMgr, script) {
    chrome.tabs.executeScript(tabMgr.tabId, {code: script}, null);
  };

  this.composeFeedData = function(tabMgr) {
    var feedData = {
      version: 1,
      uri: tabMgr.pageInfo.uri,
      title: tabMgr.pageInfo.title,
      screenshot: tabMgr.pageInfo.screenshot,
      startTime: tabMgr.pageInfo.startTime,
      duration: tabMgr.pageInfo.duration,
    };
    return feedData
  };

  this.sendHeartBeat = function(tabMgr, feedData) {
    var uri = this.wfWebUrl + "/api";
    var data = {
      feed_data: feedData
    };
    var qs = "api=" + encodeURIComponent('/sportal/feed') + "&data=" + JSON.stringify(data);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", uri, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(qs);
  };

  this.captureScreenshot = function(tabMgr) {
    chrome.tabs.captureVisibleTab(tabMgr.windowId, {
      "format": this.options.screenshotFormat,
      "quality": this.options.screenshotQuality
    }, function(data) {
      if (data) {
        var matchedArray = data.match(/^data:(.+);base64,/);
        if (matchedArray) {
          var mimeType = matchedArray[1];
          var base64Data = data.substr(data.indexOf(",") + 1);
          tabMgr.pageInfo.screenshot = {"mimeType": mimeType, "data": base64Data};
        }
      }
    });
  };
};

function mapTabIdToKey(windowId, tabId) {
  return tabId;
};

function mapChromeTabToKey(chromeTab) {
  return mapTabIdToKey(chromeTab.windowId, chromeTab.id);
};

function TabManagerContainer() {
  this._tabContainer = {};
  this._activeTab = null;
};

TabManagerContainer.prototype.add = function(tabMgr) {
  this._tabContainer[tabMgr.key] = tabMgr;
};

TabManagerContainer.prototype.remove = function(tabMgr) {
  var tabKey = tabMgr.key;
  if (tabKey in this._tabContainer) {
    delete this._tabContainer[tabKey];
  }
};

TabManagerContainer.prototype.removeById = function(tabId) {
  if (tabId in this._tabContainer) {
    delete this._tabContainer[tabId];
  }
};

TabManagerContainer.prototype.get = function(chromeTab) {
  var tabKey = mapChromeTabToKey(chromeTab);
  return this._tabContainer[tabKey];
};

TabManagerContainer.prototype.getById = function(windowId, tabId) {
  var tabKey = mapTabIdToKey(windowId, tabId);
  return this._tabContainer[tabKey];
};

TabManagerContainer.prototype.getActiveTab = function() {
  if (this._activeTab) {
    return this._activeTab;
  } else {
    return null;
  }
};

TabManagerContainer.prototype.setActiveTab = function(tabMgr) {
  this._activeTab = tabMgr;
};

TabManagerContainer.prototype.onTabActivated = function(activeInfo) {
  var origActiveTab = this.getActiveTab();
  if (origActiveTab) {
    origActiveTab.disableMonitor();
  }
  var currActiveTab = this.getById(activeInfo.windowId, activeInfo.tabId);
  if (!currActiveTab) {
    var self = this;
    chrome.tabs.get(activeInfo.tabId, function(chromeTab) {
      if (!isValidChromeTab(chromeTab)) { return; }
      var tabMgr = new TabManager(chromeTab);
      self.add(tabMgr);
      self.setActiveTab(tabMgr);
      tabMgr.enableMonitor();
    });
  } else {
    this.setActiveTab(currActiveTab);
    currActiveTab.enableMonitor();
  }
};

TabManagerContainer.prototype.onTabCreated = function(chromeTab) {
  console.trace("[Enter] TabManagerContainer.onTabCreated(). tabId[" + chromeTab.id + "]");
  if (!isValidChromeTab(chromeTab)) { return; }
  var tabMgr = new TabManager(chromeTab);
  this.add(tabMgr);
  console.trace("[Leave] TabManagerContainer.onTabCreated().");
};

TabManagerContainer.prototype.onTabRemoved = function(tabId) {
  console.trace("[Enter] TabManagerContainer.onTabRemoved(). tabId[" + tabId + "]");
  this.remove(tabId);
  console.trace("[Leave] TabManagerContainer.onTabRemoved().");
};

function TabManager(chromeTab) {
  this.windowId = chromeTab.windowId;
  this.tabId = chromeTab.id;
  this.key = mapChromeTabToKey(chromeTab);
  this.pageInfo = {
    uri: "",
    title: "",
    faviconUri: "",
    startTime: null,
    duration: 0,
    screenshot: null
  };
};

TabManager.prototype.enableMonitor = function() {
  var script = "if (typeof(wfPortalTimer) === \"undefined\") { wfPortalTimer  = setInterval(function() {chrome.extension.sendMessage(null, {msg: \"heartbeat\"});}, 1000); }";
  g_actMgr.injectJs(this, script);
};

TabManager.prototype.disableMonitor = function() {
  var script = "if (wfPortalTimer) { clearInterval(wfPortalTimer); delete wfPortalTimer; }";
  g_actMgr.injectJs(this, script);
};

TabManager.prototype.onChromeMessage = function(details) {
};

TabManager.prototype.onHeartbeat = function() {
  this.pageInfo.duration += 1;
  g_actMgr.captureScreenshot(this);
};

TabManager.prototype.onPageChanged = function() {
  var tabMgr = this;
  chrome.tabs.get(this.tabId, function(chromeTab) {
    tabMgr.pageInfo.uri = chromeTab.url || "";
    tabMgr.pageInfo.title = chromeTab.title || "";
    tabMgr.pageInfo.faviconUri = chromeTab.favIconUrl || "";
    tabMgr.pageInfo.startTime = new Date().toISOString();
    tabMgr.pageInfo.duration = 0;
  });
  this.enableMonitor();
};


TabManager.prototype.onTabUpdated = function(tabId, changeInfo, chromeTab) {
  if (!g_tabMgrContainer.get(chromeTab)) { return; }
  if (changeInfo.status === "complete") {
    this.onPageChanged();
  }
};


chrome.browserAction.onClicked.addListener(init);

chrome.extension.onMessage.addListener(extMsgDispatcher);
chrome.tabs.onCreated.addListener(g_tabMgrContainer.onTabCreated.bind(g_tabMgrContainer));
chrome.tabs.onRemoved.addListener(g_tabMgrContainer.onTabRemoved.bind(g_tabMgrContainer));
