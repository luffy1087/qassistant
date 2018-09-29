//Dependencies
var ModelBase = require('./model-base');
var Base = require('./base');
var PrepareEnv = require('./prepareEnv');
//Inheritance
var modelBase = new ModelBase();
Base.prototype = modelBase;
var baseModule = new Base();
PrepareEnv.prototype = baseModule;
//Initialize modules
var prepareEnvironment = new PrepareEnv();
//Start program
baseModule.eventEmitter.on('onArgumentsSet', function() {
    prepareEnvironment.prepareFirstEnvironment();
    prepareEnvironment.prepareSecondEnvironment();
});