$("#Portals").on("click", "a.extPage", function(e) {
  e.preventDefault();
  var elem = $(e.currentTarget);
  var extInfo = JSON.parse(elem.attr("data-ext_info"));
  chrome.extension.sendMessage(null, {
    msg: "openPage",
    url: elem.attr("href"),
    replayLocatorData: extInfo.replayLocator,
  });
});
