var g_actMgr = new ActionManager();
var g_tabMgrContainer = new TabManagerContainer();

function extMsgDispatcher(message, sender, cbSendResp) {
  var tabMgr = g_tabMgrContainer.getById(sender.tab.windowId, sender.tab.id);
  if (!tabMgr) { return false; }

  if (message.msg === "heartbeat") {
    tabMgr.onHeartbeat();
  } else if (message.msg === "scroll") {
    tabMgr.onScroll(message.data);
  } else if (message.msg === "captureScreenshot") {
    if (tabMgr === g_tabMgrContainer.getActiveTab()) {
      // FIXME: race condition ? if change to another tab between this two statements?
      g_actMgr.captureScreenshot(tabMgr);
    }
  } else if (message.msg === "checkShowHistDialog") {
    cbSendResp(g_actMgr.checkShowHistDialog());
    return true;
  } else if (message.msg === "importHistory") {
    var histExporter = new HistoryExporter();
    histExporter.exportAll(tabMgr.tabId);
  }

  return false;
}

function ActionManager(options) {
  this.options = {
    screenshotFormat: (options && options.screenshotFormat) || "jpeg",
    screenshotQuality: (options && options.screenshotQuality) || 50,
    collectTheshold: (options && options.collectTheshold) || g_WfSettings.collectTheshold
  };

  this.geoLocation = {};

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
      //startTime: tabMgr.pageInfo.startTime,
      favicon: tabMgr.pageInfo.favicon,
      //extInfo: tabMgr.pageInfo.extInfo,
      referrer: tabMgr.pageInfo.prevUri,
      client: {
        name: g_WfSettings.extName,
        version: g_WfSettings.extVersion,
        location: g_actMgr.geoLocation
      }
    };
    if (tabMgr.pageInfo.screenshots) {
      feedData.screenshots = tabMgr.pageInfo.screenshots;

      tabMgr.pageInfo.screenshots = null;   // Set as null to prevent sending screenshot many times.
    }

    return feedData;
  };

  this.sendHeartBeat = function(tabMgr) {
    console.debug("[Enter] ActionManager.sendHeartBeat() - tabMgr.key[%s]", tabMgr.key);

    if (typeof(tabMgr.pageInfo.uri) === "undefined") { return; }
    if (!localStorage.sessionToken) { return; }
    if (this.isBlacklistUri(tabMgr.pageInfo.uri)) { return; }

    // FIXME: If not logon, should not send heartbeat here but later to consider how to know if user logon automatically?

    var actMgr = this;
    var url = g_WfSettings.apiUrl + "sportal/feed";
    var data = {
      apikey: g_WfSettings.apiKey,
      session_token: localStorage.sessionToken,
      feed_data: JSON.stringify(g_actMgr.composeFeedData(tabMgr))
    };
    console.debug("ActionManager.sendHeartBeat() - data[%o]", data);
    $.post(url, data).success(function(obj) {
        tabMgr.pageInfo._isFeedSent = true;
      }).error(function(jqXHR) {
        console.error("ActionManager.sendHeartBeat() - jqXHR return error - jqXHR.responseText[%s]", jqXHR.responseText);
        actMgr.showWarningBadge();
      });

    console.debug("[Leave] ActionManager.sendHeartBeat() - tabMgr.key[%s]", tabMgr.key);
  };

  this.sendReferrerTrack = function(tabMgr, uri, completeHandler) {
    console.debug("[Enter] ActionManager.sendReferrerTrack() - tabMgr.key[%s] uri[%s]", tabMgr.key, uri);

    if (typeof(tabMgr.pageInfo.uri) === "undefined") { return; }
    if (!localStorage.sessionToken) { return; }
    if (this.isBlacklistUri(tabMgr.pageInfo.uri)) { return; }

    var _uri;
    if (typeof(uri) === "undefined") {
      _uri = tabMgr.pageInfo.uri;
    } else {
      _uri = uri;
    }

    var actMgr = this;
    var trackUrl = g_WfSettings.apiUrl + "sportal/track";
    var feedData = {
      uri: _uri
    };
    if (tabMgr._referrerId) {
      feedData.referrerId = tabMgr._referrerId;
    }
    var data = {
      apikey: g_WfSettings.apiKey,
      session_token: localStorage.sessionToken,
      feed_data: JSON.stringify(feedData)
    };

    console.debug("ActionManager.sendReferrerTrack() - data[%o]", data);
    $.post(trackUrl, data).success(function(obj) {
        if (obj.referrerId) {
          tabMgr._referrerId = obj.referrerId;
        }
        if (typeof(completeHandler) === "function") { completeHandler(); }
      }).error(function(jqXHR) {
        console.error("ActionManager.sendReferrerTrack() - jqXHR return error - jqXHR.responseText[%s]", jqXHR.responseText);
        actMgr.showWarningBadge();
      });

    console.debug("[Leave] ActionManager.sendReferrerTrack() - tabMgr.key[%s] uri[%s]", tabMgr.key, uri);
  };

  this.captureScreenshot = function(tabMgr, capturePos, completeHandler) {
    console.debug("[Enter] ActionManager.captureScreenshot(). tabMgr.key[%s] capturePos[%s]", tabMgr.key, capturePos);
    if (tabMgr.pageInfo.screenshots === null) {
      return;
    }
    capturePos = capturePos || "head";

    chrome.tabs.captureVisibleTab(tabMgr.windowId, {
      "format": this.options.screenshotFormat,
      "quality": this.options.screenshotQuality
    }, function(data) {
      if (data) {
        var matchedArray = data.match(/^data:(.+);base64,/);
        if (matchedArray) {
          var mimeType = matchedArray[1];
          var base64Data = data.substr(data.indexOf(",") + 1);

          if (typeof(tabMgr.pageInfo.screenshots) === "undefined") {
            tabMgr.pageInfo.screenshots = [];
          }

          tabMgr.pageInfo.screenshots.push({
            "mimeType": mimeType,
            "data": base64Data,
            "size": base64Data.length,
            "position": capturePos
          });

          if (typeof(completeHandler) === "function") { completeHandler(); }
        }
      }
    });
    console.debug("[Leave] ActionManager.captureScreenshot(). tabMgr.key[%s] capturePos[%s]", tabMgr.key, capturePos);
  };

  this.checkLogon = function() {
    if (localStorage.sessionToken) {
      if (WfIsSessionTokenValid(localStorage.sessionToken)) {
        this.showWarningBadge(false);
        return true;
      } else {
        delete localStorage.sessionToken;
      }
    }
    this.showWarningBadge();
    return false;
  };


  this.showWarningBadge = function(isWarning) {
    isWarning = typeof(isWarning) !== "undefined" ? isWarning : true;
    if (isWarning) {
      chrome.browserAction.setBadgeText({text: "!"});
    } else {
      chrome.browserAction.setBadgeText({text: ""});
    }
  };

  this.isBlacklistUri = function(uri) {
    // [0] Exclude waveface.com
    var escapedLink = g_WfSettings.webUrl.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    var re = new RegExp(escapedLink, "g");
    if (uri.match(re)) {
      return true;
    }
    return false;
  };

  this.checkShowHistDialog = function() {
    if (!localStorage.isShowHistDialog) {
      localStorage.isShowHistDialog = true;
      return true;
    }
    return false;
  };
}

function mapTabIdToKey(windowId, tabId) {
  return tabId;
}

function mapChromeTabToKey(chromeTab) {
  return mapTabIdToKey(chromeTab.windowId, chromeTab.id);
}

function TabManagerContainer() {
  this._tabContainer = {};
  this._activeTab = null;

  var tabMgrContainer = this;
  chrome.windows.getCurrent(null, function(chromeWindow) {
    tabMgrContainer._focusedWindowId = chromeWindow.id;
  });
}

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

TabManagerContainer.prototype.onTabWindowAttached = function(tabId, attachInfo) {
  console.debug("[Enter] TabManagerContainer.onTabWindowAttached(). tabId[%d] attachInfo[%o]", tabId, attachInfo);

  var tabMgr = g_tabMgrContainer.getById(null, tabId);
  if (!tabMgr) { return; }
  tabMgr.windowId = attachInfo.newWindowId;
  tabMgr.key = mapTabIdToKey(tabMgr.windowId, tabId);

  console.debug("[Leave] TabManagerContainer.onTabWindowAttached(). tabId[%d] attachInfo[%o]", tabId, attachInfo);
};

TabManagerContainer.prototype.onTabActivated = function(activeInfo) {
  console.debug("[Enter] TabManagerContainer.onTabActivated(). activeInfo[%o]", activeInfo);

  this.updateActiveTab();

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
  if (tabMgr === g_tabMgrContainer.getActiveTab()) {
    this.setActiveTab(null);
  }
  this.remove(tabMgr);

  console.debug("[Leave] TabManagerContainer.onTabRemoved().");
};

TabManagerContainer.prototype.onTabUpdated = function(tabId, changeInfo, chromeTab) {
  console.debug("[Enter] TabManagerContainer.onTabUpdated(). tabId[%s] changeInfo[%o] chromeTab[%o]", tabId, changeInfo, chromeTab);
  var tabMgr = this.get(chromeTab);
  if (!tabMgr) { return; }
  if (changeInfo.status === "loading") {
    tabMgr.onPageLoading();
  } else if (changeInfo.status === "complete") {
    tabMgr.onPageLoad();
  }
  console.debug("[Leave] TabManagerContainer.onTabUpdated(). tabId[%s] changeInfo[%o] chromeTab[%o]", tabId, changeInfo, chromeTab);
};

TabManagerContainer.prototype.onWindowFocusChanged = function(windowId) {
  console.debug("[Enter] TabManagerContainer.onWindowFocusChanged(). windowId[%d]", windowId);

  this._focusedWindowId = windowId;
  this.updateActiveTab();

  console.debug("[Leave] TabManagerContainer.onWindowFocusChanged(). windowId[%d]", windowId);
};

TabManagerContainer.prototype.updateActiveTab = function() {
  console.debug("[Enter] TabManagerContainer.updateActiveTab().");

  var tabMgrContainer = this;

  // [0] Disable old active tab's monitor
  var origActiveTab = tabMgrContainer.getActiveTab();
  if (origActiveTab) {
    origActiveTab.disableMonitor();
  }

  // [1] Handle new active tab
  if (tabMgrContainer._focusedWindowId === chrome.windows.WINDOW_ID_NONE) {
    tabMgrContainer.setActiveTab(null);
  } else {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length <= 0) {
        console.warn("TabManagerContainer.updateActiveTab() - Unable to find current active tab.");
        return;
      }
      var currActiveTab = tabMgrContainer.get(tabs[0]);
      if (!currActiveTab) {
        console.warn("TabManagerContainer.updateActiveTab() - Unable to find current active tab. tabs[0][%o]", tabs[0]);
        return;
      }

      // [1-0] Set active tab
      tabMgrContainer.setActiveTab(currActiveTab);

      // [1-1] Capture screenshot if not captured before
      if (typeof(currActiveTab.pageInfo.screenshots) === "undefined" &&
          typeof(currActiveTab.pageInfo.uri) === "string" && currActiveTab.pageInfo.uri.match(/^https?:\/\//)) {
        // Due to Chrome SDK's limitation which can only capture screenshot at current selected tab.
        // If user open tabs in background, we will only be able to capture screenshot lately when user select the tab as foreground.
        // Otherwise, if user never set the tab as foreground, we don't have chance to capture the screenshot.
        //
        g_actMgr.captureScreenshot(currActiveTab, "head");
      }

      // [1-2] Enable monitor
      if (!currActiveTab.pageInfo._isFeedSent) {
        currActiveTab.enableMonitor();
      }
    });
  }

  console.debug("[Leave] TabManagerContainer.updateActiveTab().");
};


function TabManager(chromeTab) {
  this.windowId = chromeTab.windowId;
  this.tabId = chromeTab.id;
  this.key = mapChromeTabToKey(chromeTab);
  this.pageInfo = {};
}

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
  this.pageInfo.duration.page += 1;
  if (this.pageInfo._isScrolled) {
    this.pageInfo.duration.fixedPos += 1;
  }
  this.sendFeed();
  console.debug("[Leave] TabManager.onHeartbeat() - tabMgr.key[%s]", this.key);
};

TabManager.prototype.onScroll = function(scrollData) {
  console.debug("[Enter] TabManager.onScroll() - tabMgr.key[%s] scrollData[%o]", this.key, scrollData);
  var scrollTop = scrollData.scrollTop;
  if (this._scrollTop !== scrollTop) {
    this._scrollTop = scrollTop;
    this.pageInfo.duration.fixedPos = 0;
  }
  this.pageInfo._isScrolled = true;
  console.debug("[Leave] TabManager.onScroll() - tabMgr.key[%s] scrollData[%o]", this.key, scrollData);
};

TabManager.prototype.onPageLoading = function() {
  console.debug("[Enter] TabManager.onPageLoading() - tabMgr.key[%s]", this.key);

  var tabMgr = this;

  // [0] Initialize as new page
  if (typeof(tabMgr.pageInfo) === "undefined") {
    tabMgr.pageInfo = {};
  }

  chrome.tabs.get(this.tabId, function(chromeTab) {
    var isNewTab = true;

    if (!chromeTab.url.match(/^https?:\/\//)) {
      return;
    }

    if (tabMgr.pageInfo.uri) {
      isNewTab = false;
    }

    tabMgr.pageInfo.uri = chromeTab.url || "";
    tabMgr.pageInfo.title = chromeTab.title || "";
    tabMgr.pageInfo.startTime = new Date().toISOString();
    tabMgr.pageInfo.duration = {host: 0, page: 0, fixedPos: 0};
    tabMgr.pageInfo.extInfo = { version: 1 };
    tabMgr.pageInfo._isFeedSent = false;
    tabMgr.pageInfo._isScrolled = false;
    if (typeof(tabMgr.pageInfo.screenshots) !== "undefined") {
      delete tabMgr.pageInfo.screenshots;
    }

    var _sendReferrerTrack = function(tabMgr) {
      if (!tabMgr._referrerId && tabMgr.pageInfo.prevUri) {
        // For new tab case, we should still need to track referrer url.
        // Code logic may be confused due to we reuse sendReferrerTrack().
        g_actMgr.sendReferrerTrack(tabMgr, tabMgr.pageInfo.prevUri, function() {
          g_actMgr.sendReferrerTrack(tabMgr);
        });
      } else {
        g_actMgr.sendReferrerTrack(tabMgr);
      }
    };

    tabMgr.pageInfo.prevUri = "";
    if (!isNewTab) {
      tabMgr.pageInfo.prevUri = tabMgr.pageInfo.uri;
      _sendReferrerTrack(tabMgr);
    } else if (typeof(chromeTab.openerTabId) !== "undefined") {
      chrome.tabs.get(chromeTab.openerTabId, function(openerChromeTab) {
        if (!openerChromeTab.url.match(/^https?:\/\//)) { return; }
        tabMgr.pageInfo.prevUri = openerChromeTab.url || "";
        _sendReferrerTrack(tabMgr);
      });
    }

  });

  console.debug("[Leave] TabManager.onPageLoading() - tabMgr.key[%s]", this.key);
};

TabManager.prototype.onPageLoad = function() {
  console.debug("[Enter] TabManager.onPageLoad() - tabMgr.key[%s]", this.key);

  var tabMgr = this;
  chrome.tabs.get(tabMgr.tabId, function(chromeTab) {
    if (!chromeTab.url.match(/^https?:\/\//)) {
      return;
    }

    tabMgr.pageInfo.favicon = chromeTab.favIconUrl || undefined;

    if (tabMgr === g_tabMgrContainer.getActiveTab()) {
      tabMgr.enableMonitor();

      // FIXME: race condition ? if change to another tab between this two statements?
      g_actMgr.captureScreenshot(tabMgr, "head");
    }
  });

  console.debug("[Leave] TabManager.onPageLoad() - tabMgr.key[%s]", this.key);
};

TabManager.prototype.execContentJsSync = function(request, respHandler) {
  var message = { msg: "execJs", request: request, syncCall: true };
  chrome.tabs.sendMessage(this.tabId, message, respHandler);
};

TabManager.prototype.execContentJsAsync = function(request, completeHandler) {
  chrome.tabs.executeScript(this.tabId, {code: request}, completeHandler);
};

TabManager.prototype.sendFeed = function() {
  console.debug("[Enter] TabManager.sendFeed() - tabMgr.key[%s]", this.key);
  console.debug("duration[%o]", this.pageInfo.duration);
  if (this.pageInfo.duration.page > g_actMgr.options.collectTheshold.page &&
     this.pageInfo.duration.fixedPos > g_actMgr.options.collectTheshold.fixedPos)
  {
    var tabMgr = this;
    g_actMgr.captureScreenshot(tabMgr, "fixedPos", function() {
      g_actMgr.sendHeartBeat(tabMgr);
      tabMgr.disableMonitor();
    });
  }
  console.debug("[Leave] TabManager.sendFeed() - tabMgr.key[%s]", this.key);
};


chrome.extension.onMessage.addListener(extMsgDispatcher);
chrome.browserAction.setBadgeText({text: ""});

chrome.tabs.onCreated.addListener(g_tabMgrContainer.onTabCreated.bind(g_tabMgrContainer));
chrome.tabs.onRemoved.addListener(g_tabMgrContainer.onTabRemoved.bind(g_tabMgrContainer));
chrome.tabs.onAttached.addListener(g_tabMgrContainer.onTabWindowAttached.bind(g_tabMgrContainer));
chrome.tabs.onActivated.addListener(g_tabMgrContainer.onTabActivated.bind(g_tabMgrContainer));
chrome.tabs.onUpdated.addListener(g_tabMgrContainer.onTabUpdated.bind(g_tabMgrContainer));
chrome.windows.onFocusChanged.addListener(g_tabMgrContainer.onWindowFocusChanged.bind(g_tabMgrContainer));
chrome.windows.getAll({ populate: true }, function(windows) {
  for (var iWindow = 0, windowsCount = windows.length; iWindow < windowsCount; ++iWindow) {
    for (var iTab = 0, iTabCount = windows[iWindow].tabs.length; iTab < iTabCount; ++iTab) {
      var tabMgr = new TabManager(windows[iWindow].tabs[iTab]);
      g_tabMgrContainer.add(tabMgr);
      tabMgr.onPageLoading();
    }
  }
});

g_actMgr.getGeoLocation();
g_actMgr.checkLogon();
setInterval(g_actMgr.getGeoLocation.bind(g_actMgr), 1800000);

$.ajaxSetup({headers: {"waveface-stream": g_WfSettings.extName + "/" + g_WfSettings.extVersionWithMaintainBuild }});
