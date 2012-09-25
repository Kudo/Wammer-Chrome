function getExtInfo(oid, completeHandler) {
  var uri = "__WFLINK__/api";
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
  console.info("histDialogProgress() - progress[%d]", progress);
  $("#histDialogProgressBar").css("width", progress + "%");
  if (progress >= 100) {
    $("#histDialog").modal("hide");
    window.location.reload();
  }
};

function updateHistDialogDate(dateStr) {
  console.info("histDialogDate() - dateStr[%s]", dateStr);
  var text = chrome.i18n.getMessage("importHistDialog_importing_with_date").replace("%s", dateStr);
  $("#histDialog").find('.modal-body > p').text(text);
};


function showHistDialog() {
  console.debug("[Enter] showHistDialog()");
  var histDialog =
    $('<div id="histDialog" class="modal hide fade">' +
        '<div class="modal-header">' +
        '<a class="close" data-dismiss="modal" >&times;</a>' +
        '<h3>' + chrome.i18n.getMessage("importHistDialog_title") + '</h3>' +
        '</div>' +

        '<div class="modal-body">' +
        '<p>' + chrome.i18n.getMessage("importHistDialog_desc") + '</p>' +
        '<div style="display: none;" id="histDialogProgress"><div class="bar" id="histDialogProgressBar"></div></div>' +
        '</div>' +

        '<div class="modal-footer">' +
        '<a href="#" id="noButton" class="btn">' + chrome.i18n.getMessage("importHistDialog_btn_no") + '</a>' +
        '<a href="#" id="yesButton" class="btn btn-primary">' + chrome.i18n.getMessage("importHistDialog_btn_yes") + '</a>' +
        '</div>' +
        '</div>');

  histDialog.find('#yesButton').click(function(e) {
    histDialog.find('.modal-body > p').text(chrome.i18n.getMessage("importHistDialog_importing_without_date"));
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

$("#main").on("click", "a.extPage", function(e) {
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

$(document).ready(function() {
  chrome.extension.sendMessage(null, {msg: "checkShowHistDialog"}, function(isShowHistDialog) {
    if (isShowHistDialog) {
      showHistDialog();
    }
  });
});
