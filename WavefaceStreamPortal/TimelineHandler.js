function getExtInfo(oid, completeHandler) {
  var uri = g_WfSettings.webUrl + "/api";
  var data = {
    api: "/sportal/get",
    data: JSON.stringify({
      oids: {oid:oid}
    })
  };
  $.getJSON(uri, data, function(retData) {
    completeHandler(retData.results[0].ext_info);
  });
};

$("#timeline-inner").on("click", "a.extPage", function(e) {
  e.preventDefault();
  var elem = $(e.currentTarget);
  var oid = elem.attr("data-oid");
  getExtInfo(oid, function(extInfo) {
    chrome.extension.sendMessage(null, {
      msg: "openPage",
      url: elem.attr("href"),
      replayLocatorData: extInfo.replayLocator
    });
  });
});
