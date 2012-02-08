
function runBookmarklet(tab) {
  var endpoint = settings.get("endpoints");
  var bookmarkletUrl;
  
  if (endpoint == "development") {
    bookmarkletUrl = "javascript:(function(){ISRIL_H='c183';ISRIL_SCRIPT=document.createElement('SCRIPT');ISRIL_SCRIPT.type='text/javascript';ISRIL_SCRIPT.src='http://develop.waveface.com:4343/static/js/bookmarklet.js';document.getElementsByTagName('head')[0].appendChild(ISRIL_SCRIPT)})();";
  }
  else if (endpoint == "staging") {
    bookmarkletUrl = "javascript:(function(){ISRIL_H='c183';ISRIL_SCRIPT=document.createElement('SCRIPT');ISRIL_SCRIPT.type='text/javascript';ISRIL_SCRIPT.src='http://staging.waveface.com/static/js/bookmarklet.js';document.getElementsByTagName('head')[0].appendChild(ISRIL_SCRIPT)})();"; 
  }
  else if (endpoint == "production") {
    bookmarkletUrl = "javascript:(function(){ISRIL_H='c183';ISRIL_SCRIPT=document.createElement('SCRIPT');ISRIL_SCRIPT.type='text/javascript';ISRIL_SCRIPT.src='https://waveface.com/static/js/bookmarklet.js';document.getElementsByTagName('head')[0].appendChild(ISRIL_SCRIPT)})();";
  }

  chrome.tabs.update(
    tab.id, 
    {url: bookmarkletUrl}
  );
}

chrome.browserAction.onClicked.addListener(runBookmarklet);

// chrome.contextMenus.create({"title": "Save to Waveface", "contexts": ["link", "image"], "onclick": runBookmarklet},
//   function() {
//     if (chrome.extension.lastError) {
//       console.log("Unable to create context menu: " + chrome.extension.lastError.message);
//     }
//   }
// );