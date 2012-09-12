/*
 * HistoryExporter - Export Chrome's all history and send to portal.
 *
 * Implementation note:
 *    Due to Chrome SDK's limitation, our implementation is too export history daily one by one.
 *    Everyday we suppose user will not have more than 2147483647 history items.
 *    2147483647 for maxResults is defined by Chrome SDK, which is positive part of 32-bit integer.
 *    We will export history data back to 2002.
 */
function HistoryExporter() {
  //this.oldestDate = moment(new Date('2012/01/01'));
  this.oldestDate = moment().subtract('months', 3).startOf('day');
  this.wfWebUrl = "__WFLINK__";
  this.histItemsToCloudTheshold = 500;
};

HistoryExporter.prototype.composeFeedData = function(histItem) {
  var feedData = {
    version: 1,
    uri: histItem.url,
    title: histItem.title,
    last_access: histItem.visitTime.utc().unix(),
    from: 'history',
    client: {
      name: "Stream Portal Chrome Extension",
      version: "__VERSION__"
    }
  };
  return feedData
};

HistoryExporter.prototype.sendFeedData = function() {
  // FIXME: If not logon, should not send heartbeat here but later to consider how to know if user logon automatically?
  if (g_histItemsCount <= 0) { return; }

  var histExporter = this;
  var uri = this.wfWebUrl + "/api";
  var dataList = [];
  for (var i = 0; i < g_histItemsCount; ++i) {
    dataList.push(this.composeFeedData(g_histItems[i]));
  }
  var data = {
    feed_data: dataList
  };

  var qs = "api=" + encodeURIComponent('/sportal/feed') + "&data=" + encodeURIComponent(JSON.stringify(data));

  var xhr = new XMLHttpRequest();
  xhr.open("POST", uri, false);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send(qs);
  if (xhr.status != 200) {
    console.error("HistoryExporter.sendFeedData() - Invalid xhr returned status. xhr.readyState[%d] xhr.status[%d]", xhr.readyState, xhr.status);
  }

  g_histItems = [];
  g_histItemsCount = 0;
};

var g_histItemsCount = 0;
var g_histItems = [];

HistoryExporter.prototype.histItemHandler = function(histItem) {
  console.log(g_histItemsCount);
  if (g_histItemsCount <= this.histItemsToCloudTheshold) {
    g_histItems.push(histItem);
    ++g_histItemsCount;
  } else {
    this.sendFeedData();
  }
};

HistoryExporter.prototype.exportAll = function(portalTabId) {
  var totalCount = Math.floor(moment().diff(this.oldestDate, "days", true));
  for (var endDate = moment(), startDate = moment(endDate).subtract("days", 1), i = 0;
      endDate >= this.oldestDate;
      endDate = moment(startDate).subtract("seconds", 1), startDate = moment(endDate).subtract("days", 1), ++i)
  {
    var progress = Math.floor(i * 100 / totalCount);
    var fComplete = function(_progress) {
      return function() {
        if (portalTabId) {
          chrome.tabs.executeScript(portalTabId, {code: "updateHistDialogProgress(" + _progress + ")"});
        }
      }
    };
    this.exportFromDateRange(startDate, endDate, fComplete(progress));
  }
};

HistoryExporter.prototype.exportFromDateRange = function(startDate, endDate, completeHandler) {
  var histExporter = this;
  chrome.history.search({text:"", startTime: startDate.valueOf(), endTime: endDate.valueOf(), maxResults: 2147483647}, function(histItems) {
    console.info("HistoryExporter.exportFromDateRange(). startDate[%o] endDate[%o]", startDate, endDate);
    for (var i = 0, len = histItems.length; i < len; ++i) {
      histItems[i].visitTime = startDate;   // FIXME: Since Chrome SDK's HistoryItem does not return visitTime, we simply use startDate as output.
      histExporter.histItemHandler(histItems[i]);
    }

    histExporter.sendFeedData();
    if (completeHandler) { completeHandler(); }
  });
};
