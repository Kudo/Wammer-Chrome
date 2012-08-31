function installNotice(downloadUrl) {
  var details = chrome.app.getDetails();
  var prevVersion = localStorage.version;
  if (details.version != prevVersion) {
    if (typeof(prevVersion) === "undefined") {
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

function extMsgDispatcher(message, sender) {
  var tabMgr = g_tabMgrContainer.getById(sender.tab.windowId, sender.tab.id);
  if (!tabMgr) { return; }

  if (message.msg === "heartbeat") {
    tabMgr.onHeartbeat();
  } else if (message.msg === "scroll") {
    tabMgr.onScroll(message.data);
  } else if (message.msg === "openPage") {
    chrome.tabs.create({url: message.url}, function(newTab) {
      var tabMgr = g_tabMgrContainer.get(newTab);
      if (!tabMgr) {
        console.error("callback before new TabManager create. newTab[%o]", newTab);
      } else {
        tabMgr.initReplayLocator = message.replayLocatorData;
      }
    });
  }
  return false;
};

function ActionManager(options) {
  this.wfWebUrl = "__WFLINK__";

  this.options = {
    screenshotFormat: (options && options.screenshotFormat) || "jpeg",
    screenshotQuality: (options && options.screenshotQuality) || 50,
    cloudHeartbeatTheshold: (options && options.cloudHeartbeatTheshold) || 30
  };

  this.geoLocation = {};
  this.isLogon = false;

  this.getGeoLocation = function() {
    console.debug("[Enter] ActionManager.getGeoLocation().");
    navigator.geolocation.getCurrentPosition(function(position) {
      if (position) {
        this.geoLocation.latitude = position.coords.latitude;
        this.geoLocation.longitude = position.coords.longitude;
      }
    }.bind(this));
    console.debug("[Leave] ActionManager.getGeoLocation().");
  };

  this.composeFeedData = function(tabMgr) {
    var feedData = {
      version: 1,
      uri: tabMgr.pageInfo.uri,
      title: tabMgr.pageInfo.title,
      screenshot: tabMgr.pageInfo.screenshot,
      startTime: tabMgr.pageInfo.startTime,
      duration: tabMgr.pageInfo.duration,
      favicon: tabMgr.pageInfo.favicon,
      extInfo: tabMgr.pageInfo.extInfo,
      client: {
        name: "Stream Portal Chrome Extension",
        version: "__VERSION__",
        location: g_actMgr.geoLocation
      }
    };
    return feedData
  };

  this.sendHeartBeat = function(tabMgr) {
    console.debug("[Enter] ActionManager.sendHeartBeat() - tabMgr.key[%s]", tabMgr.key);
    if (typeof(tabMgr.pageInfo.uri) === "undefined") { return; }

    // FIXME: If not logon, should not send heartbeat here but later to consider how to know if user logon automatically?

    var actMgr = this;
    var uri = this.wfWebUrl + "/api";
    var data = {
      feed_data: g_actMgr.composeFeedData(tabMgr)
    };
    console.log("ActionManager.sendHeartBeat() - data[%o]", data);
    var qs = "api=" + encodeURIComponent('/sportal/feed') + "&data=" + encodeURIComponent(JSON.stringify(data));

    var xhr = new XMLHttpRequest();
    xhr.open("POST", uri, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
      if (xhr.status != 200) {
        console.error("ActionManager.sendHeartBeat() - Invalid xhr returned status. xhr.readyState[%d] xhr.status[%d]", xhr.readyState, xhr.status);
        actMgr.isLogon = false;
        actMgr.showWarningBadge();
      } else if (xhr.status == 200) {
        // FIXME: DO NOT send data everytime here
        actMgr.isLogon = true;
        actMgr.showWarningBadge(false);
      }
    };
    xhr.send(qs);


    console.debug("[Leave] ActionManager.sendHeartBeat() - tabMgr.key[%s]", tabMgr.key);
  };

  this.captureScreenshot = function(tabMgr, completeHandler) {
    console.debug("[Enter] ActionManager.captureVisibleTab(). tabMgr.key[%s]", tabMgr.key);
    chrome.tabs.captureVisibleTab(tabMgr.windowId, {
      "format": this.options.screenshotFormat,
      "quality": this.options.screenshotQuality
    }, function(data) {
      if (data) {
        var matchedArray = data.match(/^data:(.+);base64,/);
        if (matchedArray) {
          var mimeType = matchedArray[1];
          var base64Data = data.substr(data.indexOf(",") + 1);
          tabMgr.pageInfo.screenshot = {"mimeType": mimeType, "data": base64Data, "size": base64Data.length};

          if (typeof(completeHandler) === "function") { completeHandler(); }
        }
      }
    });
    console.debug("[Leave] ActionManager.captureVisibleTab(). tabMgr.key[%s]", tabMgr.key);
  };

  this.checkLogon = function() {
    var uri = this.wfWebUrl + "/api";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", uri, false);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    try {
      xhr.send(null);
    } catch(e) {
      console.error("ActionManager.checkLogon() - xhr.send() exception. e[%o]", e);
      this.showWarningBadge();
      return false;
    }

    if (xhr.status == 401) {
      console.warn("ActionManager.checkLogon() - server return 401.");
      this.showWarningBadge();
      return false;
    } else if (xhr.status == 200) {
      this.isLogon = true;
      this.showWarningBadge(false);
      return true;
    } else {
      console.error("ActionManager.checkLogon() - WEB api return invalid status. xhr.status[%d]", xhr.status);
      this.showWarningBadge();
      return false;
    }
  };

  this.showWarningBadge = function(isWarning) {
    isWarning = typeof(isWarning) !== "undefined" ? isWarning : true;
    if (isWarning) {
      chrome.browserAction.setBadgeText({text: "!"});
    } else {
      chrome.browserAction.setBadgeText({text: ""});
    }
  };

  this.onClickBrowserAction = function(chromeTab) {
    var portalUrl = this.wfWebUrl + "/portal/";
    chrome.tabs.create({url: portalUrl});
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
  var tabKey = (tabMgr && tabMgr.key) || null;
  console.debug("[Enter] TabManagerContainer.setActiveTab(). tabKey[%s]", tabKey);
  this._activeTab = tabMgr;
  console.debug("[Leave] TabManagerContainer.setActiveTab(). tabKey[%s]", tabKey);
};

TabManagerContainer.prototype.onTabActivated = function(activeInfo) {
  console.debug("[Enter] TabManagerContainer.onTabActivated(). activeInfo[%o]", activeInfo);
  var origActiveTab = this.getActiveTab();
  if (origActiveTab) {
    origActiveTab.disableMonitor();
  }
  var currActiveTab = this.getById(activeInfo.windowId, activeInfo.tabId);
  if (!currActiveTab) {
    console.warn("TabManagerContainer.onTabActivated() - Unable to find currActiveTab. activeInfo[%o]", activeInfo);
  } else {
    this.setActiveTab(currActiveTab);
    if (typeof(currActiveTab.pageInfo.screenshot) === "undefined" &&
        typeof(currActiveTab.pageInfo.uri) === "string" && currActiveTab.pageInfo.uri.match(/^https?:\/\//)) {
      // Due to Chrome SDK's limitation which can only capture screenshot at current selected tab.
      // If user open tabs in background, we will only be able to capture screenshot lately when user select the tab as foreground.
      // Otherwise, if user never set the tab as foreground, we don't have chance to capture the screenshot.
      g_actMgr.captureScreenshot(currActiveTab, function() {
        g_actMgr.sendHeartBeat(currActiveTab);
      });
    }
    currActiveTab.enableMonitor();
  }
  console.debug("[Leave] TabManagerContainer.onTabActivated(). activeInfo[%o]", activeInfo);
};

TabManagerContainer.prototype.onTabCreated = function(chromeTab) {
  console.debug("[Enter] TabManagerContainer.onTabCreated(). tabId[%s]", chromeTab.id);
  var tabMgr = new TabManager(chromeTab);
  this.add(tabMgr);
  console.debug("[Leave] TabManagerContainer.onTabCreated().");
};

TabManagerContainer.prototype.onTabRemoved = function(tabId) {
  console.debug("[Enter] TabManagerContainer.onTabRemoved(). tabId[%s]", tabId);

  var tabMgr = g_tabMgrContainer.getById(null, tabId);
  if (!tabMgr) { return; }
  g_actMgr.sendHeartBeat(tabMgr);
  this.remove(tabMgr);
  this.setActiveTab(null);

  console.debug("[Leave] TabManagerContainer.onTabRemoved().");
};

TabManagerContainer.prototype.onTabUpdated = function(tabId, changeInfo, chromeTab) {
  console.debug("[Enter] TabManagerContainer.onTabUpdated(). tabId[%s] changeInfo[%o] chromeTab[%o]", tabId, changeInfo, chromeTab);
  if (changeInfo.status === "complete") {
    var tabMgr = this.get(chromeTab);
    if (tabMgr) {
      tabMgr.onPageChanged();
    }

    if (tabMgr.initReplayLocator) {
      console.info("TabManagerContainer.onTabUpdated() - initReplayLocator[%o]", tabMgr.initReplayLocator);
      tabMgr.replayLocation(tabMgr.initReplayLocator);
      delete tabMgr.initReplayLocator;
    }
  }
  console.debug("[Leave] TabManagerContainer.onTabUpdated(). tabId[%s] changeInfo[%o] chromeTab[%o]", tabId, changeInfo, chromeTab);
};



function TabManager(chromeTab) {
  this.windowId = chromeTab.windowId;
  this.tabId = chromeTab.id;
  this.key = mapChromeTabToKey(chromeTab);
  this.pageInfo = {};
};

TabManager.prototype.enableMonitor = function() {
  console.debug("[Enter] TabManager.enableMonitor() - tabMgr.key[%s]", this.key);
  if (typeof(this.pageInfo.uri) === "undefined") { return; }
  this.execContentJsAsync("g_contentMgr.enableMonitor();");
  console.debug("[Leave] TabManager.enableMonitor() - tabMgr.key[%s]", this.key);
};

TabManager.prototype.disableMonitor = function() {
  console.debug("[Enter] TabManager.disableMonitor() - tabMgr.key[%s]", this.key);
  if (typeof(this.pageInfo.uri) === "undefined") { return; }
  this.execContentJsAsync("g_contentMgr.disableMonitor();");
  console.debug("[Leave] TabManager.disableMonitor() - tabMgr.key[%s]", this.key);
};

TabManager.prototype.onHeartbeat = function() {
  console.debug("[Enter] TabManager.onHeartbeat() - tabMgr.key[%s]", this.key);
  this.pageInfo.duration += 1;
  if (this.pageInfo.duration % g_actMgr.options.cloudHeartbeatTheshold == 0) {
    g_actMgr.sendHeartBeat(this);
  }
  console.debug("[Leave] TabManager.onHeartbeat() - tabMgr.key[%s]", this.key);
};

TabManager.prototype.onScroll = function(replayLocatorData) {
  console.debug("[Enter] TabManager.onScroll() - tabMgr.key[%s] replayLocatorData[%o]", this.key, replayLocatorData);
  this.pageInfo.extInfo.replayLocator = replayLocatorData;
  console.debug("[Leave] TabManager.onScroll() - tabMgr.key[%s] replayLocatorData[%o]", this.key, replayLocatorData);
};


TabManager.prototype.onPageChanged = function() {
  console.debug("[Enter] TabManager.onPageChanged() - tabMgr.key[%s]", this.key);
  var tabMgr = this;

  // [0] Save original page's data to cloud
  g_actMgr.sendHeartBeat(tabMgr);

  // [1] Initialize as new page
  tabMgr.pageInfo = {};
  chrome.tabs.get(this.tabId, function(chromeTab) {
    if (!chromeTab.url.match(/^https?:\/\//)) { return; }
    tabMgr.pageInfo.uri = chromeTab.url || "";
    tabMgr.pageInfo.title = chromeTab.title || "";
    tabMgr.pageInfo.favicon = chromeTab.favIconUrl || undefined;
    tabMgr.pageInfo.startTime = new Date().toISOString();
    tabMgr.pageInfo.duration = 0;
    tabMgr.pageInfo.extInfo = { version: 1 };
    g_actMgr.sendHeartBeat(tabMgr);
    
    if (tabMgr === g_tabMgrContainer.getActiveTab()) {
      tabMgr.enableMonitor();

      // FIXME: race condition ? if change to another tab between this two statements?
      g_actMgr.captureScreenshot(tabMgr);
    }
  });
  console.debug("[Leave] TabManager.onPageChanged() - tabMgr.key[%s]", this.key);
};

TabManager.prototype.execContentJsSync = function(request, respHandler) {
  var message = { msg: "execJs", request: request, syncCall: true };
  chrome.tabs.sendMessage(this.tabId, message, respHandler);
};

TabManager.prototype.execContentJsAsync = function(request, completeHandler) {
  chrome.tabs.executeScript(this.tabId, {code: request}, completeHandler);
};

TabManager.prototype.replayLocation = function(replayLocatorData) {
  var message = { msg: "replayLocation", replayLocatorData: replayLocatorData};
  chrome.tabs.sendMessage(this.tabId, message);
};

chrome.extension.onMessage.addListener(extMsgDispatcher);
chrome.browserAction.onClicked.addListener(g_actMgr.onClickBrowserAction.bind(g_actMgr));
chrome.browserAction.setBadgeText({text: ""});

chrome.tabs.onCreated.addListener(g_tabMgrContainer.onTabCreated.bind(g_tabMgrContainer));
chrome.tabs.onRemoved.addListener(g_tabMgrContainer.onTabRemoved.bind(g_tabMgrContainer));
chrome.tabs.onActivated.addListener(g_tabMgrContainer.onTabActivated.bind(g_tabMgrContainer));
chrome.tabs.onUpdated.addListener(g_tabMgrContainer.onTabUpdated.bind(g_tabMgrContainer));
chrome.windows.getAll({ populate: true }, function(windows) {
  for (var iWindow = 0, windowsCount = windows.length; iWindow < windowsCount; ++iWindow) {
    for (var iTab = 0, iTabCount = windows[iWindow].tabs.length; iTab < iTabCount; ++iTab) {
      g_tabMgrContainer.onTabCreated(windows[iWindow].tabs[iTab]);
    }
  }
});

g_actMgr.getGeoLocation();
g_actMgr.checkLogon();
setInterval(g_actMgr.getGeoLocation.bind(g_actMgr), 1800000);
