define([
  'jquery',
  'underscore',
  'backbone',
  'wfAuth'
], function($, _, Backbone, WfAuth) {
  return Backbone.Model.extend({
    initialize: function() {
      this.set({email: WfGetCurrentUserEmail()});
    },
    validate: function(attrs, options) {
      if (!localStorage.sessionToken) {
        return "Invalid session token";
      } else if (!WfIsSessionTokenValid(localStorage.sessionToken))
        return "Invalid session token";
    }
  });
});
