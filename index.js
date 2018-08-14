//Dependencies
var ModelBase = require('./model-base');
var Base = require('./base');
var PrepareEnv = require('./prepareEnv');
var ReferencesFixer = require('./referencesFixer');
//Inheritance
var modelBase = new ModelBase();
Base.prototype = modelBase;
var baseModule = new Base();
PrepareEnv.prototype = baseModule;
ReferencesFixer.prototype = baseModule;
//Initialize modules
var prepareEnvironment = new PrepareEnv();
var referencesFixer = new ReferencesFixer();
//Start program
baseModule.eventEmitter.on('onArgumentsSet', function() {
    prepareEnvironment.prepareFirstEnvironment();
    prepareEnvironment.prepareSecondEnvironment();
});