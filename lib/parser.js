/**
 * Liquor - Parser
 * Copyright (c) 2011-2012, Christopher Jeffrey. (MIT Licensed)
 */

var parser = (function() {
  var token
    , tokens;

  var next = function() {
    return token = tokens.pop();
  };

  var tok = function() {
    var token_ = token
      , body = '';

    switch (token_.type) {
      case 'evaluate':
        return '"); '
          + token_.code
          + '; __out.push("';
      case 'interpolate':
        return '", ('
          + token_.code
          + '), "';
      case 'iterate':
        while (next().type !== 'end') {
          body += tok();
        }
        return '"); each('
          + token_.name
          + ', function() { __out.push("'
          + body
          + '"); }); __out.push("';
      case 'if':
      case 'not':
        while (next().type !== 'end') {
          body += tok();
        }
        return '"); if ('
          + (token_.type === 'not' ? '!' : '')
          + '(typeof '
          + token_.name
          + ' !== "undefined" && '
          + token_.name
          + ')) { __out.push("'
          + body
          + '"); } __out.push("';
      case 'text':
        return token_.text;
    }
  };

  return function(src, options) {
    var out = '';

    tokens = src.reverse();

    while (next()) {
      out += tok();
    }

    out = 'with ($) { var __out = []; __out.push("'
      + out
      + '"); return __out.join(""); }';

    token = null;
    tokens = null;

    return out;
  };
})();

/**
 * Expose
 */

module.exports = parser;
