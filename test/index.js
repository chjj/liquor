var assert = require('assert');
var fs = require('fs');

var compile = require('../').compile;

fs.readdirSync(__dirname).forEach(function(file) {
  if (file.indexOf('.html') === -1) return;
  var counterpart = file.split('.')[0];
  var template = fs.readFileSync('./' + file, 'utf-8');
  template = compile(template, 'debug');
  try {
    var result = fs.readFileSync('./' + counterpart, 'utf-8');
  } catch(e) {
    fs.writeFileSync('./' + counterpart, template);
    return;
  }
  assert.ok(template === result);
  Function('', 'return ' + template + ';');
  console.log(file + ' compiled successfully.');
});