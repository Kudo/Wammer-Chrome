requirejs.config({
  paths: {
    jquery          : '../../lib/jquery/jquery',
    jqueryValidate  : '../../lib/jquery/jquery.validate',
    jqueryPurl      : '../../lib/jquery/purl',

    backbone        : '../../lib/backbone/backbone-min',
    underscore      : '../../lib/lodash/lodash.csp.min',
    mustache        : '../../lib/mustache',

    text            : '../../lib/require/text',
    i18n            : '../../lib/require/i18n',
    nls             : '../../_locales',

    templates       : '../templates',
    wfSettings      : '../../lib/wfSettings',
    wfAuth          : '../../lib/wfAuth'
  },
  config: {
    i18n: {
      locale: chrome.i18n.getMessage('@@ui_locale')
    },
  },
  shim: {
    jquery: {
      exports       : '$'
    },
    jqueryValidate: {
      deps          : ['jquery']
    },
    jqueryPurl: {
      deps          : ['jquery']
    },
    underscore: {
      exports       : '_'
    },
    backbone: {
      deps          : ['jquery', 'underscore'],
      exports       : 'Backbone'
    },
    wfSettings: {
      deps          : ['jquery']
    },
    wfAuth: {
      deps          : ['jquery', 'jqueryPurl', 'wfSettings']
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
  'wfSettings',
  'form',
  'models/user'
], function(require, $, _, Backbone, Router) {
  $(function() {
    $.ajaxSetup({headers: {"waveface-stream": g_WfSettings.extName + "/" + g_WfSettings.extVersionWithMaintainBuild }});

    window.WF = {};
    var WfUserModel = require('models/user')
    window.WF.UserModel = new WfUserModel();

    var WfFormView = require('form');
    window.WF.FormBaseView = new WfFormView();

    window.WF.AppRoutes = new Router();
    Backbone.history.start();
   });
});
