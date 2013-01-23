$(document).ready(function() {
  var params = $.url().param();
  if (params.token && params.token === localStorage.csrfToken) {
    if (params.handler === "WfFbLogin") {
      WfFbLogin.callback(params);
      window.close();
    }
  }
});
