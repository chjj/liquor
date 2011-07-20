/**
 * Liquor - Parser
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

var parse = (function() {
  var token
    , tokens;

  var next = function() {
    token = tokens.pop();
    return token;
  };

  var tok = function() {
    var body
      , token_ = token;

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
        body = [];
        while (next().type !== 'end') {
          body.push(tok());
        }
        return '"); each(' 
          + token_.name 
          + ', function() { __out.push("' 
          + body.join('') 
          + '"); }); __out.push("';
      case 'if':
      case 'not':
        body = [];
        while (next().type !== 'end') {
          body.push(tok());
        }
        return '"); if (' 
          + (token_.type === 'not' ? '!' : '') 
          + '(typeof ' 
          + token_.name 
          + ' !== "undefined" && ' 
          + token_.name 
          + ')) { __out.push("' 
          + body.join('') 
          + '"); } __out.push("';
      case 'text':
        return token_.text;
    }
  };

  return function(src) {
    tokens = src.reverse();

    try {
      var out = [];
      while (next()) {
        out.push(tok());
      }
    } catch(e) {
      token = JSON.stringify(token);
      e.message = token + '\n' + e;
      throw e;
    }

    out = out.join('');
    out = 'with ($) { var __out = []; __out.push("' 
          + out + '"); return __out.join(""); }';
    out = out.replace(/\n/g, '\\n');

    token = null;
    tokens = null;

    return out;
  };
})();

/**
 * Expose
 */

module.exports = parse;