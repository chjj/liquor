/**
 * Liquor - Lexer
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

var lexer = function(str, options) {
  str = str
    .replace(/\r\n|\r/g, '\n')
    .replace(/"/g, '\\"');

  var i = 0
    , l = str.length
    , ch
    , buff = ''
    , key
    , line = 1
    , offset = 0
    , tokens = []
    , stack = []
    , indent = 0
    , indents = []
    , newline = true
    , indentSize = getIndentSize(str);

  if (options.pretty && options.indent) {
    str = applyIndent(str, options.indent * indentSize);
    l = str.length;
  }

  var state = function() {
    return stack[stack.length-1];
  };

  var out = function() {
    if (!options.pretty) return buff;
    var i = indents.length * indentSize;
    if (!i) return buff;
    return applyOutdent(buff, i);
  };

  for (; i < l; i++) {
    ch = str[i];
    offset++;

    if (ch > ' ' && newline) {
      indent = buff.length;
      // assert(indent % indentSize === 0);
      while (indents[indents.length-1] >= indent) {
        tokens.push({
          type: 'end',
          line: line
        });
        indents.pop();
      }
      if (!options.pretty) buff = '';
      newline = false;
    }

    switch(ch) {
      case '\n':
        line++;
        offset = 0;
        switch (state()) {
          case 'evaluate':
          case 'interpolate':
            buff += ch;
            break;
          default:
            if (stack.length) {
              tokens.push({
                type: stack.pop(),
                name: out(),
                line: line
              });
            } else {
              if (options.pretty) buff += '\\n';
              tokens.push({
                type: 'text',
                text: out(),
                line: line
              });
            }
            buff = '';
            newline = true;
            break;
        }
        break;
      case '@':
      case '?':
      case '!':
        if (str[i+1] === ':' && !buff.trim()) {
          switch (ch) {
            case '@':
              stack.push('iterate');
              break;
            case '?':
              stack.push('if');
              break;
            case '!':
              stack.push('not');
              break;
          }
          indents.push(indent);
          i++;
          buff = '';
        } else {
          buff += ch;
        }
        break;
      case '`':
        switch (state()) {
          case 'evaluate':
            tokens.push({
              type: 'evaluate',
              code: out(),
              line: line
            });
            buff = '';
            stack.pop();
            break;
          case 'interpolate':
            buff += ch;
            break;
          default:
            tokens.push({
              type: 'text',
              text: out(),
              line: line
            });
            buff = '';
            stack.push('evaluate');
            break;
        }
        break;
      case '#':
        if (str[i+1] === '{') {
          switch (state()) {
            case 'interpolate':
            case 'evaluate':
              buff += ch;
              break;
            default:
              tokens.push({
                type: 'text',
                text: out(),
                line: line
              });
              buff = '';
              i++;
              stack.push('interpolate');
              break;
          }
        } else {
          buff += ch;
        }
        break;
      case '}':
        switch (state()) {
          case 'interpolate':
            tokens.push({
              type: 'interpolate',
              code: out(),
              line: line
            });
            buff = '';
            stack.pop();
            break;
          default:
            buff += ch;
            break;
        }
        break;
      default:
        buff += ch;
        break;
    }
  }

  if (buff) {
    tokens.push({
      type: 'text',
      text: out(),
      line: line
    });
  }

  return tokens;
};

var applyOutdent = function(str, n) {
  if (!n) return str;
  return str.replace(new RegExp('^[ \t]{' + n + '}', 'gm'), '');
};

var applyIndent = function(str, n) {
  if (!n) return str;
  var s = '';
  while (n--) s += ' ';
  return str.replace(/^/gm, s);
};

var getIndentSize = function(str) {
  var start = /^([ \t]+)(?:[^\n]+\n\1)+/.exec(str);
  if (start) str = applyOutdent(str, start[1].length);
  var size = /\n([ \t]+)/.exec(str);
  return size ? size[1].length : 0;
};

/**
 * Expose
 */

module.exports = lexer;
