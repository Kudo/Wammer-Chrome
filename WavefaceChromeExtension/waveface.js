function installNotice() {
  if (localStorage.getItem("install_time")) {
    return;
  }

  var now = new Date().getTime();
  localStorage.setItem("install_time", now);

  var endpoint = settings.get("endpoints");

  if (endpoint == "development") {
    chrome.tabs.create(url: "http://develop.waveface.com:4343/products/download");
  }
  else if (endpoint == "staging")
  {
    chrome.tabs.create(url: "http://staging.waveface.com/products/download");
  }
  else if (endpoint == "production")
  {
    chrome.tabs.create(url: "https://waveface.com/products/download");
  }
}

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

installNotice()
