// global scoped variable/s
global.studentName = 'Kyle'

// module scoped variable
const firstly = 'hello';

// import { secondly } from './second.js'; // es6
var second = require('./second.js'); // commonjs

console.log(firstly+' '+second.secondly);

second.someThing('hiya')

console.log(global.studentName);

exports.firstly = firstly;
