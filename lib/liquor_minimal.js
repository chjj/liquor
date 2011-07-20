/**
 * Liquor (https://github.com/chjj/liquor)
 * Javascript templates minus the code.
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

var liquor = (function() {
  var each = function(obj, func) {
    if (!obj) return;

    if (typeof obj.length === 'number' 
        && typeof obj !== 'function') {
      var i = 0
        , l = obj.length;

      for (; i < l; i++) {
        if (func.call(obj[i], obj[i]
            , i, obj) === false) break;
      }
    } else {
      var k = Object.keys(obj)
        , i = 0
        , l = k.length
        , key;

      for (; i < l; i++) {
        key = k[i];
        if (func.call(obj[key], obj[key]
            , key, obj) === false) break;
      }
    }
  };

  var iterate = /([ \t]*)@:([^\s]+)[ \t]*([^\n]*(?:\n+\1(?:[ ]{2}|\t)[^\n]+)*)/
    , condition = /([ \t]*)(?:\?|(!)):([^\s]+)[ \t]*([^\n]*(?:\n+\1(?:[ ]{2}|\t)[^\n]+)*)/;

  return function(str, opt) {
    // normalize newlines 
    // escape double quotes
    str = str.replace(/\r\n/g, '\n')
             .replace(/\r/g, '\n')
             .replace(/"/g, '\\"');

    // pre-preprocessing for shorthand 
    // notations and sig-whitespace here
    while (iterate.test(str)) str = str.replace(iterate, 
      '\n$1`each($2, function(v) {`$3  $1\n$1`})`'
    );

    while (condition.test(str)) str = str.replace(condition,
      '\n$1`if ($2(typeof $3 !== "undefined" && $3)) \
        {`$4  $1\n$1`}`'
    );

    // evaluate and interpolate
    str = str.replace(/`([^`]+)`/g, '"); $1; __out.push("')
             .replace(/#{([^}]+)}/g, '", ($1), "');

    // wrap
    str = 'with ($) { var __out = []; __out.push("'
          + str + '"); return __out.join(""); }';

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

if (!Object.keys) Object.keys = function(o) {
  var k, c = []; 
  if (o) for (k in o) if (c.hasOwnProperty.call(o, k)) c.push(k);
  return c;
};