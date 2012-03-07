/**
 * Liquor (https://github.com/chjj/liquor)
 * A minimal version of liquor, suitable for the client-side.
 * Copyright (c) 2011-2012, Christopher Jeffrey. (MIT Licensed)
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

  var rules = {
    iterate: /^( *)@:([^\s]+) *([^\n]*(?:\n+\1 {2}[^\n]*)*)/,
    condition: /^( *)(?:\?|(!)):([^\s]+) *([^\n]*(?:\n+\1 {2}[^\n]*)*)/,
    evaluate: /^`([^`]+)`/,
    interpolate: /^#{([^}]+)}/,
    text: /^[^\0]+?(?= *@:| *\?:| *!:|`|#{|$)/
  };

  var outdent = function(src, n) {
    if (!n) return src;
    return src.replace(new RegExp('^ {' + n + '}', 'gm'), '');
  };

  var indentSize = function(src) {
    var start = /^( +)(?:[^\n]+\n\1)+/.exec(src);
    if (start) src = outdent(src, start[1].length);
    var size = /\n( +)/.exec(src);
    return size ? size[1].length : 0;
  };

  var depth
    , size;

  function lexer(src) {
    var out = ''
      , cap;

    depth++;

    while (src) {
      if (cap) src = src.substring(cap[0].length);
      if (cap = rules.iterate.exec(src)) {
        out += '"); each('
          + cap[2]
          + ', function(v) { __out.push("'
          + lexer(cap[3])
          + '"); }); __out.push("';
        continue;
      }
      if (cap = rules.condition.exec(src)) {
        out += '"); if ('
          + (cap[2] || '')
          + '(typeof '
          + cap[3]
          + ' !== "undefined" && '
          + cap[3]
          + ')){ __out.push("'
          + lexer(cap[4])
          + '"); } __out.push("';
        continue;
      }
      if (cap = rules.evaluate.exec(src)) {
        out += '"); '
          + cap[1]
          + '; __out.push("';
        continue;
      }
      if (cap = rules.interpolate.exec(src)) {
        out += '", ('
          + cap[1]
          + '), "';
        continue;
      }
      if (cap = rules.text.exec(src)) {
        out += outdent(cap[0], depth * size)
          .replace(/\n+$/, '')
          .replace(/"/g, '\\"')
          .replace(/\n+/g, '\\n');
        continue;
      }
      if (src) {
        throw new
          Error('Liquor: Error. Please report this as an issue.');
      }
    }

    depth--;

    return out;
  }

  return function(src, opt) {
    depth = -1;
    size = indentSize(src);

    // normalize whitespace
    src = src
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '  ');

    // wrap
    src = 'with ($) { var __out = []; __out.push("'
      + lexer(src)
      + '"); return __out.join(""); }';

    if (opt === 'debug') return src;

    var func = new Function('$, each', src);
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
