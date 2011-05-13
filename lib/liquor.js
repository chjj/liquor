(function() {
// liquor - javascript templates 
// Copyright (c) 2011, Christopher Jeffrey (MIT Licensed)

// a very simple lexer
var tokenize = (function() {
  var IN_LOOP = 0,
      IN_CONDITIONAL = 1;
  
  // i wish i could bring myself
  // to use an object instead
  var rules = [ 
    ['ESCAPED', /^\\([\s\S])/], 
    ['LOOP_START', /^(\s*):([^\s[;]+)\[/], 
    ['LOOP_END', /^\];/],
    ['TMP_VAR', /^(!*)&:([^;]+);/],
    ['COND_START', /^{/],
    ['COND_END', /^}/]
  ];
  
  // basically anything that 
  // isnt the above patterns
  rules.push(['TEXT', 
    RegExp([ 
      '^([\\s\\S]+?)(?=',
      rules.map(function(r) { 
        return r[1].source.slice(1); 
      }).join('|'),
      '|$)'
    ].join(''))
  ]);
  
  return function(src) {
    var stack = [], tokens = [];
    var cap, type, pos = 0;
    
    var state = function() {
      return stack[stack.length-1];
    };
    
    var scan = function() {
      for (var i = 0, l = rules.length; i < l; i++) {
        if (cap = rules[i][1].exec(src)) {
          type = rules[i][0];
          src = src.slice(cap[0].length);
          return true;
        }
      }
    };
    
    src = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // scan for tokens
    // its easy to do some of the 
    // exception throwing here
    while (scan()) {
      tokens.push({
        type: type,
        cap: cap 
      });
      switch (type) {
        case 'LOOP_START':
          stack.push(IN_LOOP);
          break;
        case 'LOOP_END':
          if (state() === IN_LOOP) { 
            stack.pop();
          } else {
            throw new 
              SyntaxError('Unexpected "];" at: ' + pos);
          }
          break;
        case 'COND_START':
          stack.push(IN_CONDITIONAL);
          break;
        case 'COND_END':
          if (state() !== IN_CONDITIONAL) {
            throw new 
              SyntaxError('Unexpected "}" at: ' + pos);
          }
          stack.pop();
          break;
      }
      pos += cap[0].length;
    }
    if (stack.length > 0) {
      throw new 
        SyntaxError('Unexpected EOF.');
    }
    return tokens;
  };
})();

// recursive descent is my only god.
// this will parse the tokens and output a one-line string expression.
var parse = (function() {
  var escape = function(txt) { // escape regular text
    return txt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  };
  
  // if a `with` statement were used,
  // this wouldn't be necessary
  var name = function(n) { 
    if (n.indexOf('this') !== 0) n = '__locals.' + n;
    return n.replace(/#/g, '.').replace(/\.(\d+)/g, '[$1]');
  };
  
  var cur, tokens;
  var next = function() {
    cur = tokens.shift();
    return cur;
  };
  
  var conditional = function() {
    var body = [], checks = [];
    while (next().type !== 'COND_END') { 
      // need to grab all the variables in the top-level for 
      // conditional checks (this includes collection vars)
      if (cur.type === 'TMP_VAR' || cur.type === 'LOOP_START') {
        checks.push(
          (cur.type === 'TMP_VAR' ? (cur.cap[1] || '') : '') 
          + '__help.truthy(' + name(cur.cap[2]) + ')'
        );
      }
      body.push(tok());
    }
    return '"+((' + checks.join(' && ') + ') ? "' + body.join('') + '" : "")+"';
  };
  
  // pretty straightforward but need to 
  // remeber to manage the whitespace properly
  var loop = function() {
    var body = [], token = cur;
    while (next().type !== 'LOOP_END') {
      body.push(tok());
    }
    return [
      '"+(__help.iterate(',
      name(token.cap[2]),
      ', function() { return "',
      escape(token.cap[1]),
      body.join(''),
      '"; }))+"'
    ].join('');
  };
  
  var tok = function() {
    var token = cur; 
    switch (token.type) {
      case 'TMP_VAR':
        return !token.cap[1] 
          ? '"+__help.show(' + name(token.cap[2]) + ')+"' 
          : '';
      case 'LOOP_START': 
        return loop();
      case 'COND_START':
        return conditional();
      case 'ESCAPED':
      case 'TEXT':
        return escape(token.cap[1]); 
      default:
        throw new 
          SyntaxError('Unexpected token: ' + token.cap[0]);
    }
  };
  
  return function(src) {
    var out = [];
    tokens = tokenize(src);
    while (next()) {
      out.push(tok());
    }
    return '"' + out.join('') + '"';
  };
})();

var compile = (function() {
  // helper functions to use inside the compiled template
  var helpers = { 
    // we use this for collection traversal statements
    iterate: function(obj, func) {
      var str = [];
      if (typeof obj.length === 'number') {
        for (var i = 0, l = obj.length; i < l; i++) {
          str.push(func.call(obj[i]));
        }
      } else {
        var k = Object.keys(obj);
        for (var i = 0, l = k.length; i < l; i++) {
          str.push(func.call(obj[k[i]]));
        }
      }
      return str.join('');
    },
    // custom truthy/falsey checks
    // basically the same as JS, except a 
    // variable is truthy if it is '' or 0
    truthy: function(v) { 
      return !(v === undefined || v === false || v === null || v !== v); 
    },
    // the function to determine whether to actually display a value
    // display any truthy value except for "true"
    show: function(v) { 
      var t = typeof v;
      return ((t === 'number' && v === v) || t === 'string') ? v : '';
    }
  };
  return function(src, debug) {
    if (debug === 'debug') return parse(src);
    var func = Function('__locals, __help', 'return ' + parse(src) + ';');
    return function(locals) { // curry on the helpers
      // do some post-processing here to make whitespace nice and neat
      var out = func.call(locals, locals, helpers);
      out = out.replace(/(\n)\n+/g, '$1').replace(/(\n)[\x20\t]+\n/g, '$1');
      return out;
    };
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exports = compile; 
  exports.compile = compile;
  exports.parse = parse;
  exports.tokenize = tokenize;
} else {
  this.liquor = compile;
}

}).call(this);