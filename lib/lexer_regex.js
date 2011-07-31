/**
 * Liquor - Lexer
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

/**
 * Grammar
 */

var rules = {
  whitespace: /^\n([ \t]*)/,
  notation: /^([@?!]):(\w+)[ \t]*/,
  evaluate: /^`([^`]|\\`)*`/,
  interpolate: /^#{([^}]*)}/
};

/**
 * Lexer
 */

var lex = function(str) {
  var keys = Object.keys(rules)
    , i = 0
    , l = keys.length
    , key
    , rule
    , indent
    , buff = ''
    , line = 0
    , tokens = []
    , indents = [];

  str = str.replace(/\r\n/g, '\n')
           .replace(/\r/g, '\n')
           .replace(/"/g, '\\"');

  while (str.length) {
    for (i = 0; i < l; i++) {
      key = keys[i];
      rule = rules[key];

      cap = rule.exec(str);
      if (!cap) continue;
      str = str.substring(cap[0].length);

      if (buff) {
        tokens.push({
          type: 'text', 
          text: buff,
          line: line
        });
        buff = '';
      }

      switch (key) {
        case 'whitespace':
          line++;
          indent = cap[1].length / 2;
          while (indents[indents.length-1] >= indent) {
            tokens.push({
              type: 'end',
              line: line
            });
            indents.pop();
          }
          break;
        case 'notation':
          switch (cap[1]) {
            case '@':
              tokens.push({
                type: 'iterate', 
                name: cap[2],
                line: line
              });
              break;
            case '?':
              tokens.push({
                type: 'if', 
                name: cap[2],
                line: line
              });
              break;
            case '!':
              tokens.push({
                type: 'not', 
                name: cap[2],
                line: line
              });
              break;
          }
          indents.push(indent);
          break;
        case 'evaluate':
          tokens.push({
            type: 'evaluate', 
            code: cap[1],
            line: line
          });
          break;
        case 'interpolate':
          tokens.push({
            type: 'interpolate', 
            code: cap[1],
            line: line
          });
          break;
      }
      break;
    }

    if (!cap) {
      buff += str[0];
      str = str.substring(1);
    }
  }

  if (buff) {
    tokens.push({
      type: 'text', 
      text: buff,
      line: line
    });
  }

  return tokens;
};

/**
 * Expose
 */

module.exports = lex;