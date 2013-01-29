define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'text!templates/login.html',
  'wfAuth'
], function($, _, Backbone, M, Template, WfAuth) {
  return Backbone.View.extend({
    id: 'login',
    events: {
      'click #fb-login-link'            : 'fbLogin',
      'click input[type="submit"]'      : 'nativeLogin',
    },
    render: function() {
      this.$el.html(M.render(Template));
      return this;
    },
    fbLogin: function(e) {
      e.preventDefault();
      WfFbLogin();
    },
    nativeLogin: function(e) {
      e.preventDefault();
      $("#messages > div").hide();
      var $form = this.$('form');
      var email = $form.find('input[name="email"]').val();
      var password = $form.find('input[name="password"]').val();
      WfLogin(email, password, function(resp, api_ret_code) {
        if (resp) {
          window.close();
        } else {
          if (api_ret_code === 0x00001001) {
            $("#messages > div > p").text("Email or password is invalid.").parent().addClass("error-message shake").show();
          }
        }
      });
    }
  });
});
