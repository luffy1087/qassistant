//Dependencies
var ModuleBase = require('./base/base-module');
var PrepareEnv = require('./lib/prepareEnv');
//Inheritance
var moduleBase = new ModuleBase();
PrepareEnv.prototype = moduleBase;
//Initialize modules
var prepareEnvironment = new PrepareEnv();
//Start program
moduleBase.eventEmitter.on('onArgumentsSet', function() {
    prepareEnvironment.prepareFirstEnvironment();
    prepareEnvironment.prepareSecondEnvironment();
});