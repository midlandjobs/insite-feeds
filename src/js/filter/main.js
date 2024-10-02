(function($, window, document) {

  "use strict";

  // template.js
  const templateBuilder = require('./_template.js');

  // filter.js
  const FJS = require('./_filter.js');

  // jquery_fn.js
  // require('./_jquery_fn.js');

  // main.js
  var list = [];
  var FilterJS = function(records, container, options) {
    var fjs = new FJS(records, container, options);
    list.push(fjs);
    return fjs;
  };
  FilterJS.list = list;
  FilterJS.templateBuilder = templateBuilder;
  window.FilterJS = FilterJS;

  // auto.js
  FilterJS.auto = require('./_auto.js');

  // sorting.js
  // const Sort = require('./_sorting.js');

})(jQuery, window, document);
