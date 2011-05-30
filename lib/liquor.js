// liquor - javascript templates 
// Copyright (c) 2011, Christopher Jeffrey (MIT Licensed)
(function() {
var tokenize = (function() {
  var IN_LOOP = 0,
      IN_CONDITIONAL = 1;
  
  // i wish i could bring myself
  // to use an object instead
  var rules = [ 
    ['ESCAPED', /^\\([\s\S])/], 
    ['LOOP_START', /^#:([^\s[;]+)\[/], 
    ['LOOP_END', /^\];/],
    ['TMP_VAR', /^(!*)&:([^;]+);/],
    ['COND_START', /^{/],
    ['COND_END', /^}/]
  ];
  
  // basically anything that 
  // isnt the above patterns
  rules.push(['TEXT', 
    new RegExp('^([\\s\\S]+?)(?='
      + rules.map(function(rule) { 
        return rule[1].source.slice(1); 
      }).join('|') + '|$)'
    )
  ]);
  
  return function(src) {
    var stack = [], tokens = [];
    var cap, type, pos = 0, rule, i, state;
    
    src = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // scan for tokens
    // its easy to do some of the 
    // exception throwing here
    while (src.length) {
      for (i = 0; rule = rules[i++];) {
        if (cap = src.match(rule[1])) {
          type = rule[0];
          tokens.push({ type: type, cap: cap });
          src = src.slice(cap[0].length);
          
          state = stack[stack.length-1];
          switch (type) {
            case 'LOOP_START':
              stack.push(IN_LOOP);
              break;
            case 'LOOP_END':
              if (state === IN_LOOP) { 
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
              if (state !== IN_CONDITIONAL) {
                throw new 
                  SyntaxError('Unexpected "}" at: ' + pos);
              }
              stack.pop();
              break;
          }
          pos += cap[0].length;
          
          break;
        }
      }
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
  var cur, tokens;
  
  var escape = function(txt) { // escape regular text
    return txt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  };
  
  // if a `with` statement were used,
  // this wouldn't be necessary
  var name = function(name) { 
    if (!~name.indexOf('this')) name = '__locals.' + name;
    return name.replace(/#/g, '.').replace(/\.(\d+)/g, '[$1]');
  };
  
  var next = function() {
    cur = tokens.shift();
    return cur;
  };
  
  var conditional = function() {
    var body = [], checks = [], bool, variable;
    while (next().type !== 'COND_END') { 
      // need to grab all the variables in the top-level for 
      // conditional checks (this includes collection vars)
      if (cur.type === 'TMP_VAR' || cur.type === 'LOOP_START') {
        if (cur.type === 'TMP_VAR') {
          bool = cur.cap[1] || '';
          variable = name(cur.cap[2]);
        } else {
          bool = '';
          variable = name(cur.cap[1]);
        }
        checks.push(bool + '__help.truthy(' + variable + ')');
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
    return '"+(__help.iterate(' + name(token.cap[1]) 
           + ', function() { return "' + body.join('') + '"; }))+"';
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
      if (typeof obj.length === 'number' && typeof obj !== 'function') {
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
  
  return function(src, opt) {
    if (opt === 'debug') return parse(src);
    opt = opt || {};
    var func = Function('__locals, __help', 'return ' + parse(src) + ';');
    // curry on the helpers
    if (opt.pretty === false) {
      return function(locals) { 
        return func.call(locals, locals, helpers);
      };
    } else {
      return function(locals) { 
        return pretty(func.call(locals, locals, helpers));
      };
    }
  };
})();

var pretty = (function() { 
  var indent = function(num) {
    return Array(num + 1).join('  ');
  };
  var closing = {
    meta: true,
    link: true,
    input: true,
    img: true,
    hr: true,
    area: true,
    base: true,
    col: true,
    br: true,
    wbr: true
  };
  return function(text) {
    // temporarily remove PRE elements before processing
    var place = [];
    text = text.replace(
      /<(pre|textarea|li|a|p)(?:\s[^>]+)?>[\s\S]+?<\/\1>/g, 
      function($0, $1) { 
      if ($1 === 'pre') {
        $0 = $0.replace(/\r?\n/g, '&#x0A;');
      } else {
        $0 = $0.replace(/(>)\s+|\s+(<)/g, '$1$2');
      }
      return '<' + (place.push($0)-1) + (Array($0.length-2).join('%')) + '/>';
    });
    
    // indent elements
    var stack = [], tag, cap, num = 0;
    text = text.replace(/(>)\s+|\s+(<)/g, '$1$2').replace(/[\r\n]/g, '');
    while (cap = text.match(/^([\s\S]*?)<([^>]+)>/)) {
      text = text.slice(cap[0].length);
      tag = cap[2].split(' ')[0];
      if (cap[1]) stack.push(indent(num) + cap[1]);
      //if (tag[0] === '!') continue;
      if (tag[0] !== '/') {
        stack.push(indent(num) + '<' + cap[2] + '>');
        if (cap[2].slice(-1) !== '/' && !closing[tag] && tag[0] !== '!') num++;
      } else {
        num--;
        stack.push(indent(num) + '<' + cap[2] + '>');
      }
    }
    
    text = stack.join('\n');
    
    // restore the PRE elements to their original locations
    text = text.replace(/<(\d+)%*\/>/g, function($0, $1) { 
      return place[$1]; 
    });
    
    // wrap paragraphs
    text = text.replace(/([\x20\t]*)<p>([\s\S]+?)<\/p>/g, function($0, $1, $2) {
      var indent = $1 + '   ', text = $2;
      text = (indent + text
        .replace(/[\t\r\n]+/g, '')
        .replace(/(<\/[^>]+>|\/>)(?=\s*<\w)/g, '$1\n' + indent)
        .replace(/(.{75,}?\s+(?![^<]+>))/g, '$1\n' + indent)
        .replace(/([^<>\n]{50,}?)(<[^<]{15,}>)/g, '$1\n' + indent + '$2')
        .replace(/\s+(\/>)/g, '$1')
      );
      return $1 + '<p>\n' + text + '\n' + $1 + '</p>';
    });
    
    return text;
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