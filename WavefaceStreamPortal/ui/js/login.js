$(document).ready(function() {
  $('#login input[type="submit"]').click(function(e) {
    e.preventDefault();
    var email = $(this).parents().find('input[name="email"]').val();
    var password = $(this).parents().find('input[name="password"]').val();
    WfLogin(email, password, function(resp) {
      if (resp) {
        window.close();
      }
    });
  });

  $('#fb-login-link').click(function(e) {
    e.preventDefault();
    WfFbLogin();
  });
});
