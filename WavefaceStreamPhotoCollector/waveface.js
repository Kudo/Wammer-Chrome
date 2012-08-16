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
}

function runBookmarklet(bookmarkletUrl) {
  return function(tab) {
    chrome.tabs.executeScript(tab.id, {file: bookmarkletUrl});
  };
}
