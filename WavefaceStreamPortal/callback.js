$(document).ready(function() {
  var params = $.url().param();
  if (params.token && params.token === localStorage.csrfToken) {
    // Since jquery.url.js param() did not support integer type, we do convert here.
    if (params.api_ret_code) {
      params.api_ret_code = parseInt(params.api_ret_code, 10);
    }

    // Dispatch to handlers
    if (params.handler === "WfFbLogin") {
      WfFbLogin.callback(params);
      window.close();
    }
  }
});
