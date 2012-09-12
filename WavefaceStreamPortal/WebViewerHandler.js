function getExtInfo(oid, completeHandler) {
  var uri = "https://devweb.waveface.com/api";
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

function updateHistDialogProgress(progress) {
  console.info("histDialogProgressBar() - progress[%d]", progress);
  $("#histDialogProgressBar").css("width", progress + "%");
  if (progress >= 100) {
    $("#histDialog").modal("hide");
    window.location.reload();
  }
};

function showHistDialog() {
  console.debug("[Enter] showHistDialog()");
  var histDialog =
    $('<div id="histDialog" class="modal hide fade">' +
        '<div class="modal-header">' +
        '<a class="close" data-dismiss="modal" >&times;</a>' +
        '<h3>Import history?</h3>' +
        '</div>' +

        '<div class="modal-body">' +
        '<p>Do you want to import your history data . Press Yes to import your history data from Google Chrome.</p>' +
        '<div style="display: none;" id="histDialogProgress"><div class="bar" id="histDialogProgressBar"></div></div>' +
        '</div>' +

        '<div class="modal-footer">' +
        '<a href="#" id="noButton" class="btn">No</a>' +
        '<a href="#" id="yesButton" class="btn btn-primary">Yes</a>' +
        '</div>' +
        '</div>');

  histDialog.find('#yesButton').click(function(e) {
    histDialog.find('.modal-body > p').text("Importing...");
    histDialog.find('.modal-footer').remove();
    histDialog.find('#histDialogProgress').addClass("progress").show();
    chrome.extension.sendMessage(null, {msg: "importHistory"});
  });

  histDialog.find('#noButton').click(function(e) {
    histDialog.modal('hide');
  });

  histDialog.modal('show');
  console.debug("[Leave] showHistDialog()");
};

$("#Portals").on("click", "a.extPage", function(e) {
  e.preventDefault();
  var elem = $(e.currentTarget);
  var oid = elem.attr("data-oid");
  getExtInfo(oid, function(extInfo) {
    chrome.extension.sendMessage(null, {
      msg: "openPage",
      url: elem.attr("href"),
      replayLocatorData: extInfo.replayLocator,
    });
  });
});


$(document).ready(function() {
  chrome.extension.sendMessage(null, {msg: "checkShowHistDialog"}, function(isShowHistDialog) {
    if (isShowHistDialog) {
      showHistDialog();
    }
  });
});
