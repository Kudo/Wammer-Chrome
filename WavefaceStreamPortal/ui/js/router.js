define([
  'underscore',
  'backbone',
  'wfAuth',
  'views/home',
  'views/login'
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
    home: function() {
      if (!localStorage.sessionToken) {
        this.navigate('login', {trigger: true});
      } else {
        var HomeView = require('views/home');
        HomeView = new HomeView();
        this.main.html(HomeView.render().el);
      }
    },
    login: function() {
      var LoginView = require('views/login');
      LoginView = new LoginView();
      this.main.html(LoginView.render().el);
    },
    signup: function() {
      console.log('signup');
    },
  });
});
