//console.log(someVar);
var first = require('./first.js'); // commonjs
console.log(first.);
console.log(global.studentName);

const secondly = 'there';
const someThing = function(msg = 'blank'){
  console.log(msg);
}

exports.secondly = secondly;
exports.someThing = someThing;