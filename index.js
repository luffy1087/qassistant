//Dependencies
var ModuleBase = require('./base/base-module');
var PrepareEnv = require('./lib/prepareEnv');
//Inheritance
var ModuleBase = new ModuleBase();
PrepareEnv.prototype = ModuleBase;
//Initialize modules
var prepareEnvironment = new PrepareEnv();
//Start program
baseModule.eventEmitter.on('onArgumentsSet', function() {
    prepareEnvironment.prepareFirstEnvironment();
    prepareEnvironment.prepareSecondEnvironment();
});