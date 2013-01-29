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
      'click #logout-button'            : 'logout',
    },
    render: function() {
      this.$el.html(M.render(Template));

      // FIXME: Use Backbone model instead.
      this.$('#email').text(WfGetCurrentUserEmail());

      return this;
    },
    logout: function(e) {
      e.preventDefault();
      WfLogout();
      window.close();
    }
  });
});
