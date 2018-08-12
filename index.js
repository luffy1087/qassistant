//Dependencies
var Base = require('./base');
var PrepareEnv = require('./prepareEnv');
//Inheritance
var baseModule = new Base();
PrepareEnv.prototype = baseModule;
//Initialize modules
var prepareEnvironment = new PrepareEnv();
//Start program
console.log(prepareEnvironment.arguments);
prepareEnvironment.prepareFirstEnvironment();