/**
 * Liquor - Lexer
 * Copyright (c) 2011-2012, Christopher Jeffrey. (MIT Licensed)
 */

var lexer = function(src, options) {
  var i = 0
    , l = src.length
    , ch
    , buff = ''
    , key
    , line = 1
    , offset = 0
    , tokens = []
    , stack = []
    , indent
    , indents = []
    , newline = true
    , size;

  var state = function() {
    return stack[stack.length-1];
  };

  var out = function() {
    if (!options.pretty) return buff;
    var i = indents.length * size;
    if (!i) return buff;
    return outdent(buff, i);
  };

  for (; i < l; i++) {
    ch = src[i];
    offset++;

    if (ch > ' ' && newline) {
      if (!size && indent != null && indent < buff.length) {
        size = buff.length - indent;
      }
      indent = buff.length;
      // assert(indent % size === 0);
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

    switch (ch) {
      case '\r':
        if (src[i+1] === '\n') break;
        ;
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
                name: buff,
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
        if (src[i+1] === ':' && !buff.trim()) {
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
              code: buff,
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
        if (src[i+1] === '{') {
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
              code: buff,
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
      case '"':
        switch (state()) {
          case 'interpolate':
          case 'evaluate':
            buff += '"';
            break;
          case 'if':
          case 'not':
          case 'iterate':
          default:
            buff += '\\"';
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

var outdent = function(src, n) {
  if (!n) return src;
  return src.replace(new RegExp('^[ \t]{' + n + '}', 'gm'), '');
};

/**
 * Expose
 */

module.exports = lexer;
