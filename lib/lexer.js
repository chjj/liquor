/**
 * Liquor - Lexer
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

var lexer = function(str, options) {
  options.pretty = true;

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
    , indentSize = 0;

  var state = function() {
    return stack[stack.length-1];
  };

  var out = function() {
    if (!options.pretty) return buff;
    var i = indents.length * indentSize;
    if (i) buff = outdent(buff, i);
    if (options.indent) {
      i = options.indent * indentSize;
      buff = indent(buff, i);
    }
    return buff;
  };

  for (; i < l; i++) {
    ch = str[i];
    offset++;

    if (ch > ' ' && newline) {
      if (!indentSize && indent < buff.length) {
        indentSize = buff.length - indent;
      }
      // We could use offset - 1 here
      // instead of buff.length.
      indent = buff.length;
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

var outdent = function(str, n) {
  if (!n) return str;
  return str.replace(new RegExp('^ {' + n + '}', 'gm'), '');
};

var indent = function(str, n) {
  if (!n) return str;
  return str.replace(/^/gm, Array(n).join(' '));
};

/**
 * Expose
 */

module.exports = lexer;
