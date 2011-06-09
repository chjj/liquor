// liquor - javascript templates 
// Copyright (c) 2011, Christopher Jeffrey (MIT Licensed)
(function() {
var liquor = (function() {
  // for browsers that don't support `Object.keys`
  var fin = Object.keys 
    ? function(obj, func, con) {
      var k = Object.keys(obj), i = 0, l = k.length;
      for (; i < l; i++) {
        if (func.call(con || obj[k[i]], obj[k[i]], k[i], obj) === false) break;
      }
    } 
    : function(obj, func, con) {
      for (var k in obj) if (liquor.hasOwnProperty.call(obj, k)) {
        if (func.call(con || obj[k], obj[k], k, obj) === false) break;
      }
    };
  var helpers = {
    each: function(obj, func, con) {
      if (!obj) return;
      if (typeof obj.length === 'number' && typeof obj !== 'function') {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (func.call(con || obj[i], obj[i], i, obj) === false) break;
        }
      } else {
        fin(obj, func, con);
      }
    }
  };
  return function(str, opt) {
    // normalize newlines
    str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // pre-escape all doublequotes, 
    // as we are using them in our compiled code
    str = str.replace(/"/g, '\\"');
    
    // aliases - to be dropped eventually once i decide on a style
    str = str.replace(/&:([^;\n]+);|{{([^}]+)}}|[&@$%]{([^}]+)}/g, '#{$1$2$3}');
    str = str.replace(/([?!@]:[^\s:]+)(?=\s)/g, '$1:');
    str = str.replace(/[#&@](:[^\s:]+:)([ \t]*->)?/g, '@$1');
    
    // pre-preprocessing for shorthand notations, sig-whitespace here
    // - when we replace these with js constructs, we need to maintain
    // - the linebreaks and whitespace so the regexes continue to match
    var each = /([ \t]*)@:([^\s:]+):[ \t]*([^\n]*(?:\n+\1(?:[ ]{2}|\t)[^\n]+)*)/;
    while (each.test(str)) {
      str = str.replace(each, '\n$1`each($2, function(v) {`$3  $1\n$1`})`');
    }
    
    // the main point of this is so you dont have to `typeof var !== 'undefined'` 
    var cond = /([ \t]*)(?:\?|(!)):([^\s:]+):[ \t]*([^\n]*(?:\n+\1(?:[ ]{2}|\t)[^\n]+)*)/;
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
      var $ = {}, k;
      for (k in helpers) $[k] = helpers[k];
      for (k in locals) $[k] = locals[k];
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