g_clickedElem = null;
$("#Portals").on("click", "a.extPage", function(e) {
  e.preventDefault();
  g_clickedElem = $(e.currentTarget);
  g_confirmModal.modal('show');
});

function openPage(openWithOrigPos) {
  if (openWithOrigPos) {
    var extInfo = JSON.parse(g_clickedElem.attr("data-ext_info"));
    chrome.extension.sendMessage(null, {
      msg: "openPage",
      url: g_clickedElem.attr("href"),
      replayLocatorData: extInfo.replayLocator,
    });
  } else {
    window.open(g_clickedElem.attr("href"), "_blank");
  }
};

function initConfirmModal() {
  g_confirmModal =
    $('<div class="modal hide fade">' +
        '<div class="modal-header">' +
        '<a class="close" data-dismiss="modal" >&times;</a>' +
        '<h3>Go to original position?</h3>' +
        '</div>' +

        '<div class="modal-body">' +
        '<p>Do you want to open this page and move original viewed position?</p>' +
        '</div>' +

        '<div class="modal-footer">' +
        '<a href="#" id="noButton" class="btn">No</a>' +
        '<a href="#" id="yesButton" class="btn btn-primary">Yes</a>' +
        '</div>' +
        '</div>');

  g_confirmModal.find('#yesButton').click(function(event) {
    g_confirmModal.modal('hide');
    openPage(true);
  });

  g_confirmModal.find('#noButton').click(function(event) {
    g_confirmModal.modal('hide');
    openPage(false);
  });
};

initConfirmModal();
console.warn(g_confirmModal);
