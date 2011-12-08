/**
 * Liquor (https://github.com/chjj/liquor)
 * Javascript templates minus the code.
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

;(function() {

/**
 * Liquor
 */

var liquor = (function() {
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

  var iterate = /( *)@:([^\s]+) *([^\n]*(?:\n+\1 {2}[^\n]+)*)/
    , condition = /( *)(?:\?|(!)):([^\s]+) *([^\n]*(?:\n+\1 {2}[^\n]+)*)/;

  return function(str, opt) {
    // normalize whitespace
    // escape double quotes
    str = str.replace(/\r\n|\r/g, '\n')
             .replace(/\t/g, '  ')
             .replace(/"/g, '\\"');

    // pre-preprocessing for shorthand
    // notations and sig-whitespace here
    while (iterate.test(str)) {
      str = str.replace(iterate,
        '\n$1`each($2, function(v) {`$3  $1\n$1`})`');
    }

    while (condition.test(str)) {
      str = str.replace(condition,
        '\n$1`if ($2(typeof $3 !== "undefined" && $3))'
        + '{`$4  $1\n$1`}`');
    }

    // evaluate and interpolate
    str = str.replace(/`([^`]+)`/g, '"); $1; __out.push("')
             .replace(/#{([^}]+)}/g, '", ($1), "');

    // wrap
    str = 'with ($) { var __out = []; __out.push("'
      + str
      + '"); return __out.join(""); }';

    // drop the line feeds
    str = str.replace(/\n/g, '\\n');

    if (opt === 'debug') return str;

    var func = new Function('$, each', str);
    return function(locals) {
      return func(locals || {}, each);
    };
  };
})();

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

})();
