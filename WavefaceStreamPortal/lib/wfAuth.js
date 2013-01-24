function WfLogin(email, password, cbComplete) {
  console.debug("[Enter] WfLogin() - email[%s]", email);

  var _cbSuccess = function(obj) {
    localStorage.sessionToken = obj.session_token;
    chrome.browserAction.setBadgeText({text: ""});
    chrome.browserAction.setPopup({popup: ""});
    if (typeof(cbComplete) === "function") { cbComplete(true); }
  };

  var _cbError = function(jqXHR) {
    var err = JSON.parse(jqXHR.responseText);
    if (typeof(cbComplete) === "function") { cbComplete(false); }
  };

  var authUrl = g_WfSettings.apiUrl + "auth/login";
  var data = {
    apikey: g_WfSettings.apiKey,
    email: email,
    password: password
  };
  var jqxhr = $.post(authUrl, data).success(_cbSuccess).error(_cbError);

  console.debug("[Leave] WfLogin() - email[%s]", email);
}

function WfFbLogin() {
  console.debug("[Enter] WfFbLogin()");

  // Refer: http://stackoverflow.com/questions/9719570/generate-random-password-string-with-requirements-in-javascript
  var csrfToken = Math.random().toString(36).slice(-8);
  localStorage.csrfToken = csrfToken;

  var extId = chrome.i18n.getMessage("@@extension_id");
  var locale = chrome.i18n.getMessage("@@ui_locale");
  var data = {
    api_key: g_WfSettings.apiKey,
    device: "windows",
    xurl: "chrome-extension://" + extId +  "/callback.html?handler=WfFbLogin&token=" + csrfToken + "&api_ret_code=%(api_ret_code)d&api_ret_message=%(api_ret_message)s&session_token=%(session_token)s",
    locale: locale,
    show_tutorial: false
  };
  var url = g_WfSettings.fbLoginUrl + "?" + $.param(data);
  console.debug(url);
  chrome.windows.create({url: url, width: 500, height: 400, focused: true, type: "popup"});

  console.debug("[Leave] WfFbLogin()");
}

WfFbLogin.callback = function(obj) {
  console.debug("[Enter] WfFbLogin.callback() - obj[%o]", obj);
  if (obj.api_ret_code === 0 && obj.session_token) {
    localStorage.sessionToken = obj.session_token;
    chrome.browserAction.setBadgeText({text: ""});
    chrome.browserAction.setPopup({popup: ""});
  }
  console.debug("[Leave] WfFbLogin.callback() - obj[%o]", obj);
};

function WfIsSessionTokenValid(sessionToken) {
  console.debug("[Enter] WfIsSessionTokenValid()");
  var ret = false;

  var url = g_WfSettings.apiUrl + "users/get";
  var data = {
    apikey: g_WfSettings.apiKey,
    session_token: sessionToken
  };
  var jqxhr = $.ajax({type:"POST", url: url, data: data, async: false, success: function(obj) {ret = true;}});

  console.debug("[Leave] WfIsSessionTokenValid()");
  return ret;
}
