/**
 * Liquor - Lexer
 * Copyright (c) 2011, Christopher Jeffrey. (MIT Licensed)
 */

var lex = function(str) {
  str = str.replace(/\r\n/g, '\n')
           .replace(/\r/g, '\n')
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
    , last = 0
    , indents = []
    , newline = true;

  var state = function() {
    return stack[stack.length-1];
  };

  for (; i < l; i++) {
    ch = str[i];
    offset++;

    if (ch > ' ' && newline) { 
      indent = buff.length / 2;
      while (indents[indents.length-1] >= indent) {
        tokens.push({
          type: 'end',
          line: line
        });
        indents.pop();
      }
      buff = '';
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
                name: buff,
                line: line
              });
            } else {
              tokens.push({
                type: 'text', 
                text: buff, 
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
        // the buffer should be empty
        if (str[i+1] === ':' && !buff) {
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
              text: buff, 
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
                text: buff, 
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
      default:
        buff += ch;
        break;
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