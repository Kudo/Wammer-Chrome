define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'text!templates/login.html',
  'wfAuth',
  'i18n!nls/uiI18n'
], function($, _, Backbone, M, Template, WfAuth, uiI18n) {
  return Backbone.View.extend({
    id: 'login',
    events: {
      'click #fb-login-link'            : 'fbLogin',
      'click input[type="submit"]'      : 'nativeLogin'
    },
    render: function() {
      var data = {
        uiI18n: uiI18n
      };
      this.$el.html(M.render(Template, data));
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
            $("#messages > div > p").text(uiI18n.login.invalidAuth).parent().addClass("error-message shake").show();
          }
        }
      });
    }
  });
});
