// liquor - javascript templates 
// Copyright (c) 2011, Christopher Jeffrey (MIT Licensed)
(function() {

var liquor = (function() {
  var foreach = function(obj, func, con) {
    if (!obj) return;
    if (typeof obj.length === 'number' && typeof obj !== 'function') {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (func.call(con || obj[i], obj[i], i, obj) === false) break;
      }
    } else {
      for (var k = Object.keys(obj), i = 0, l = k.length; i < l; i++) {
        if (func.call(con || obj[k[i]], obj[k[i]], k[i], obj) === false) break;
      }
    }
  };
  var each = /([ \t]*)@:([^\s]+)[ \t]*([^\n]*(?:\n+\1(?:[ ]{2}|\t)[^\n]+)*)/;
  var cond = /([ \t]*)(?:\?|(!)):([^\s]+)[ \t]*([^\n]*(?:\n+\1(?:[ ]{2}|\t)[^\n]+)*)/;
  return function(str, opt) {
    // normalize newlines and escape double quotes
    str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/"/g, '\\"');
    
    // pre-preprocessing for shorthand notations, sig-whitespace here
    while (each.test(str)) {
      str = str.replace(each, '\n$1`each($2, function(v) {`$3  $1\n$1`})`');
    }
    while (cond.test(str)) {
      str = str.replace(cond, 
        '\n$1`if ($2(typeof $3 !== "undefined" && $3)) {`$4  $1\n$1`}`'
      );
    }
    
    // evaluate
    str = str.replace(/`([^`]+)`/g, '"); $1; __out.push("');
    // interpolate
    str = str.replace(/#{([^}]+)}/g, '", ($1), "');
    // wrap
    str = 'with($) { var __out = []; __out.push("' 
          + str + '"); return __out.join(""); }';
    // drop the line feeds
    str = str.replace(/\n/g, '\\n');
    
    if (opt === 'debug') return str;
    
    var func = new Function('$', str);
    return function(locals) {
      var $ = locals || {};
      $.each = $.foreach = foreach;
      return func($);
    };
  };
})();

liquor.compile = liquor;

liquor.render = (function() { 
  var cache = {};
  return function(str, locals, name) {
    locals || (locals = {});
    if (name) {
      if (!cache[name]) cache[name] = liquor.compile(str);
      return cache[name](locals);
    } else {
      return liquor.compile(str)(locals);
    }
  };
})();

// expose
liquor.render([
  '?:module',
  '  ?:module.exports',
  '    `module.exports = liquor`',
  '!:module',
  '  `env.liquor = liquor`'
].join('\n'), {
  env: this, 
  liquor: liquor, 
  module: 
    typeof module !== 'undefined' 
    && module
});

}).call(this);