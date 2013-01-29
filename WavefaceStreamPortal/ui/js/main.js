requirejs.config({
  paths: {
    jquery          : '../../lib/jquery/jquery',
    jqueryValidate  : '../../lib/jquery/jquery.validate',
    jqueryPurl      : '../../lib/jquery/purl',

    backbone        : '../../lib/backbone/backbone-min',
    underscore      : '../../lib/lodash/lodash.csp.min',
    mustache        : '../../lib/mustache',

    text            : '../../lib/require/text',

    templates       : '../templates',
    wfSettings      : '../../lib/wfSettings',
    wfAuth          : '../../lib/wfAuth',
  },
  shim: {
    jquery: {
      exports       : '$'
    },
    jqueryValidate: {
      deps          : ['jquery'],
    },
    jqueryPurl: {
      deps          : ['jquery'],
    },
    underscore: {
      exports       : '_'
    },
    backbone: {
      deps          : ['jquery', 'underscore'],
      exports       : 'Backbone'
    },
    wfSettings: {
      deps          : ['jquery'],
    },
    wfAuth: {
      deps          : ['jquery', 'jqueryPurl', 'wfSettings'],
    }
  }
//  urlArgs: '_rt=' + (new Date()).getTime() // for development
});

requirejs([
  'require',
  'jquery',
  'underscore',
  'backbone',
  'router',
  'form'
], function(require, $, _, Backbone, Router) {
  $(function() {
    window.WF = {};
    window.WF.AppRoutes = new Router();
    Backbone.history.start();
    
    var WfFormView = require('form');
    window.WF.FormBaseView = new WfFormView();
  });
});
