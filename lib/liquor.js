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

  var l = obj.length
    , i = 0;

  if (typeof l === 'number' && typeof obj !== 'function') {
    for (; i < l; i++) {
      if (func.call(obj[i], obj[i], i, obj) === false)
        break;
    }
  } else {
    var keys = Object.keys(obj)
      , l = keys.length
      , key;

    for (; i < l; i++) {
      key = keys[i];
      if (func.call(obj[key], obj[key], key, obj) === false)
        break;
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

/**
 * Client-Side Shim
 */

if (!Object.keys) {
  var hop = Object.prototype.hasOwnProperty;
  Object.keys = function(o) {
    var k, c = [];
    if (o) for (k in o) if (hop.call(o, k)) c.push(k);
    return c;
  };
}
