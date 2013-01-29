define([
  'jquery',
  'jqueryValidate',
  'underscore',
  'backbone'
], function($, jqValidator, _, Backbone) {
  return Backbone.View.extend({ 
    el: 'form',
    events: { 
      'submit': 'blockSubmit'
    },
    initialize: function() {
      this.validate();
      this.setFocus();
    },
    blockSubmit: function(event) {
      var $button = this.$('input[type=submit]');

      $button.attr('disabled', 'disabled');

      setTimeout(function() {
        $button.removeAttr('disabled');
      }, 2000);

      return this;
    },
    setFocus: function() {
      $("input:visible:first").focus();
    },
    validate: function() {
      this.addValidateMethod();
      var options = {
        rules : {
          email: { required: true, email: true },
          nickname: "required",
          password: "wfpassword",
          newPassword: "wfpassword",
          confirmPassword: {wfpassword: true, equalTo: "#id_newPassword"}
        },
        wrapper: 'p',
        onkeyup: false,
        errorPlacement: function(error, element) {
          element.parents('p').after(error.addClass('errorlist'));
        }
      };

      this.$el.filter("#login-form, #signup-form").validate(options);

    },
    addValidateMethod: function() {
      $.validator.addMethod("wfpassword", function(value, element) {
        return value.length > 5 && value.length < 17;
      }, 'Password is not valid');
    }
  });
});
