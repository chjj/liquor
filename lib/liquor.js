/**
 * Liquor (https://github.com/chjj/liquor)
 * Javascript templates minus the code.
 * Copyright (c) 2011-2012, Christopher Jeffrey. (MIT Licensed)
 */

var lexer = require('./lexer')
  , parser = require('./parser');

/**
 * Compile
 */

var liquor = function(src, options) {
  options = options || {};

  src = parser(lexer(src, options), options);

  if (options === 'debug') return src;

  var func = new Function('$, each', src);
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
