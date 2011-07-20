/**
 * Liquor (https://github.com/chjj/liquor)
 * Javascript templates minus the code.
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

var lex = require('./lexer')
  , parse = require('./parser');

/**
 * Compile
 */

var liquor = function(str, opt) {
  str = parse(lex(str));

  if (opt === 'debug') return str;

  var func = new Function('$, each', str);
  return function(locals) {
    return func(locals || {}, each);
  };
};

/**
 * Helper
 */

var each = function(obj, func) {
  if (!obj) return;

  var i = 0
    , l = obj.length;

  if (typeof l === 'number' 
      && typeof obj !== 'function') {
    for (; i < l; i++) {
      if (func.call(obj[i], obj[i]
          , i, obj) === false) break;
    }
  } else {
    var keys = Object.keys(obj)
      , l = keys.length
      , key;

    for (; i < l; i++) {
      key = keys[i];
      if (func.call(obj[key], obj[key]
          , key, obj) === false) break;
    }
  }
};

/**
 * Client-Side Shim
 */

if (!Object.keys) {
  var hop = Object.prototype.hasOwnProperty;
  Object.keys = function(obj) {
    var key, keys = []; 
    if (obj) for (key in obj) {
      if (hop.call(obj, key)) keys.push(key);
    }
    return keys;
  };
}

/**
 * Expose
 */

liquor.compile = liquor;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = liquor;
} else {
  this.liquor = liquor;
}
