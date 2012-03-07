/**
 * Liquor (https://github.com/chjj/liquor)
 * Javascript templates minus the code.
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

var lexer = require('./lexer')
  , parser = require('./parser');

/**
 * Compile
 */

var liquor = function(text, options) {
  options = options || {};

  text = parser(lexer(text, options), options);

  if (options === 'debug') return text;

  var func = new Function('$, each', text);
  return function(locals) {
    return func(locals || {}, each);
  };
};

/**
 * Helper
 */

var each = function(obj, func) {
  if (!obj) return;

  var l = obj.length
    , i = 0;

  if (typeof l === 'number' && typeof obj !== 'function') {
    for (; i < l; i++) {
      if (func.call(obj[i], obj[i], i, obj) === false) {
        break;
      }
    }
  } else {
    var keys = Object.keys(obj)
      , l = keys.length
      , key;

    for (; i < l; i++) {
      key = keys[i];
      if (func.call(obj[key], obj[key], key, obj) === false) {
        break;
      }
    }
  }
};

/**
 * Expose
 */

liquor.compile = liquor;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = liquor;
} else {
  this.liquor = liquor;
}

module.exports = require('./liquor_minimal');
