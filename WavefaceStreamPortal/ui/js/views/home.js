define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'text!templates/home.html',
  'wfAuth',
  'i18n!nls/uiI18n'
], function($, _, Backbone, M, Template, WfAuth, uiI18n) {
  return Backbone.View.extend({
    id: 'home',
    events: {
      'click #logout-button'            : 'logout'
    },
    initialize: function() {
      this.userModel = window.WF.UserModel;
    },
    render: function() {
      var data = this.userModel.toJSON();
      data.uiI18n = uiI18n;

      this.$el.html(M.render(Template, data));

      return this;
    },
    logout: function(e) {
      e.preventDefault();
      WfLogout();
      window.close();
    }
  });
});
