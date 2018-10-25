//Dependencies
var BaseModule = require('./base/base-module');
var PrepareEnv = require('./lib/prepareEnv');
//Inheritance
var baseModule = new BaseModule();
PrepareEnv.prototype = baseModule;
//Initialize modules
var prepareEnvironment = new PrepareEnv();
//Start program
prepareEnvironment.eventEmitter.on('onArgumentsSet', function() {
    prepareEnvironment.prepareFirstEnvironment();
    prepareEnvironment.prepareSecondEnvironment();
});