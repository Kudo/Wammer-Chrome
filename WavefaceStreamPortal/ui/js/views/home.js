define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'text!templates/home.html',
  'wfAuth'
], function($, _, Backbone, M, Template, WfAuth) {
  return Backbone.View.extend({
    id: 'home',
    events: {
      'click #logout-button'            : 'logout'
    },
    initialize: function() {
      this.userModel = window.WF.UserModel;
    },
    render: function() {
      this.$el.html(M.render(Template, this.userModel.toJSON()));

      return this;
    },
    logout: function(e) {
      e.preventDefault();
      WfLogout();
      window.close();
    }
  });
});
