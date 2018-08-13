//Dependencies
var Base = require('./base');
var PrepareEnv = require('./prepareEnv');
//Inheritance
var baseModule = new Base();
PrepareEnv.prototype = baseModule;
//Initialize modules
var prepareEnvironment = new PrepareEnv();
//Start program
baseModule.eventEmitter.on('onArgumentsSet', function() {
    prepareEnvironment.prepareFirstEnvironment();
    prepareEnvironment.prepareSecondEnvironment();
});