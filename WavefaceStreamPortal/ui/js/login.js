$(document).ready(function() {
  $('#login input[type="submit"]').click(function(e) {
    e.preventDefault();
    WfLogin("kudo@wf.com", "123456", function(resp) {console.log(resp);});
  });

  $('#fb-login-link').click(function(e) {
    e.preventDefault();
    WfFbLogin(function(resp) {console.log(resp);});
  });
});
