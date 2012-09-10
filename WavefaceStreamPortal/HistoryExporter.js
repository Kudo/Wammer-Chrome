/*
 * HistoryExporter - Export Chrome's all history and send to portal.
 *
 * Implementation note:
 *    Due to Chrome SDK's limitation, our implementation is too export history monthly one by one.
 *    Each month we suppose user will not have more than 2147483647 history items.
 *    2147483647 for maxResults is defined by Chrome SDK, which is positive part of 32-bit integer.
 *    We will export history data back to 2002.
 */
function HistoryExporter() {
  this.oldestDate = moment(new Date('2002/01/01'));
  this.wfWebUrl = "__WFLINK__";
};

HistoryExporter.prototype.composeFeedData = function(histItem) {
  var feedData = {
    version: 1,
    uri: histItem.url,
    title: histItem.title,
    startTime: histItem.lastVisitTime,    // FIXME: Format ? lastVisitTime can be override.
    from: 'history',
    duration: 5,                          // FIXME: remove it.
    client: {
      name: "Stream Portal Chrome Extension",
      version: "__VERSION__"
    }
  };
  return feedData
};

HistoryExporter.prototype.sendFeedData = function(histItem) {
  // FIXME: If not logon, should not send heartbeat here but later to consider how to know if user logon automatically?

  var histExporter = this;
  var uri = this.wfWebUrl + "/api";
  var data = {
    feed_data: this.composeFeedData(histItem)
  };
  var qs = "api=" + encodeURIComponent('/sportal/feed') + "&data=" + encodeURIComponent(JSON.stringify(data));

  var xhr = new XMLHttpRequest();
  xhr.open("POST", uri, true);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function() {
    if (xhr.status != 200) {
      console.error("HistoryExporter.sendFeedData() - Invalid xhr returned status. xhr.readyState[%d] xhr.status[%d]", xhr.readyState, xhr.status);
    }
  };
  xhr.send(qs);
};

HistoryExporter.prototype.histItemHandler = HistoryExporter.prototype.sendFeedData;

HistoryExporter.prototype.exportAll = function(portalTabId) {
  var totalCount = moment().diff(this.oldestDate, "months");
  for (var endDate = moment(), startDate = moment(endDate).subtract("months", 1), i = 0;
      endDate >= this.oldestDate;
      endDate = moment(startDate).subtract("seconds", 1), startDate = moment(endDate).subtract("months", 1), ++i)
  {
    this.exportFromDateRange(startDate, endDate);

    if (portalTabId) {
      var progress = Math.floor(i * 100 / totalCount);
      chrome.tabs.executeScript(portalTabId, {code: "updateHistDialogProgress(" + progress + ")"});
    }
  }
};

HistoryExporter.prototype.exportFromDateRange = function(startDate, endDate) {
  console.debug("HistoryExporter.exportFromDateRange(). startDate[%o] endDate[%o]", startDate, endDate);
  var histExporter = this;
  chrome.history.search({text:"", startTime: startDate.valueOf(), endTime: endDate.valueOf(), maxResults: 2147483647}, function(histItems) {
    for (var i = 0, len = histItems.length; i < len; ++i) {
      histExporter.histItemHandler(histItems[i]);
    }
  });
};
