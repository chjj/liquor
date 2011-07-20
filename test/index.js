var assert = require('assert')
  , fs = require('fs')
  , compile = require('../').compile;

fs.readdirSync(__dirname).forEach(function(file) {
  if (file.indexOf('.html') === -1) return;

  var counterpart = file.split('.')[0]
    , template = fs.readFileSync(__dirname + '/' + file, 'utf8');

  template = compile(template, 'debug');

  try {
    var result = fs.readFileSync(__dirname + '/' + counterpart, 'utf8');
  } catch(e) {
    fs.writeFileSync(__dirname + '/' + counterpart, template);
    return;
  }

  assert.ok(template === result);
  Function('', template);
  console.log(file + ' compiled successfully.');
});