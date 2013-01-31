define([
  'underscore',
  'backbone',
  'wfAuth',
  'views/home',
  'views/login',
  'views/signup'
], function(_, Backbone) {
  return Backbone.Router.extend({ 
    routes: {
      ''            : 'home',
      'login'       : 'login',
      'signup'      : 'signup'
    },
    initialize: function() {
      this.main = $("#main");
    },
    cleanView: function() {
      if (window.WF.View) {
        window.WF.View.undelegateEvents();
        window.WF.View.remove();
        delete window.WF.View;
      }
    },
    home: function() {
      if (!localStorage.sessionToken) {
        this.navigate('login', {trigger: true});
      } else {
        var HomeView = require('views/home');
        window.WF.View = new HomeView();
        this.main.html(window.WF.View.render().el);
      }
    },
    login: function() {
      var LoginView = require('views/login');
      window.WF.View = new LoginView();
      this.main.html(window.WF.View.render().el);
    },
    signup: function() {
      var SignupView = require('views/signup');
      window.WF.View = new SignupView();
      this.main.html(window.WF.View.render().el);
    }
  });
});
